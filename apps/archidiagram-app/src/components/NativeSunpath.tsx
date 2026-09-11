import React, { useMemo } from 'react'
import * as THREE from 'three'
import { Text, Billboard, Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { getMonthColor } from '../store/useEditorStore'

function ArcLabel({ points, label, sunSize, textSize, color }: any) {
  const textRef = React.useRef<any>(null)

  useFrame(({ camera }) => {
    if (!textRef.current || points.length < 2) return

    const localCameraPos = camera.position.clone()
    if (textRef.current.parent) {
      textRef.current.parent.worldToLocal(localCameraPos)
    }

    let minDist = Infinity
    let bestIdx = 1

    for (let i = 1; i < points.length - 1; i++) {
      if (points[i].y < -0.1) continue
      const dist = points[i].distanceToSquared(localCameraPos)
      if (dist < minDist) {
        minDist = dist
        bestIdx = i
      }
    }

    const p = points[bestIdx]
    const pNext = points[bestIdx + 1] || points[bestIdx]
    const pPrev = points[bestIdx - 1] || points[bestIdx]

    const tangent = new THREE.Vector3().subVectors(pNext, pPrev).normalize()
    const viewDir = new THREE.Vector3().subVectors(localCameraPos, p).normalize()
    
    let xAxis = tangent.clone()
    let zAxis = viewDir.clone()
    let yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis)
    
    if (yAxis.lengthSq() < 0.001) {
      yAxis.set(0, 1, 0)
    }
    yAxis.normalize()
    zAxis.crossVectors(xAxis, yAxis).normalize()

    // Ensure text is never upside down (yAxis always points up)
    if (yAxis.y < 0) {
      xAxis.negate()
      yAxis.negate()
    }

    // Calculate vector perpendicular to the curve on the horizontal plane
    const upVector = new THREE.Vector3(0, 1, 0)
    let horizontalPerpendicular = new THREE.Vector3().crossVectors(tangent, upVector)
    
    // Ensure vector always points away from the center (depends on tangent direction)
    if (horizontalPerpendicular.dot(p) < 0) {
      horizontalPerpendicular.negate()
    }
    horizontalPerpendicular.normalize()
    
    // Set distance so the text edge is sunSize away from the sun path
    const offsetVector = horizontalPerpendicular.multiplyScalar(sunSize + textSize / 2)
    const pos = p.clone().add(offsetVector)
    
    textRef.current.position.copy(pos)

    const mat = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis)
    textRef.current.quaternion.setFromRotationMatrix(mat)
  })

  return (
    // @ts-ignore
    <Text ref={textRef} fontSize={textSize} color={color} anchorX="center" anchorY="middle" suspend={false}>
      {label}
    </Text>
  )
}
import { useEditorStore } from '../store/useEditorStore'

interface NativeSunpathProps {
  color?: string
  opacity?: number
}

export function calculateUtcOffset(longitude: number, latitude: number, mode: 'auto' | 'manual', manualUtc: number) {
  if (mode === 'manual') return manualUtc
  let baseUtc = Math.round(longitude / 15.0)
  if (latitude >= 35 && latitude <= 70 && longitude >= -10 && longitude <= 30) {
    const isUkIe = latitude >= 49 && latitude <= 60 && longitude >= -11 && longitude <= 2
    const isPortugal = latitude >= 36 && latitude <= 42 && longitude >= -10 && longitude <= -6
    if (baseUtc === 0 && !isUkIe && !isPortugal) baseUtc = 1
  }
  return baseUtc
}

export function isDstActive(dayOfYear: number, latitude: number, dstMode: 'auto' | 'on' | 'off') {
  if (dstMode === 'on') return true
  if (dstMode === 'off') return false
  const month = new Date(new Date().getFullYear(), 0, dayOfYear).getMonth() + 1 // 1-12
  if (latitude >= 0) {
    return month >= 4 && month <= 10
  } else {
    return month >= 10 || month <= 3
  }
}

// NOAA Solar Calculations with EoT and Longitude Correction
export function getSunPosition(dayOfYear: number, timeOfDay: number, latitude: number, longitude: number, utcOffset: number, dstMode: 'auto' | 'on' | 'off', radius: number) {
  // DST Adjustment: If DST is active, civil time is 1 hour ahead, so we subtract 1 to get standard time
  let standardTime = timeOfDay
  if (isDstActive(dayOfYear, latitude, dstMode)) {
    standardTime -= 1
  }

  // Equation of Time (EoT)
  const B = THREE.MathUtils.degToRad((360 / 365) * (dayOfYear - 81))
  const EoT = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B) // in minutes
  
  // Time Correction Factor
  const lstMeridian = 15 * utcOffset
  const tc = 4 * (longitude - lstMeridian) + EoT // in minutes
  
  const localSolarTime = standardTime + tc / 60
  
  const latRad = THREE.MathUtils.degToRad(latitude)
  const decDeg = 23.45 * Math.sin(B)
  const decRad = THREE.MathUtils.degToRad(decDeg)
  const hDeg = 15 * (localSolarTime - 12)
  const hRad = THREE.MathUtils.degToRad(hDeg)

  const sinAlpha = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(hRad)
  const elevation = Math.asin(Math.max(-1, Math.min(1, sinAlpha)))

  const y = -Math.cos(decRad) * Math.sin(hRad)
  const x = Math.cos(latRad) * Math.sin(decRad) - Math.sin(latRad) * Math.cos(decRad) * Math.cos(hRad)
  let azimuth = Math.atan2(y, x) // from North

  const rGround = radius * Math.cos(elevation)
  const px = rGround * Math.sin(azimuth)
  const pz = -rGround * Math.cos(azimuth)
  const py = radius * Math.sin(elevation)

  return new THREE.Vector3(px, py, pz)
}

import { getDayOfYear } from './SunLight'

export default function NativeSunpath({ opacity = 1 }: NativeSunpathProps) {
  const { latitude, longitude, activeMonth, monthDates, visibleMonths, monthColorsLight, monthColorsDark, timeOfDay, northOffset, sunpathSettings, timezoneMode, utcOffset, dstMode, shadowsEnabled, uiTheme, globalTextSize } = useEditorStore()

  const safeLat = latitude || 21.0285
  const safeLng = longitude || 105.8542
  const R = 100 // Sky dome radius
  const S = sunpathSettings.sunSize ?? 0.5
  const T = globalTextSize ?? 2

  const calculatedUtcOffset = useMemo(() => calculateUtcOffset(safeLng, safeLat, timezoneMode, utcOffset), [safeLng, safeLat, timezoneMode, utcOffset])

  const monthColors = uiTheme === 'light' ? monthColorsLight : monthColorsDark

  const mainColor = monthColors[13] || '#ff0000'
  const textColor = monthColors[14] || '#233156'
  const compassColor = monthColors[15] || '#233156'
  const skyColor = monthColors[16] || '#ffd700'
  const hourlySunColor = monthColors[18] || '#ffcc00'

  // Dec, Jan/Nov, Feb/Oct, Mar/Sep, Apr/Aug, May/Jul, Jun
  const representativeDays = [355, 325, 295, 265, 235, 205, 172]

  const skyDomeGeo = useMemo(() => {
    const grid = []
    for (const day of representativeDays) {
      const row = []
      for (let h = 4; h <= 20; h += 0.2) {
        const p = getSunPosition(day, h, safeLat, safeLng, calculatedUtcOffset, dstMode, R)
        row.push(p)
      }
      grid.push(row)
    }

    const vertices = []
    const indices = []
    const rows = grid.length
    const cols = grid[0].length

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        vertices.push(grid[r][c].x, grid[r][c].y, grid[r][c].z)
      }
    }

    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        // Remove the skip condition to ensure the skirt touches the ground
        
        const i1 = r * cols + c
        const i2 = (r + 1) * cols + c
        const i3 = r * cols + (c + 1)
        const i4 = (r + 1) * cols + (c + 1)

        indices.push(i1, i2, i3)
        indices.push(i2, i4, i3)
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geo.setIndex(indices)
    geo.computeVertexNormals()
    return geo
  }, [safeLat, safeLng, calculatedUtcOffset, dstMode, R])

  const monthlyArcsData = useMemo(() => {
    const arcs = []
    const monthNamesFull = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const getDayStr = (day: number) => {
      if (day > 3 && day < 21) return day + 'th';
      switch (day % 10) {
        case 1:  return day + "st";
        case 2:  return day + "nd";
        case 3:  return day + "rd";
        default: return day + "th";
      }
    };
    
    for (const m of visibleMonths) {
      const day = getDayOfYear(m, monthDates[m] || 21)
      const points = []
      const suns = []
      for (let h = 4; h <= 20; h += 0.1) {
        const p = getSunPosition(day, h, safeLat, safeLng, calculatedUtcOffset, dstMode, R)
        if (p.y >= -0.5) {
          points.push(p)
        }
      }
      for (let h = 5; h <= 19; h++) {
        const p = getSunPosition(day, h, safeLat, safeLng, calculatedUtcOffset, dstMode, R)
        if (p.y >= -0.5) {
          suns.push({ p, h })
        }
      }
      if (points.length > 1) {
        const isDst = isDstActive(day, safeLat, dstMode)
        const actualUtc = calculatedUtcOffset + (isDst ? 1 : 0)
        const utcString = actualUtc >= 0 ? `+${actualUtc}` : `${actualUtc}`
        arcs.push({
          month: m,
          points: points,
          suns: suns,
          label: `${monthNamesFull[m - 1]} ${getDayStr(monthDates[m] || 21)} (UTC${utcString})`,
          color: getMonthColor(m, safeLat, monthColors)
        })
      }
    }
    return arcs
  }, [safeLat, safeLng, calculatedUtcOffset, dstMode, R, visibleMonths, monthDates, monthColors])

  const currentDateArc = useMemo(() => {
    // Only generate if activeMonth is not in visibleMonths to avoid duplicate rendering
    if (visibleMonths.includes(activeMonth)) return []
    const points = []
    const day = getDayOfYear(activeMonth, monthDates[activeMonth] || 21)
    for (let h = 4; h <= 20; h += 0.1) {
      const p = getSunPosition(day, h, safeLat, safeLng, calculatedUtcOffset, dstMode, R)
      if (p.y >= -0.5) points.push(p)
    }
    return points
  }, [activeMonth, monthDates, visibleMonths, safeLat, safeLng, calculatedUtcOffset, dstMode, R])

  const currentSun = useMemo(() => {
    const day = getDayOfYear(activeMonth, monthDates[activeMonth] || 21)
    return getSunPosition(day, timeOfDay, safeLat, safeLng, calculatedUtcOffset, dstMode, R)
  }, [activeMonth, monthDates, timeOfDay, safeLat, safeLng, calculatedUtcOffset, dstMode, R])


  // Compass generation - Standard 16 points
  const compassGeoData = useMemo(() => {
    const points = [
      { angle: 0, label: 'N' }, { angle: 22.5, label: 'NNE' },
      { angle: 45, label: 'NE' }, { angle: 67.5, label: 'ENE' },
      { angle: 90, label: 'E' }, { angle: 112.5, label: 'ESE' },
      { angle: 135, label: 'SE' }, { angle: 157.5, label: 'SSE' },
      { angle: 180, label: 'S' }, { angle: 202.5, label: 'SSW' },
      { angle: 225, label: 'SW' }, { angle: 247.5, label: 'WSW' },
      { angle: 270, label: 'W' }, { angle: 292.5, label: 'WNW' },
      { angle: 315, label: 'NW' }, { angle: 337.5, label: 'NNW' }
    ]
    
    const lines = []
    const labels = []
    
    const outerPts = []
    const innerPts = []
    const outerR = R + T * 2
    for (let i = 0; i <= 360; i += 2) {
      const rad = THREE.MathUtils.degToRad(i)
      outerPts.push(new THREE.Vector3(outerR * Math.sin(rad), 0, -outerR * Math.cos(rad)))
      innerPts.push(new THREE.Vector3(R * Math.sin(rad), 0, -R * Math.cos(rad)))
    }
      lines.push(outerPts)
      lines.push(innerPts)
      
      for (const pt of points) {
        const rad = THREE.MathUtils.degToRad(pt.angle)
        const p1 = new THREE.Vector3(R * Math.sin(rad), 0, -R * Math.cos(rad))
        const p2 = new THREE.Vector3(outerR * Math.sin(rad), 0, -outerR * Math.cos(rad))
        lines.push([p1, p2])
      
      const labelPos = new THREE.Vector3((outerR + T * 1.5) * Math.sin(rad), 0, -(outerR + T * 1.5) * Math.cos(rad))
      labels.push({ pos: labelPos, text: pt.label, angle: pt.angle })
    }
    
    return { lines, labels }
  }, [R, T])

  return (
    <group rotation={[0, THREE.MathUtils.degToRad(northOffset || 0), 0]}>
      {sunpathSettings.showCompass && (
        <group>
          {compassGeoData.lines.map((pts, i) => (
            <Line key={`compass-line-${i}`} points={pts} color={compassColor} transparent opacity={opacity} lineWidth={sunpathSettings.compassThickness ?? 1} />
          ))}
          
          {compassGeoData.labels.map((lbl, i) => (
            <group key={`compass-lbl-${i}`} position={lbl.pos} rotation={[0, -THREE.MathUtils.degToRad(lbl.angle), 0]}>
              {/* @ts-ignore */}
              <Text fontSize={T * 1.2} color={compassColor} rotation={[-Math.PI / 2, 0, 0]} depthOffset={-1} suspend={false}>
                {lbl.text}
              </Text>
            </group>
          ))}
        </group>
      )}

      {sunpathSettings.showSky && (
        <mesh geometry={skyDomeGeo}>
          <meshBasicMaterial 
            color={skyColor} 
            side={THREE.DoubleSide} 
            transparent 
            opacity={0.15 * opacity} 
            depthWrite={false} 
            clippingPlanes={[new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.0)]}
          />
        </mesh>
      )}

      {sunpathSettings.showMonths && monthlyArcsData.map((arc, i) => (
        <group key={`arc-${i}`}>
          <Line points={arc.points} color={arc.color} transparent opacity={0.4 * opacity} lineWidth={sunpathSettings.sunpathThickness ?? 1} dashed={true} dashScale={1} dashSize={S * (sunpathSettings.sunpathDashSize ?? 2)} gapSize={S * (sunpathSettings.sunpathDashSize ?? 2)} />
          
          {sunpathSettings.showHourlySun && arc.suns.map((sun, j) => (
            <group key={`h-${i}-${j}`} position={sun.p}>
              <mesh>
                <sphereGeometry args={[S, 16, 16]} />
                <meshStandardMaterial color={hourlySunColor} transparent opacity={0.8 * opacity} />
              </mesh>
              {sunpathSettings.showText && (
                <Billboard position={[0, S * 2.5, 0]}>
                  {/* @ts-ignore */}
                  <Text fontSize={T * 1.2} color={textColor} suspend={false}>
                    {`${sun.h}h`}
                  </Text>
                </Billboard>
              )}
            </group>
          ))}
          
          {sunpathSettings.showText && (
            <ArcLabel points={arc.points} label={arc.label} sunSize={S} textSize={T} color={textColor} />
          )}
        </group>
      ))}

      {currentDateArc.length > 1 && (
        <Line points={currentDateArc} color={mainColor} transparent opacity={0.8 * opacity} lineWidth={sunpathSettings.sunpathThickness ?? 1} dashed={true} dashScale={1} dashSize={S * (sunpathSettings.sunpathDashSize ?? 2)} gapSize={S * (sunpathSettings.sunpathDashSize ?? 2)} />
      )}

      {currentSun.y >= -0.5 && (
        <group position={currentSun}>
          <mesh name="SUN-POSITION">
            <sphereGeometry args={[S * 1.3, 32, 32]} />
            <meshStandardMaterial color={mainColor} transparent opacity={opacity} emissive={mainColor} emissiveIntensity={0.5} />
          </mesh>
          <pointLight color={mainColor} intensity={2} distance={R * 3} castShadow={shadowsEnabled} />
        </group>
      )}

    </group>
  )
}

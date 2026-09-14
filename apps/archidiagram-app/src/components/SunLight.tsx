import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { getSunPosition, calculateUtcOffset } from './NativeSunpath'
import { useEditorStore } from '../store/useEditorStore'

export function getDayOfYear(month: number, date: number) {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  let doy = 0
  for (let i = 0; i < month - 1; i++) {
    doy += daysInMonth[i]
  }
  return doy + date
}

export default function SunLight() {
  const { latitude, longitude, activeMonth, monthDates, timeOfDay, northOffset, shadowsEnabled, timezoneMode, utcOffset, dstMode, mapRadius } = useEditorStore()
  
  const calculatedUtcOffset = useMemo(() => calculateUtcOffset(longitude || 105.8542, latitude || 21.0285, timezoneMode, utcOffset), [longitude, latitude, timezoneMode, utcOffset])

  const sunPosition = useMemo(() => {
    // Use the same algorithm as NativeSunpath to ensure timezone sync!
    const day = getDayOfYear(activeMonth || 6, monthDates?.[activeMonth] ?? 21)
    const pos = getSunPosition(day, timeOfDay, latitude || 21.0285, longitude || 105.8542, calculatedUtcOffset, dstMode, 100)
    
    // Xoay theo True North
    const northOffsetRad = THREE.MathUtils.degToRad(northOffset)
    pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), northOffsetRad)
    
    return pos
  }, [latitude, longitude, activeMonth, monthDates, timeOfDay, northOffset, calculatedUtcOffset, dstMode])
  
  // Use Ref to update Directional light position without causing constant parent component re-renders
  const lightRef = useRef<THREE.DirectionalLight>(null)
  
  useEffect(() => {
    if (lightRef.current) {
      lightRef.current.position.copy(sunPosition)
      lightRef.current.target.position.set(0, 0, 0)
      lightRef.current.target.updateMatrixWorld()
    }
  }, [sunPosition])

  useEffect(() => {
    if (lightRef.current && lightRef.current.shadow) {
      // Force high resolution
      lightRef.current.shadow.mapSize.set(4096, 4096)
      if (lightRef.current.shadow.map) {
        lightRef.current.shadow.map.dispose()
        lightRef.current.shadow.map = null as any
      }
      
      // Dynamically update frustum
      const cam = lightRef.current.shadow.camera
      cam.left = -mapRadius
      cam.right = mapRadius
      cam.top = mapRadius
      cam.bottom = -mapRadius
      cam.near = 0.5
      cam.far = 1000
      cam.updateProjectionMatrix()
    }
  }, [mapRadius])

  // If the sun sets (y < 0), we can reduce intensity or turn it off to avoid bottom-up lighting
  const isNight = sunPosition.y < 0
  const intensity = isNight ? 0 : 2.5

  return (
    <>
      <directionalLight
        ref={lightRef}
        castShadow={shadowsEnabled}
        intensity={intensity}
        shadow-bias={-0.00001}
        shadow-normalBias={0.01}
      />
    </>
  )
}

import { useRef, useMemo, Suspense, useEffect } from 'react'
import { useGLTF, TransformControls, useHelper } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEditorStore } from '../store/useEditorStore'
import * as THREE from 'three'
import { ErrorBoundary } from './ErrorBoundary'
import NativeSunpath, { getSunPosition, calculateUtcOffset } from './NativeSunpath'
import { getDayOfYear } from './SunLight'

function Animator({ scene1, scene2, isAnimated, animationSpeed = 2, url }: { scene1: THREE.Group, scene2?: THREE.Group, isAnimated?: boolean, animationSpeed?: number, url: string }) {
  const isCenterExpand = useMemo(() => {
    const upper = url.toUpperCase()
    return upper.includes('CIRCLE') || upper.includes('NOISE') || upper.includes('STORM')
  }, [url])

  const s = Math.SQRT1_2 // 0.70710678...
  
  // Planes cho Phase 1 (Mọc từ tâm - clipIntersection = false) - 8 hướng (Bát giác)
  const planes1Ref = useRef([
    new THREE.Plane(new THREE.Vector3(1, 0, 0), 0),
    new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0),
    new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
    new THREE.Plane(new THREE.Vector3(0, 0, -1), 0),
    new THREE.Plane(new THREE.Vector3(s, 0, s), 0),
    new THREE.Plane(new THREE.Vector3(-s, 0, s), 0),
    new THREE.Plane(new THREE.Vector3(s, 0, -s), 0),
    new THREE.Plane(new THREE.Vector3(-s, 0, -s), 0)
  ])

  // Planes cho Phase 2 (Biến mất từ tâm - clipIntersection = true) - 8 hướng ngược lại
  const planes2Ref = useRef([
    new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0),
    new THREE.Plane(new THREE.Vector3(1, 0, 0), 0),
    new THREE.Plane(new THREE.Vector3(0, 0, -1), 0),
    new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
    new THREE.Plane(new THREE.Vector3(-s, 0, -s), 0),
    new THREE.Plane(new THREE.Vector3(s, 0, -s), 0),
    new THREE.Plane(new THREE.Vector3(-s, 0, s), 0),
    new THREE.Plane(new THREE.Vector3(s, 0, s), 0)
  ])

  const dirRef = useRef(new THREE.Vector3(0, 0, 1))
  const coordsRef = useRef({ start: 0, end: 0 })
  const maxRadiusRef = useRef(0)

  useEffect(() => {
    if (!isAnimated) {
      scene1.traverse((child: any) => {
        if (child.isMesh && child.material) {
          child.material.clippingPlanes = []
          child.material.clipShadows = false
          child.material.needsUpdate = true
        }
      })
      if (scene2) scene2.visible = false
      scene1.visible = true
      return
    }

    scene1.traverse((child: any) => {
      if (child.isMesh && child.material) {
        child.material.clippingPlanes = isCenterExpand ? planes1Ref.current : [planes1Ref.current[0]]
        child.material.clipShadows = true
        child.material.needsUpdate = true
      }
    })

    if (isCenterExpand && scene2) {
      scene2.traverse((child: any) => {
        if (child.isMesh && child.material) {
          child.material.clippingPlanes = planes2Ref.current
          child.material.clipShadows = true
          child.material.needsUpdate = true
        }
      })
    }

    scene1.updateMatrixWorld(true)
    const sceneInverse = scene1.matrixWorld.clone().invert()

    if (isCenterExpand) {
      let maxR = 0
      scene1.traverse((child: any) => {
        if (child.isMesh && child.geometry && child.geometry.attributes.position) {
          const posAttr = child.geometry.attributes.position
          for (let i = 0; i < posAttr.count; i++) {
            const v = new THREE.Vector3().fromBufferAttribute(posAttr, i)
            v.applyMatrix4(child.matrixWorld).applyMatrix4(sceneInverse)
            const r = Math.max(Math.abs(v.x), Math.abs(v.z))
            if (r > maxR) maxR = r
          }
        }
      })
      maxRadiusRef.current = maxR * 1.05 
    } else {
      let maxDistSq = 0
      let tailLocal = new THREE.Vector3()
      const vertices: THREE.Vector3[] = []

      scene1.traverse((child: any) => {
        if (child.isMesh && child.geometry && child.geometry.attributes.position) {
          const posAttr = child.geometry.attributes.position
          for (let i = 0; i < posAttr.count; i++) {
            const v = new THREE.Vector3().fromBufferAttribute(posAttr, i)
            v.applyMatrix4(child.matrixWorld).applyMatrix4(sceneInverse)
            vertices.push(v)
            
            const distSq = v.lengthSq()
            if (distSq > maxDistSq) {
              maxDistSq = distSq
              tailLocal.copy(v)
            }
          }
        }
      })

      const N = tailLocal.clone().normalize()
      if (N.lengthSq() === 0) N.set(0, 0, 1) 
      
      let tip_d = Infinity
      let tail_d = -Infinity
      for (const v of vertices) {
        const d = v.dot(N)
        if (d < tip_d) tip_d = d
        if (d > tail_d) tail_d = d
      }

      const L_total = tail_d - tip_d
      const margin = L_total * 0.05 
      coordsRef.current = { start: tail_d + margin, end: tip_d - margin }
      dirRef.current.copy(N)
    }
  }, [scene1, scene2, isAnimated, isCenterExpand])

  useFrame(() => {
    if (!isAnimated) return
    const durationMs = animationSpeed * 1000
    const t = (Date.now() % durationMs) / durationMs
    let p = 0

    if (isCenterExpand && scene2) {
      const R = maxRadiusRef.current
      let d = 0
      let phase = 1

      if (t < 0.4) {
        p = t / 0.4
        d = THREE.MathUtils.lerp(-0.01, R, p)
        phase = 1
      } else if (t < 0.5) {
        d = R
        phase = 1
      } else if (t < 0.9) {
        p = (t - 0.5) / 0.4
        // Chuyển động biến mất từ tâm ra: lỗ hổng ở giữa to dần từ 0 đến R
        d = THREE.MathUtils.lerp(-0.01, R, p)
        phase = 2
      } else {
        d = R
        phase = 2
      }

      if (phase === 1) {
        scene1.visible = true
        scene2.visible = false
        
        const normals1 = [
          new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0),
          new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1),
          new THREE.Vector3(s, 0, s), new THREE.Vector3(-s, 0, s),
          new THREE.Vector3(s, 0, -s), new THREE.Vector3(-s, 0, -s)
        ]
        
        for (let i = 0; i < 8; i++) {
          const p = new THREE.Plane(normals1[i], d)
          planes1Ref.current[i].copy(p).applyMatrix4(scene1.matrixWorld)
        }
      } else {
        scene1.visible = false
        scene2.visible = true
        
        const normals2 = [
          new THREE.Vector3(-1, 0, 0), new THREE.Vector3(1, 0, 0),
          new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, 1),
          new THREE.Vector3(-s, 0, -s), new THREE.Vector3(s, 0, -s),
          new THREE.Vector3(-s, 0, s), new THREE.Vector3(s, 0, s)
        ]
        
        for (let i = 0; i < 8; i++) {
          const p = new THREE.Plane(normals2[i], -d)
          planes2Ref.current[i].copy(p).applyMatrix4(scene1.matrixWorld)
        }
      }
    } else {
      const { start, end } = coordsRef.current
      const N = dirRef.current
      const localPlane = new THREE.Plane()
      
      if (t < 0.4) {
        p = t / 0.4
        localPlane.normal.copy(N).negate()
        localPlane.constant = THREE.MathUtils.lerp(start, end, p)
      } else if (t < 0.5) {
        localPlane.normal.copy(N).negate()
        localPlane.constant = end
      } else if (t < 0.9) {
        p = (t - 0.5) / 0.4
        localPlane.normal.copy(N)
        localPlane.constant = -THREE.MathUtils.lerp(start, end, p)
      } else {
        localPlane.normal.copy(N)
        localPlane.constant = -end
      }

      planes1Ref.current[0].copy(localPlane).applyMatrix4(scene1.matrixWorld)
    }
  })

  return null
}

function ModelMesh({ url, color, opacity = 1, id, isAnimated, animationSpeed, castShadow = false }: { url: string, color?: string, opacity?: number, id: string, isAnimated?: boolean, animationSpeed?: number, castShadow?: boolean }) {
  const { invalidate } = useThree()
  const gltf = useGLTF(url)
  const { latitude, longitude, activeMonth, monthDates, timeOfDay, northOffset, timezoneMode, utcOffset, dstMode, sunpathSettings } = useEditorStore()
  
  const isDaytime = useMemo(() => {
    const safeLat = latitude || 21.0285
    const safeLng = longitude || 105.8542
    const safeTime = timeOfDay || 12
    const currentUtc = calculateUtcOffset(safeLng, safeLat, timezoneMode, utcOffset)
    const day = getDayOfYear(activeMonth || 6, monthDates?.[activeMonth] ?? 21)
    const sunPos = getSunPosition(day, safeTime, safeLat, safeLng, currentUtc, dstMode, 100)
    return sunPos.y >= -0.5 // If sun is above horizon
  }, [latitude, longitude, activeMonth, monthDates, timeOfDay, timezoneMode, utcOffset, dstMode])
  
  const isCenterExpand = useMemo(() => {
    const upper = url.toUpperCase()
    return upper.includes('CIRCLE') || upper.includes('NOISE') || upper.includes('STORM')
  }, [url])

  const isSunpath = useMemo(() => url.toUpperCase().includes('SUNPATH'), [url])
  const sunpathClipPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.1), [])

  const scene1 = useMemo(() => {
    const cloned = gltf.scene.clone()
    cloned.traverse((child: any) => {
      child.userData = { ...child.userData, id }
      if (child.isMesh || child.isLine || child.isLineSegments) {
        if (child.isMesh) {
          child.castShadow = isSunpath ? false : castShadow
          child.receiveShadow = isSunpath ? false : true
        }
        
        if (child.material) {
          child.material = child.material.clone()
          
          const materials = Array.isArray(child.material) ? child.material : [child.material]
          
          const isDefaultWhite = color && color.toLowerCase() === '#ffffff'
          
          materials.forEach((mat: any) => {
            if (color) {
              if (isSunpath && isDefaultWhite) {
                // If sunpath and color is default white:
                // Only color the lines white (because SketchUp lines are black and won't show on dark bg)
                if (child.isLine || child.isLineSegments) {
                  if (mat.color) mat.color.set(color)
                }
              } else if (!isSunpath && isDefaultWhite && (child.isLine || child.isLineSegments)) {
                // For normal models in "negative mode" (white):
                // Change edges to dark blue if daytime, else white
                if (mat.color) {
                  if (isDaytime) {
                    mat.color.setRGB(35/255, 49/255, 86/255)
                  } else {
                    mat.color.set(color)
                  }
                }
              } else {
                // Otherwise apply chosen color to everything
                if (mat.color) mat.color.set(color)
              }
            }
            
            if (child.isMesh) {
              mat.side = THREE.DoubleSide
              mat.clipIntersection = false
            }
            
            if (opacity < 1) {
              mat.transparent = true
              mat.opacity = opacity
            } else {
              mat.transparent = false
              mat.opacity = 1
            }
            
            if (isSunpath) {
              mat.clippingPlanes = [sunpathClipPlane]
              mat.clipShadows = false
              mat.needsUpdate = true
            }
          })
        }
      }
    })
    return cloned
  }, [gltf, color, opacity, id, castShadow, isSunpath, sunpathClipPlane])

  const scene2 = useMemo(() => {
    if (!isCenterExpand) return null
    const cloned = gltf.scene.clone()
    cloned.traverse((child: any) => {
      child.userData = { ...child.userData, id }
      if (child.isMesh) {
        child.castShadow = castShadow
        child.receiveShadow = true
        
        if (child.material) {
          child.material = child.material.clone()
          if (color) child.material.color.set(color)
          child.material.side = THREE.DoubleSide 
          child.material.clipIntersection = true 
          
          if (opacity < 1) {
            child.material.transparent = true
            child.material.opacity = opacity
          } else {
            child.material.transparent = false
            child.material.opacity = 1
          }
        }
      }
    })
    return cloned
  }, [gltf, color, opacity, id, isCenterExpand, castShadow, isDaytime])

  useEffect(() => {
    const upperUrl = (url || '').toUpperCase()
    if (upperUrl.includes('SUNPATH')) {
      const safeLat = latitude || 21.0285
      const safeNorth = northOffset || 0
      const latRad = THREE.MathUtils.degToRad(safeLat)
      const northRad = THREE.MathUtils.degToRad(safeNorth)
      
      scene1.rotation.set(0, northRad, 0)
      
      const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']
      const rotatingNodes = new Set()

      scene1.traverse((child: any) => {
        if (child === scene1) return
        
        // Save original transforms once for pivot math
        if (!child.userData.originalPosition) {
           child.userData.originalPosition = child.position.clone()
           child.userData.originalQuaternion = child.quaternion.clone()
        }

        const name = (child.name || '').toUpperCase()

        // Apply Toggles from sunpathSettings
        if (sunpathSettings) {
          if (name.includes('SKY')) child.visible = sunpathSettings.showSky
          else if (name.includes('COMPASS')) child.visible = sunpathSettings.showCompass
          else if (months.some(m => name.includes(m))) child.visible = sunpathSettings.showMonths
          else if (name.includes('DASHLINE') || name.includes('ANALEMMA')) child.visible = sunpathSettings.showAnalemma
          else if (name.includes('HOURLY') || name.includes('SUN-POSITION') || name.includes('SUN_POSITION')) child.visible = sunpathSettings.showHourlySun
          else if (name.includes('TEXT') || name.includes('LABEL')) child.visible = sunpathSettings.showText
        }

        // Avoid double rotation: if parent is already rotated, child naturally inherits it
        if (rotatingNodes.has(child.parent)) {
           rotatingNodes.add(child)
           return
        }

        // Identify components that should rotate based on latitude
        const shouldRotate = name.includes('SKY') || 
                             months.some(m => name.includes(m)) || 
                             name.includes('DASHLINE') || 
                             name.includes('ANALEMMA') || 
                             name.includes('HOURLY') || 
                             name.includes('SUN-POSITION') || 
                             name.includes('SUN_POSITION')

        if (shouldRotate) {
           rotatingNodes.add(child)
           
           // Restore to original before applying new rotation
           child.position.copy(child.userData.originalPosition)
           child.quaternion.copy(child.userData.originalQuaternion)
           
           // Orbit around parent's origin (0,0,0)
           child.position.applyAxisAngle(new THREE.Vector3(1, 0, 0), latRad)
           
           // Rotate orientation in parent space
           const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), latRad)
           child.quaternion.premultiply(q)
        }
      })
      
      invalidate() // Force a re-render to reflect visibility changes
    }
  }, [scene1, latitude, northOffset, url, sunpathSettings, invalidate])

  const boundingBox = useMemo(() => {
    // Clone scene to calculate correct initial bounding box without scaling issues
    const tempScene = scene1.clone()
    const box = new THREE.Box3().setFromObject(tempScene)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    
    // Make sure we have a minimum size for flat planes or lines
    if (size.x < 0.1) size.x = 2
    if (size.y < 0.1) size.y = 2
    if (size.z < 0.1) size.z = 2
    
    return { size, center }
  }, [scene1])

  useEffect(() => {
    // Dọn dẹp bộ nhớ (Garbage Collection) cho GPU khi xoá đối tượng
    return () => {
      scene1.traverse((child: any) => {
        if (child.isMesh && child.material) child.material.dispose()
      })
      if (scene2) {
        scene2.traverse((child: any) => {
          if (child.isMesh && child.material) child.material.dispose()
        })
      }
    }
  }, [scene1, scene2])

  return (
    <>
      <primitive key={`${url}-1`} object={scene1} />
      {scene2 && <primitive key={`${url}-2`} object={scene2} />}
      <Animator scene1={scene1} scene2={scene2 || undefined} isAnimated={isAnimated} animationSpeed={animationSpeed} url={url} />
      
      {/* Hitbox cho việc chọn dễ dàng hơn */}
      <mesh position={boundingBox.center}>
        <boxGeometry args={[boundingBox.size.x * 1.5, boundingBox.size.y * 1.5, boundingBox.size.z * 1.5]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </>
  )
}

interface ModelLoaderProps {
  id: string
  url: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  color?: string
  opacity?: number
  castShadow?: boolean
}

let isCtrlPressed = false
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', e => { if (e.key === 'Control' || e.metaKey) isCtrlPressed = true })
  window.addEventListener('keyup', e => { if (e.key === 'Control' || e.metaKey) isCtrlPressed = false })
  // Đảm bảo không bị kẹt phím nếu đổi cửa sổ
  window.addEventListener('blur', () => { isCtrlPressed = false })
}

export default function ModelLoader({ id, url, position, rotation, scale, color, opacity, castShadow }: ModelLoaderProps) {
  const transformMode = useEditorStore((state) => state.transformMode)
  const selectedIds = useEditorStore((state) => state.selectedIds)
  const setSelectedIds = useEditorStore((state) => state.setSelectedIds)
  const updateObjectTransform = useEditorStore((state) => state.updateObjectTransform)
  const objects = useEditorStore((state) => state.objects)
  
  const isSelected = selectedIds.includes(id)
  const isSingleSelection = isSelected && selectedIds.length === 1
  
  const objData = objects.find(o => o.id === id)
  const isAnimated = objData?.isAnimated
  const animationSpeed = objData?.animationSpeed
  const objOpacity = objData?.opacity ?? opacity ?? 1
  const objCastShadow = objData?.castShadow ?? castShadow ?? false
  
  const groupRef = useRef<THREE.Group>(null)
  
  useHelper(isSelected ? (groupRef as any) : null, THREE.BoxHelper, '#3b82f6')

  const handleTransformStart = () => {
    if (isCtrlPressed && isSingleSelection) {
      useEditorStore.getState().duplicateObjects([id])
    }
  }
  
  const handleTransformEnd = () => {
    if (groupRef.current && isSingleSelection) {
      const p = groupRef.current.position
      const r = groupRef.current.rotation
      const s = groupRef.current.scale
      updateObjectTransform(id, [p.x, p.y, p.z], [r.x, r.y, r.z], [s.x, s.y, s.z])
      
      if (url.toUpperCase().includes('SUNPATH')) {
        let deg = Math.round(THREE.MathUtils.radToDeg(r.y))
        // Normalize between -180 and 180
        deg = ((deg + 180) % 360 + 360) % 360 - 180
        useEditorStore.getState().setEnvironment({ northOffset: deg })
      }
    }
  }

  return (
    <>
      {isSingleSelection && ['translate', 'rotate', 'scale'].includes(transformMode) && (
        <TransformControls 
          object={groupRef as any} 
          mode={transformMode as 'translate' | 'rotate' | 'scale'}
          onMouseDown={handleTransformStart}
          onMouseUp={handleTransformEnd}
        />
      )}
      
      <group 
        ref={groupRef}
        position={position}
        rotation={rotation}
        scale={scale}
        onClick={(e: any) => {
          e.stopPropagation()
          if (e.shiftKey) {
            setSelectedIds(selectedIds.includes(id) ? selectedIds.filter(s => s !== id) : [...selectedIds, id])
          } else {
            setSelectedIds([id])
          }
        }}
        onPointerMissed={(e: any) => {
          if (e.type === 'click' && isSelected && !e.shiftKey) {
            setSelectedIds([])
          }
        }}
      >
        <ErrorBoundary fallbackRender={() => (
          <group>
            <mesh>
              <boxGeometry args={[10, 10, 10]} />
              <meshStandardMaterial color="red" />
            </mesh>
          </group>
        )} onError={(err) => console.error("ModelMesh Crash:", err)}>
          <Suspense fallback={null}>
            {url.toUpperCase().includes('SUNPATH') ? (
              <NativeSunpath color={color} opacity={objOpacity} />
            ) : (
              <ModelMesh url={url} color={color} opacity={objOpacity} castShadow={objCastShadow} id={id} isAnimated={isAnimated} animationSpeed={animationSpeed} />
            )}
          </Suspense>
        </ErrorBoundary>
      </group>
    </>
  )
}

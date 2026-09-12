import { useRef, useMemo, Suspense, useEffect, useState } from 'react'
import { TransformControls, useHelper, Html, useGLTF, useCursor } from '@react-three/drei'
import { SVGLoader } from 'three-stdlib'
import { useFrame } from '@react-three/fiber'
import { useEditorStore } from '../store/useEditorStore'
import * as THREE from 'three'

import { ErrorBoundary } from './ErrorBoundary'
import NativeSunpath from './NativeSunpath'

const ForceUpdateFallback = () => {
  return (
    <Html center>
      <div style={{ color: 'white', background: 'rgba(0,0,0,0.8)', padding: '5px 10px', borderRadius: '4px', whiteSpace: 'nowrap', fontSize: '14px', pointerEvents: 'none' }}>
        Loading / Downloading Fonts...
      </div>
    </Html>
  )
}

function Animator({ scene1, scene2, isAnimated, animationSpeed = 1, isCenterExpand }: { scene1: THREE.Group, scene2?: THREE.Group, isAnimated?: boolean, animationSpeed?: number, isCenterExpand: boolean }) {
  const maxRadiusRef = useRef(0)
  const mats1Ref = useRef<any[]>([])
  const mats2Ref = useRef<any[]>([])
  
  useEffect(() => {
    const mats1: any[] = []
    const mats2: any[] = []

    scene1.traverse((child: any) => {
      if (child.isMesh && child.material && child.material.userData && child.material.userData.uClipPhase) {
        mats1.push(child.material)
      }
    })
    if (scene2) {
      scene2.traverse((child: any) => {
        if (child.isMesh && child.material && child.material.userData && child.material.userData.uClipPhase) {
          mats2.push(child.material)
        }
      })
    }
    mats1Ref.current = mats1
    mats2Ref.current = mats2

    if (!isAnimated) {
      mats1.forEach(m => m.userData.uClipPhase.value = 0)
      mats2.forEach(m => m.userData.uClipPhase.value = -1)
      scene1.visible = true
      if (scene2) scene2.visible = true
      return
    }

    let maxR = 0
    scene1.traverse((child: any) => {
      if (child.isMesh && child.geometry && child.geometry.attributes.position) {
        const posAttr = child.geometry.attributes.position
        for (let i = 0; i < posAttr.count; i++) {
          const x = posAttr.getX(i)
          const y = posAttr.getY(i)
          const r = isCenterExpand ? Math.sqrt(x*x + y*y) : Math.abs(x)
          if (r > maxR) maxR = r
        }
      }
    })
    maxRadiusRef.current = maxR * 1.05 

    // Prevent Three.js auto-hide/show lag
    scene1.visible = true
    if (scene2) scene2.visible = true
  }, [scene1, scene2, isAnimated, isCenterExpand])

  useFrame((state) => {
    const update = (mats: any[], phase: number, radius: number, linearX: number) => {
      for (let i = 0; i < mats.length; i++) {
        mats[i].userData.uClipPhase.value = phase
        mats[i].userData.uClipRadius.value = radius
        mats[i].userData.uLinearClipX.value = linearX
      }
    }

    if (!isAnimated) {
      update(mats1Ref.current, 0, 0, 0)
      if (scene2) update(mats2Ref.current, -1, 0, 0)
      return
    }

    const t = (state.clock.elapsedTime * animationSpeed) % 1
    const R = maxRadiusRef.current

    if (isCenterExpand) {
      if (t < 0.4) {
        update(mats1Ref.current, 1, (t / 0.4) * R, 0)
        update(mats2Ref.current, -1, 0, 0)
      } else if (t < 0.5) {
        update(mats1Ref.current, 1, R, 0)
        update(mats2Ref.current, -1, 0, 0)
      } else if (t < 0.9) {
        update(mats1Ref.current, -1, 0, 0)
        update(mats2Ref.current, 2, ((t - 0.5) / 0.4) * R, 0)
      } else {
        update(mats1Ref.current, -1, 0, 0)
        update(mats2Ref.current, -1, 0, 0)
      }
    } else {
      if (t < 0.4) {
        update(mats1Ref.current, 3, 0, R - (t / 0.4) * (2 * R))
        update(mats2Ref.current, -1, 0, 0)
      } else if (t < 0.5) {
        update(mats1Ref.current, 3, 0, -R)
        update(mats2Ref.current, -1, 0, 0)
      } else if (t < 0.9) {
        update(mats1Ref.current, 4, 0, R - ((t - 0.5) / 0.4) * (2 * R))
        update(mats2Ref.current, -1, 0, 0)
      } else {
        update(mats1Ref.current, -1, 0, 0)
        update(mats2Ref.current, -1, 0, 0)
      }
    }
  })

  return null
}

export function SvgMesh({ url, color, opacity = 1, id, isAnimated, animationSpeed = 1 }: { url: string, color?: string, opacity?: number, id: string, isAnimated?: boolean, animationSpeed?: number }) {
  const uiTheme = useEditorStore(state => state.uiTheme)
  const isLight = uiTheme === 'light'
  const [svg, setSvg] = useState<any>(null)
  
  const isCenterExpand = useMemo(() => {
    const upper = url.toUpperCase()
    return !(upper.includes('ARROW') || upper.includes('WIND'))
  }, [url])
  
  useEffect(() => {
    const loader = new SVGLoader()
    loader.load(url, (data) => setSvg(data), undefined, (err) => {
      console.error("SVGLoader error:", err)
    })
  }, [url])

  const createScene = () => {
    const group = new THREE.Group()
    let boundingBox = new THREE.Box3()
    if (!svg) return group
    
    const createMaterial = (colorVal: string) => {
      const matOpacity = opacity
      const mat = new THREE.MeshBasicMaterial({
        color: colorVal,
        side: THREE.DoubleSide,
        opacity: matOpacity,
        transparent: matOpacity < 1,
        depthWrite: matOpacity === 1,
      })
      mat.userData = {
        uClipPhase: { value: 0 },
        uClipRadius: { value: 0 },
        uLinearClipX: { value: 0 },
      }
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uClipPhase = mat.userData.uClipPhase
        shader.uniforms.uClipRadius = mat.userData.uClipRadius
        shader.uniforms.uLinearClipX = mat.userData.uLinearClipX
        
        shader.vertexShader = `
          varying vec3 vLocalPosition;
          ${shader.vertexShader}
        `.replace(
          `#include <begin_vertex>`,
          `#include <begin_vertex>
          vLocalPosition = position;
          `
        )
        
        shader.fragmentShader = `
          uniform int uClipPhase;
          uniform float uClipRadius;
          uniform float uLinearClipX;
          varying vec3 vLocalPosition;
          ${shader.fragmentShader}
        `.replace(
          `#include <clipping_planes_fragment>`,
          `#include <clipping_planes_fragment>
          if (uClipPhase == -1) {
            discard;
          } else if (uClipPhase == 1) {
            if (length(vLocalPosition.xy) > uClipRadius) discard;
          } else if (uClipPhase == 2) {
            if (length(vLocalPosition.xy) < uClipRadius) discard;
          } else if (uClipPhase == 3) {
            if (vLocalPosition.x < uLinearClipX) discard;
          } else if (uClipPhase == 4) {
            if (vLocalPosition.x > uLinearClipX) discard;
          }
          `
        )
      }
      return mat
    }

    svg.paths.forEach((path: any) => {
      const fillColor = path.userData?.style?.fill
      const isFill = fillColor !== undefined && fillColor !== 'none'
      const strokeColor = path.userData?.style?.stroke
      const isStroke = strokeColor !== undefined && strokeColor !== 'none'
      
      if (isFill) {
        const material = createMaterial(color || (isLight ? 'rgb(35, 49, 86)' : fillColor))
        const shapes = SVGLoader.createShapes(path as any)
        shapes.forEach((shape: any) => {
          const geometry = new THREE.ShapeGeometry(shape, 64)
          geometry.computeBoundingBox()
          if (geometry.boundingBox) boundingBox.union(geometry.boundingBox)
          const mesh = new THREE.Mesh(geometry, material)
          mesh.userData = { id, originalColor: isLight ? 'rgb(35, 49, 86)' : fillColor }
          group.add(mesh)
        })
      }
      if (isStroke) {
        const material = createMaterial(color || (isLight ? 'rgb(35, 49, 86)' : strokeColor))
        path.subPaths.forEach((subPath: any) => {
          const geometry = SVGLoader.pointsToStroke(subPath.getPoints(64), path.userData?.style)
          if (geometry) {
            geometry.computeBoundingBox()
            if (geometry.boundingBox) boundingBox.union(geometry.boundingBox)
            const mesh = new THREE.Mesh(geometry, material)
            mesh.userData = { id, originalColor: isLight ? 'rgb(35, 49, 86)' : strokeColor }
            group.add(mesh)
          }
        })
      }
    })
    
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    if (!boundingBox.isEmpty()) {
      boundingBox.getSize(size)
      boundingBox.getCenter(center)
      group.children.forEach(mesh => {
        (mesh as THREE.Mesh).geometry.translate(-center.x, -center.y, -center.z)
      })
      const maxDim = Math.max(size.x, size.y)
      if (maxDim > 0) {
        const scale = 5 / maxDim
        group.scale.set(scale, -scale, scale) // Flip Y to fix upside down SVG
      }
    }
    const wrapper = new THREE.Group()
    wrapper.add(group)
    wrapper.rotation.x = -Math.PI / 2
    return wrapper
  }

  const scene1 = useMemo(() => createScene(), [svg, id, isCenterExpand, isLight])
  const scene2 = useMemo(() => isCenterExpand ? createScene() : null, [svg, id, isCenterExpand, isLight])

  useEffect(() => {
    const updateMaterials = (scene: THREE.Group) => {
      scene.traverse((child: any) => {
        if (child.isMesh && child.material) {
          const origColor = child.userData.originalColor
          if (color) {
            child.material.color.set(color)
          } else if (origColor) {
            child.material.color.set(origColor)
          }
          child.material.opacity = opacity
          child.material.transparent = opacity < 1
          child.material.depthWrite = opacity === 1
          child.material.needsUpdate = true
        }
      })
    }
    if (scene1) updateMaterials(scene1)
    if (scene2) updateMaterials(scene2)
  }, [color, opacity, scene1, scene2])
  const boundingBox = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene1)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    if (size.x < 0.1) size.x = 2
    if (size.y < 0.1) size.y = 2
    if (size.z < 0.1) size.z = 2
    return { size, center }
  }, [scene1])

  useEffect(() => {
    return () => {
      scene1.traverse((child: any) => { if (child.isMesh) { child.geometry?.dispose(); child.material?.dispose(); } })
      if (scene2) scene2.traverse((child: any) => { if (child.isMesh) { child.geometry?.dispose(); child.material?.dispose(); } })
    }
  }, [scene1, scene2])

  return (
    <group>
      <Animator scene1={scene1} scene2={scene2 || undefined} isAnimated={isAnimated} animationSpeed={animationSpeed} isCenterExpand={isCenterExpand} />
      <primitive key={`${url}-1`} object={scene1} />
      {scene2 && <primitive key={`${url}-2`} object={scene2} />}
      <mesh position={boundingBox.center}>
        <boxGeometry args={[boundingBox.size.x * 1.5, boundingBox.size.y * 1.5, boundingBox.size.z * 1.5]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
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

export function GltfMesh({ url, opacity, color }: { url: string, opacity: number, color?: string }) {
  const { scene } = useGLTF(url)
  const clone = useMemo(() => {
    const cloned = scene.clone(true)
    cloned.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        if (child.material) {
          // Clone material to avoid shared material opacity issues
          child.material = child.material.clone()
          child.material.transparent = opacity < 1
          child.material.opacity = opacity
          child.material.depthWrite = opacity === 1
          if (color) {
            child.material.color.set(color)
          }
        }
      }
    })
    return cloned
  }, [scene, opacity, color])

  // Center and normalize scale
  const box = useMemo(() => new THREE.Box3().setFromObject(clone), [clone])
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z)
  
  useEffect(() => {
    if (maxDim > 0) {
      const scale = 5 / maxDim
      clone.scale.setScalar(scale)
      clone.position.set(-center.x * scale, -center.y * scale + (size.y * scale) / 2, -center.z * scale)
    }
  }, [clone, maxDim, center, size])

  return <primitive object={clone} />
}

let isCtrlPressed = false
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', e => { if (e.key === 'Control' || e.metaKey) isCtrlPressed = true })
  window.addEventListener('keyup', e => { if (e.key === 'Control' || e.metaKey) isCtrlPressed = false })
  // Prevent key sticking when switching windows
  window.addEventListener('blur', () => { isCtrlPressed = false })
}

export default function ModelLoader({ id, url, position, rotation, scale, color, opacity }: ModelLoaderProps) {
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
  
  const groupRef = useRef<THREE.Group>(null)
  
  const [hovered, setHovered] = useState(false)
  useCursor(hovered, 'pointer', 'auto')

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
        onPointerOver={(e: any) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={(e: any) => {
          setHovered(false)
        }}
        onClick={(e: any) => {
          e.stopPropagation()
          if (e.shiftKey) {
            setSelectedIds(selectedIds.includes(id) ? selectedIds.filter(s => s !== id) : [...selectedIds, id])
          } else {
            setSelectedIds([id])
            window.dispatchEvent(new CustomEvent('re-focus-object', { detail: id }));
          }
        }}
        onPointerMissed={(e: any) => {
          if (e.type === 'click' && isSelected && !e.shiftKey) {
            setSelectedIds([])
          }
        }}
      >
        <ErrorBoundary fallbackRender={({ error }) => (
          <group>
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="red" />
            </mesh>
            <Html center position={[0, 1, 0]}>
              <div style={{ background: 'white', color: 'red', padding: '5px', borderRadius: '4px', whiteSpace: 'nowrap', fontSize: '12px' }}>
                {error?.message || String(error)}
              </div>
            </Html>
          </group>
        )} onError={(err) => console.error("ModelMesh Crash:", err)}>
          <Suspense fallback={<ForceUpdateFallback />}>
            {url.toUpperCase().includes('SUNPATH') ? (
              <NativeSunpath color={color} opacity={objOpacity} />
            ) : url === 'BOX' ? (
              <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[5, 5, 5]} />
                <meshStandardMaterial color={color || '#cccccc'} opacity={objOpacity} transparent={objOpacity < 1} depthWrite={objOpacity === 1} />
              </mesh>
            ) : (url.startsWith('data:') || url.toLowerCase().endsWith('.glb') || url.toLowerCase().endsWith('.gltf')) ? (
              <GltfMesh url={url} color={color} opacity={objOpacity} />
            ) : (
              <SvgMesh url={url} color={color} opacity={objOpacity} id={id} isAnimated={isAnimated} animationSpeed={animationSpeed} />
            )}
          </Suspense>
        </ErrorBoundary>
      </group>
    </>
  )
}

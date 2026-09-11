import { useState, Suspense, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, TransformControls, Grid } from '@react-three/drei'
import ModelLoader, { SvgMesh } from './ModelLoader'
import { useEditorStore } from '../store/useEditorStore'
import * as THREE from 'three'
import { ErrorBoundary } from './ErrorBoundary'

import NativeSunpath from './NativeSunpath'
import MapBackground from './MapBackground'
import ScaleRings from './ScaleRings'



function PreviewModel({ url, position }: { url: string, position: [number, number, number] }) {
  if (url.toUpperCase().includes('SUNPATH')) return null
  
  return (
    <group position={position}>
      <ErrorBoundary fallbackRender={() => null}>
        <Suspense fallback={null}>
          <SvgMesh url={url} opacity={0.5} id="preview" />
        </Suspense>
      </ErrorBoundary>
    </group>
  )
}

function PlacementManager() {
  const placingUrl = useEditorStore((state) => state.placingUrl)
  const setPlacingUrl = useEditorStore((state) => state.setPlacingUrl)
  const addObject = useEditorStore((state) => state.addObject)
  const [pos, setPos] = useState<[number, number, number] | null>(null)

  if (!placingUrl) return null

  return (
    <>
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]}
        onPointerMove={(e) => {
          e.stopPropagation()
          setPos([e.point.x, 0, e.point.z])
        }}
        onPointerOut={() => setPos(null)}
        onClick={(e) => {
          e.stopPropagation()
          addObject(placingUrl, [e.point.x, 0, e.point.z])
          setPlacingUrl(null)
        }}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      
      {pos && (
        <ErrorBoundary 
          fallbackRender={() => (
            <mesh position={pos}>
              <boxGeometry args={[2, 2, 2]} />
              <meshStandardMaterial color="red" wireframe />
            </mesh>
          )}
          onError={(err) => {
            console.error("PreviewModel Crash:", err)
          }}
        >
          <Suspense fallback={null}>
            <PreviewModel url={placingUrl} position={pos} />
          </Suspense>
        </ErrorBoundary>
      )}
    </>
  )
}

function MultiTransformManager() {
  const selectedIds = useEditorStore(state => state.selectedIds)
  const objects = useEditorStore(state => state.objects)
  const updateObjectTransforms = useEditorStore(state => state.updateObjectTransforms)

  const groupRef = useRef<THREE.Group>(null)
  const initialGroupPos = useRef(new THREE.Vector3())
  const initialPositions = useRef<{[id: string]: THREE.Vector3}>({})
  const isDragging = useRef(false)

  // Update center of mass when selection count changes
  useEffect(() => {
    if (selectedIds.length > 1 && groupRef.current) {
      const center = new THREE.Vector3()
      let count = 0
      selectedIds.forEach(id => {
        const obj = objects.find(o => o.id === id)
        if (obj) {
          center.add(new THREE.Vector3(...obj.position))
          count++
        }
      })
      if (count > 0) center.divideScalar(count)
      groupRef.current.position.copy(center)
      groupRef.current.rotation.set(0, 0, 0)
      groupRef.current.scale.set(1, 1, 1)
    }
  }, [selectedIds, objects])

  if (selectedIds.length <= 1) return null

  // Multi-object move functionality
  return (
    <>
      <group ref={groupRef} />
      <TransformControls 
        object={groupRef as any}
        mode="translate"
        onMouseDown={() => {
          if (!groupRef.current) return
          isDragging.current = true
          initialGroupPos.current.copy(groupRef.current.position)
          selectedIds.forEach(id => {
            const obj = objects.find(o => o.id === id)
            if (obj) initialPositions.current[id] = new THREE.Vector3(...obj.position)
          })
        }}
        onChange={() => {
          if (isDragging.current && groupRef.current) {
            // Dragging -> update UI (do not save history)
            const delta = groupRef.current.position.clone().sub(initialGroupPos.current)
            const updates = selectedIds.map(id => {
              const obj = objects.find(o => o.id === id)
              if (!obj) return null
              const initP = initialPositions.current[id] || new THREE.Vector3(...obj.position)
              const finalP = initP.clone().add(delta)
              return { id, position: [finalP.x, finalP.y, finalP.z], rotation: obj.rotation, scale: obj.scale }
            }).filter(Boolean) as any
            updateObjectTransforms(updates, false)
          }
        }}
        onMouseUp={() => {
          if (!isDragging.current || !groupRef.current) return
          isDragging.current = false
          // Mouse released -> Save to Undo/Redo history
          const delta = groupRef.current.position.clone().sub(initialGroupPos.current)
          const updates = selectedIds.map(id => {
            const obj = objects.find(o => o.id === id)
            if (!obj) return null
            const initP = initialPositions.current[id] || new THREE.Vector3(...obj.position)
            const finalP = initP.clone().add(delta)
            return { id, position: [finalP.x, finalP.y, finalP.z], rotation: obj.rotation, scale: obj.scale }
          }).filter(Boolean) as any
          updateObjectTransforms(updates, true)
        }}
      />
    </>
  )
}

import SunLight from './SunLight'
import { useThree, invalidate } from '@react-three/fiber'

function CameraManager() {
  const { camera, controls } = useThree()
  const objects = useEditorStore(state => state.objects)
  
  // Track previous objects length to detect additions
  const prevLen = useRef(objects.length)
  
  useEffect(() => {
    if (objects.length > prevLen.current) {
      const newObj = objects[objects.length - 1]
      if (newObj && newObj.url?.toUpperCase().includes('SUNPATH')) {
        setTimeout(() => {
          camera.position.set(40, 30, 40)
          camera.lookAt(0, 0, 0)
          if (controls) {
            ;(controls as any).target.set(0, 0, 0)
            ;(controls as any).update()
          }
          invalidate()
        }, 100)
      }
      prevLen.current = objects.length
    }
  }, [objects.length, camera, controls, invalidate])

  useEffect(() => {
    const onZoom = (e: any) => {
      const zoomAmount = e.detail;
      const target = (controls as any)?.target || new THREE.Vector3(0, 0, 0);
      const dist = camera.position.distanceTo(target);
      const newDist = Math.max(1, dist + (zoomAmount * 0.05));
      const dir = camera.position.clone().sub(target).normalize();
      camera.position.copy(target).add(dir.multiplyScalar(newDist));
      if (controls) (controls as any).update();
      invalidate();
    }
    const onZoomAll = () => {
      camera.position.set(40, 30, 40)
      camera.lookAt(0, 0, 0)
      if (controls) {
        (controls as any).target.set(0, 0, 0)
        ;(controls as any).update()
      }
      invalidate();
    }
    window.addEventListener('zoom-camera', onZoom)
    window.addEventListener('zoom-all', onZoomAll)
    return () => {
      window.removeEventListener('zoom-camera', onZoom)
      window.removeEventListener('zoom-all', onZoomAll)
    }
  }, [camera, controls])
  
  return null
}

export default function Scene() {
  const objects = useEditorStore(state => state.objects)
  const uiTheme = useEditorStore(state => state.uiTheme)
  const transformMode = useEditorStore(state => state.transformMode)
  const monthColorsLight = useEditorStore(state => state.monthColorsLight)
  const monthColorsDark = useEditorStore(state => state.monthColorsDark)
  const monthColors = uiTheme === 'light' ? monthColorsLight : monthColorsDark
  const bgColor = monthColors[17] || (uiTheme === 'light' ? '#ffffff' : '#000000')
  const sunpathSettings = useEditorStore(state => state.sunpathSettings)
  const showSunDiagramLayer = useEditorStore(state => state.showSunDiagramLayer)
  const showDynamicSymbolsLayer = useEditorStore(state => state.showDynamicSymbolsLayer)
  const mapRadius = useEditorStore(state => state.mapRadius)

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas 
        shadows 
        camera={{ position: [20, 20, 20], fov: 50 }} 
        style={{ 
          background: bgColor, 
          cursor: transformMode === 'pan' ? 'grab' : 'default' 
        }}
        gl={{ localClippingEnabled: true, preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          gl.localClippingEnabled = true
        }}
      >
        <color attach="background" args={[bgColor]} />
        
        <CameraManager />
        
        <SunLight />
        
        <Environment preset="city" />
        
        <OrbitControls 
          makeDefault 
          mouseButtons={{
            LEFT: transformMode === 'pan' ? THREE.MOUSE.PAN : (transformMode === 'orbit' ? THREE.MOUSE.ROTATE : undefined),
            MIDDLE: THREE.MOUSE.ROTATE, 
            RIGHT: undefined 
          }}
        />
        
        
        {/* Grid and Axes */}
        {sunpathSettings.showGrid && (
          <Grid 
            args={[mapRadius * 2, mapRadius * 2]} 
            position={[0, -0.005, 0]} 
            cellColor={uiTheme === 'light' ? '#cccccc' : '#555555'} 
            sectionColor={uiTheme === 'light' ? '#aaaaaa' : '#777777'} 
            cellSize={1} 
            sectionSize={10} 
            fadeDistance={mapRadius}
            fadeStrength={1.5}
            infiniteGrid={true}
          />
        )}
        {sunpathSettings.showAxes && <axesHelper args={[50]} position={[0, -0.005, 0]} />}

        <MapBackground />
        <ScaleRings />

        {/* Invisible plane only to catch shadows */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[1000, 1000]} />
          <shadowMaterial opacity={0.4} />
        </mesh>

        <PlacementManager />
        <MultiTransformManager />

        {/* Global Sunpath Layer */}
        {showSunDiagramLayer && (
          <group scale={useEditorStore.getState().sunpathSettings?.sunpathScale ?? 1.0}>
            <NativeSunpath opacity={1} />
          </group>
        )}

        {/* Dynamic Symbols Layer */}
        {showDynamicSymbolsLayer && objects.filter(obj => !obj.url.toUpperCase().includes('SUNPATH')).map((obj) => (
          <Suspense key={obj.id} fallback={null}>
            <group onContextMenu={(e) => { e.stopPropagation(); useEditorStore.getState().setContextMenu({ x: e.clientX, y: e.clientY, type: 'symbols', targetId: obj.id }) }}>
              <ModelLoader 
                id={obj.id} 
                url={obj.url} 
                position={[obj.position[0], obj.position[1] + 0.1, obj.position[2]]}
                rotation={obj.rotation}
                scale={obj.scale}
                color={obj.color}
                opacity={obj.opacity}
              />
            </group>
          </Suspense>
        ))}
      </Canvas>
    </div>
  )
}

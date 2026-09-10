import { useState, useMemo, Suspense, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, useGLTF, TransformControls } from '@react-three/drei'
import ModelLoader from './ModelLoader'
import { useEditorStore } from '../store/useEditorStore'
import * as THREE from 'three'
import { ErrorBoundary } from './ErrorBoundary'

import NativeSunpath from './NativeSunpath'

function GLTFPreview({ url, position }: { url: string, position: [number, number, number] }) {
  const gltf = useGLTF(url)
  const scene = useMemo(() => {
    const cloned = gltf.scene.clone()
    cloned.traverse((c: any) => {
      if (c.isMesh && c.material) {
        c.material = c.material.clone()
        c.material.transparent = true
        c.material.opacity = 0.5
      }
    })
    return cloned
  }, [gltf])
  return <primitive object={scene} position={position} />
}

function PreviewModel({ url, position }: { url: string, position: [number, number, number] }) {
  if (url.toUpperCase().includes('SUNPATH')) {
    return (
      <group position={position}>
        <NativeSunpath opacity={0.5} />
      </group>
    )
  }
  return <GLTFPreview url={url} position={position} />
}

function PlacementManager() {
  const placingUrl = useEditorStore((state) => state.placingUrl)
  const setPlacingUrl = useEditorStore((state) => state.setPlacingUrl)
  const addObject = useEditorStore((state) => state.addObject)
  const [pos, setPos] = useState<[number, number, number]>([0, 0, 0])

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
        onClick={(e) => {
          e.stopPropagation()
          addObject(placingUrl, [e.point.x, 0, e.point.z])
          setPlacingUrl(null)
        }}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      
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

  // Cập nhật vị trí trọng tâm khi số lượng chọn thay đổi
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

  // Chức năng di chuyển nhiều đối tượng (hiện tại hỗ trợ Move)
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
            // Đang kéo chuột -> cập nhật UI (không lưu lịch sử)
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
          // Nhả chuột -> Lưu lịch sử Undo/Redo
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
import { useThree } from '@react-three/fiber'

function CameraManager() {
  const { camera, controls } = useThree()
  const objects = useEditorStore(state => state.objects)
  
  // Track previous objects length to detect additions
  const prevLen = useRef(objects.length)
  
  useEffect(() => {
    if (objects.length > prevLen.current) {
      // Something was added. Check if it's sunpath
      const newObj = objects[objects.length - 1]
      if (newObj && newObj.url?.toUpperCase().includes('SUNPATH')) {
        // Zoom all for sunpath (radius is ~25)
        camera.position.set(40, 30, 40)
        camera.lookAt(0, 0, 0)
        if (controls) {
          (controls as any).target.set(0, 0, 0)
          ;(controls as any).update()
        }
      }
    }
    prevLen.current = objects.length
  }, [objects.length, camera, controls])

  useEffect(() => {
    const onZoom = (e: any) => {
      const zoomAmount = e.detail;
      const target = (controls as any)?.target || new THREE.Vector3(0, 0, 0);
      const dist = camera.position.distanceTo(target);
      const newDist = Math.max(1, dist + (zoomAmount * 0.05));
      const dir = camera.position.clone().sub(target).normalize();
      camera.position.copy(target).add(dir.multiplyScalar(newDist));
      if (controls) (controls as any).update();
    }
    const onZoomAll = () => {
      camera.position.set(40, 30, 40)
      camera.lookAt(0, 0, 0)
      if (controls) {
        (controls as any).target.set(0, 0, 0)
        ;(controls as any).update()
      }
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
  const bgColor = monthColors[17] || (uiTheme === 'light' ? '#ffffff' : '#333333')
  const sunpathSettings = useEditorStore(state => state.sunpathSettings)
  const showSunDiagramLayer = useEditorStore(state => state.showSunDiagramLayer)
  const showDynamicSymbolsLayer = useEditorStore(state => state.showDynamicSymbolsLayer)

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas 
        shadows 
        camera={{ position: [20, 20, 20], fov: 50 }} 
        style={{ 
          background: bgColor, 
          cursor: transformMode === 'pan' ? 'grab' : 'default' 
        }}
        gl={{ localClippingEnabled: true }}
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
        {sunpathSettings.showGrid && <gridHelper args={[200, 200, uiTheme === 'light' ? '#cccccc' : '#555555', uiTheme === 'light' ? '#eeeeee' : '#333333']} position={[0, -0.05, 0]} />}
        {sunpathSettings.showAxes && <axesHelper args={[50]} position={[0, -0.04, 0]} />}

        {/* Mặt phẳng tàng hình chỉ để hứng bóng đổ */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
          <planeGeometry args={[1000, 1000]} />
          <shadowMaterial opacity={0.4} />
        </mesh>

        <PlacementManager />
        <MultiTransformManager />

        {objects.filter(obj => {
          const isSunPath = obj.url.toUpperCase().includes('SUNPATH')
          if (isSunPath) return showSunDiagramLayer
          return showDynamicSymbolsLayer
        }).map((obj) => (
          <Suspense key={obj.id} fallback={null}>
            <group onContextMenu={(e) => { e.stopPropagation(); useEditorStore.getState().setContextMenu({ x: e.clientX, y: e.clientY, type: obj.url.toUpperCase().includes('SUNPATH') ? 'sundiagram' : 'symbols', targetId: obj.id }) }}>
              <ModelLoader 
                id={obj.id} 
                url={obj.url} 
                position={obj.position}
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

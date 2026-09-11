import * as THREE from 'three'
import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import { useEditorStore } from '../store/useEditorStore'

export default function ScaleRings() {
  const showScaleRings = useEditorStore(state => state.showScaleRings)
  const mapRadius = useEditorStore(state => state.mapRadius)
  const scaleRingCount = useEditorStore(state => state.scaleRingCount)
  const scaleRingUnit = useEditorStore(state => state.scaleRingUnit)
  const uiTheme = useEditorStore(state => state.uiTheme)

  const lineMaterial = useMemo(() => {
    return new THREE.LineDashedMaterial({ 
      color: uiTheme === 'light' ? '#333333' : '#dddddd', 
      dashSize: 1, 
      gapSize: 1, 
      transparent: true, 
      opacity: 0.6 
    })
  }, [uiTheme])

  // Ensure mapRadius is divided equally among the number of rings
  const step = mapRadius / scaleRingCount
  const rings = Array.from({ length: scaleRingCount }, (_, i) => (i + 1) * step)
  
  const ringGeometries = useMemo(() => {
    return rings.map(radius => {
      const pts = []
      const segments = 128
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2
        pts.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius))
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts)
      return { radius, geometry: geo }
    })
  }, [mapRadius, scaleRingCount]) // compute based on primitives

  if (!showScaleRings) return null
  
  const textColor = uiTheme === 'light' ? '#111827' : '#f9fafb'

  return (
    <group position={[0, 0.5, 0]}>
      {ringGeometries.map(({ radius, geometry }) => {

        const label = `${radius}${scaleRingUnit}`
        const fontSize = Math.max(0.5, radius * 0.05) // Keep font readable but scalable
        
        const labels = [
          { angle: 0, pos: [0, 0, -radius] as [number, number, number] },      // N
          { angle: 180, pos: [0, 0, radius] as [number, number, number] },     // S
          { angle: 90, pos: [radius, 0, 0] as [number, number, number] },      // E
          { angle: 270, pos: [-radius, 0, 0] as [number, number, number] }     // W
        ]

        return (
          <group key={radius}>
            <line geometry={geometry} material={lineMaterial} onUpdate={self => self.computeLineDistances()} />
            
            {labels.map((lbl, idx) => (
              <group key={idx} position={lbl.pos} rotation={[0, -THREE.MathUtils.degToRad(lbl.angle), 0]}>
                {/* @ts-ignore */}
                <Text 
                  rotation={[-Math.PI / 2, 0, 0]} 
                  fontSize={fontSize} 
                  color={textColor}
                  anchorY="bottom"
                  anchorX="center"
                  position={[0, 0, -0.2]} // small offset from the line
                  depthOffset={-1}
                  suspend={false}
                >
                  {label}
                </Text>
              </group>
            ))}
          </group>
        )
      })}
    </group>
  )
}

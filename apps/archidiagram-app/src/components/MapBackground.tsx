import { useEditorStore } from '../store/useEditorStore'
import * as THREE from 'three'
import { Suspense, useEffect, useState } from 'react'

import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'

const FadeMapMaterial = shaderMaterial(
  { uMap: null, uOpacity: 1.0, uRadiusUV: 0.5 },
  // vertex shader
  `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // fragment shader
  `
  uniform sampler2D uMap;
  uniform float uOpacity;
  uniform float uRadiusUV;
  varying vec2 vUv;
  
  void main() {
    vec4 texColor = texture2D(uMap, vUv);
    
    // distance from center (0.5, 0.5)
    float dist = distance(vUv, vec2(0.5));
    
    // smoothstep to create a soft edge fade
    // Start fading out at 80% of the radius, completely faded at 100% of the radius
    float alpha = 1.0 - smoothstep(uRadiusUV * 0.8, uRadiusUV, dist);
    
    gl_FragColor = vec4(texColor.rgb, texColor.a * alpha * uOpacity);
  }
  `
)
extend({ FadeMapMaterial })

function MapBackgroundInner() {
  const latitude = useEditorStore(state => state.latitude)
  const longitude = useEditorStore(state => state.longitude)
  const mapZoom = useEditorStore(state => state.mapZoom)
  const mapboxToken = useEditorStore(state => state.mapboxToken)
  const mapStyle = useEditorStore(state => state.mapStyle)
  const mapOpacity = useEditorStore(state => state.mapOpacity)
  const mapRadius = useEditorStore(state => state.mapRadius)
  
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!mapboxToken) return
    
    setError(false)
    const size = 1024
    const url = `https://api.mapbox.com/styles/v1/mapbox/${mapStyle}/static/${longitude},${latitude},${mapZoom},0,0/${size}x${size}?access_token=${mapboxToken}`
    
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous')
    loader.load(
      url,
      (loadedTexture) => {
        loadedTexture.colorSpace = THREE.SRGBColorSpace
        setTexture(prev => {
          if (prev) prev.dispose()
          return loadedTexture
        })
      },
      undefined,
      (err) => {
        console.error("Failed to load Mapbox texture", err)
        setError(true)
      }
    )
  }, [latitude, longitude, mapZoom, mapboxToken, mapStyle])

  // Calculate true physical size of the Mapbox image in meters
  // metersPerPixel = (Math.cos(latitude * Math.PI / 180) * 2 * Math.PI * 6378137) / (256 * Math.pow(2, mapZoom))
  const safeLat = latitude || 21.0285
  const metersPerPixel = (Math.cos(safeLat * Math.PI / 180) * 2 * Math.PI * 6378137) / (256 * Math.pow(2, mapZoom))
  const mapSize = 1024
  const mapPhysicalSize = mapSize * metersPerPixel
  
  // Calculate UV radius for the fade effect
  const uRadiusUV = mapRadius / mapPhysicalSize

  if (error) {
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.0, 0]}>
        <planeGeometry args={[mapPhysicalSize, mapPhysicalSize]} />
        <meshBasicMaterial color="#ffcccc" opacity={0.5} transparent />
      </mesh>
    )
  }

  if (!texture) return null

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.0, 0]} receiveShadow>
      <planeGeometry args={[mapPhysicalSize, mapPhysicalSize]} />
      {/* @ts-ignore */}
      <fadeMapMaterial uMap={texture} uOpacity={mapOpacity} uRadiusUV={uRadiusUV} transparent depthWrite={false} />
    </mesh>
  )
}

export default function MapBackground() {
  const showMapBackground = useEditorStore(state => state.showMapBackground)
  const mapboxToken = useEditorStore(state => state.mapboxToken)

  if (!showMapBackground || !mapboxToken) return null

  return (
    <Suspense fallback={null}>
      <MapBackgroundInner />
    </Suspense>
  )
}

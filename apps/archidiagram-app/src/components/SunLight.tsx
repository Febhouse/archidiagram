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
  const { latitude, longitude, activeMonth, monthDates, timeOfDay, northOffset, shadowsEnabled, timezoneMode, utcOffset, dstMode } = useEditorStore()
  
  const calculatedUtcOffset = useMemo(() => calculateUtcOffset(longitude || 105.8542, latitude || 21.0285, timezoneMode, utcOffset), [longitude, latitude, timezoneMode, utcOffset])

  const sunPosition = useMemo(() => {
    // Sử dụng chung 1 thuật toán với NativeSunpath để không bao giờ bị lệch múi giờ!
    const day = getDayOfYear(activeMonth || 6, monthDates?.[activeMonth] ?? 21)
    const pos = getSunPosition(day, timeOfDay, latitude || 21.0285, longitude || 105.8542, calculatedUtcOffset, dstMode, 100)
    
    // Xoay theo True North
    const northOffsetRad = THREE.MathUtils.degToRad(northOffset)
    pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), northOffsetRad)
    
    return pos
  }, [latitude, longitude, activeMonth, monthDates, timeOfDay, northOffset, calculatedUtcOffset, dstMode])
  
  // Dùng Ref để cập nhật vị trí đèn Directional mà không gây re-render component cha liên tục
  const lightRef = useRef<THREE.DirectionalLight>(null)
  
  useEffect(() => {
    if (lightRef.current) {
      lightRef.current.position.copy(sunPosition)
    }
  }, [sunPosition])

  // Nếu mặt trời lặn (y < 0), ta có thể giảm cường độ sáng hoặc tắt luôn để tránh hắt ngược từ dưới lên
  const isNight = sunPosition.y < 0
  const intensity = isNight ? 0 : 1

  return (
    <>
      <directionalLight
        ref={lightRef}
        castShadow={shadowsEnabled}
        intensity={intensity}
        // Để bóng râm bao phủ được diện tích rộng, ta cần tăng phạm vi của shadow camera
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-camera-near={0.5}
        shadow-camera-far={500}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.001}
      />
    </>
  )
}

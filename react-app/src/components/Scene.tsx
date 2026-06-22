import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useStore } from '../store/useStore'
import BodygraphMesh from './bodygraph/BodygraphMesh'

const CAM_POS = [0, 0, 7.5] as const

/** Resets the camera whenever a reset token changes. */
function CameraController() {
  const { camera } = useThree()
  const controls = useThree((s) => s.controls) as (THREE.EventDispatcher & { target: THREE.Vector3; update(): void }) | null

  const resetToken = useStore((s) => s.resetToken)

  // Pending-reset flag applied in useFrame at default priority 0,
  // which runs after OrbitControls (priority -1), so we win the
  // camera-position race without disabling R3F's automatic rendering.
  const pendingRef = useRef(true)   // true on mount to set initial position

  useEffect(() => {
    pendingRef.current = true
  }, [resetToken])

  useFrame(() => {
    if (!pendingRef.current || !controls) return
    pendingRef.current = false
    camera.position.set(...CAM_POS)
    controls.target.set(0, 0, 0)
    controls.update()
  })

  return null
}

/**
 * Fixes R3F canvas not re-centering after device orientation change.
 * orientationchange fires before layout settles, so we wait ~300 ms then
 * manually re-measure the parent container and push the new size to the
 * WebGL renderer + camera.
 */
function OrientationFix() {
  const { gl, camera } = useThree()

  useEffect(() => {
    const handleChange = () => {
      setTimeout(() => {
        const parent = gl.domElement.parentElement
        if (!parent) return
        const w = parent.clientWidth
        const h = parent.clientHeight
        gl.setSize(w, h)
        if (camera instanceof THREE.PerspectiveCamera) {
          camera.aspect = w / h
          camera.updateProjectionMatrix()
        }
      }, 300)
    }

    window.addEventListener('orientationchange', handleChange)
    screen.orientation?.addEventListener('change', handleChange)
    return () => {
      window.removeEventListener('orientationchange', handleChange)
      screen.orientation?.removeEventListener('change', handleChange)
    }
  }, [gl, camera])

  return null
}

export default function Scene() {
  return (
    <>
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} zoomToCursor />
      <CameraController />
      <OrientationFix />

      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 5]}  intensity={1.2} />
      <directionalLight position={[-4, 2, -3]} intensity={0.4} />
      {/* Point light in front of the bodygraph — drives specular glitter on particles */}
      <pointLight position={[0, 1, 5]} intensity={6} color="#ffffff" distance={12} decay={2} />

      <BodygraphMesh />
    </>
  )
}

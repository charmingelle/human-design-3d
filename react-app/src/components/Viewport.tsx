import { Canvas } from '@react-three/fiber'
import Scene from './Scene'
import PlanetColumns from './PlanetColumns'
import ChartBadges from './ChartBadges'
import { BG_COLOR } from '../constants/colors'
import { useStore } from '../store/useStore'

export default function Viewport() {
  const hideTooltip = useStore((s) => s.hideTooltip)

  return (
    <div className="flex-1 relative" style={{ backgroundColor: BG_COLOR }}>
      <Canvas
        camera={{ fov: 45, near: 0.1, far: 100, position: [2.5, 2, 3] }}
        gl={{ antialias: true }}
        onPointerMissed={() => hideTooltip()}
      >
        <Scene />
      </Canvas>
      <PlanetColumns />
      <ChartBadges />
    </div>
  )
}

import { Canvas } from '@react-three/fiber'
import Scene from './Scene'
import PlanetColumns, { COLOR_UNCONSCIOUS, COLOR_CONSCIOUS } from './PlanetColumns'
import ChartBadges from './ChartBadges'
import { BG_COLOR } from '../constants/colors'
import { useStore } from '../store/useStore'

interface ViewportProps {
  onToggleLeft:         () => void
  onToggleRight:        () => void
  leftOpen:             boolean
  rightOpen:            boolean
  onToggleLeftPlanet:   () => void
  onToggleRightPlanet:  () => void
  leftPlanetOpen:       boolean
  rightPlanetOpen:      boolean
}

function IconHuman() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
      <circle cx="12" cy="6.5" r="3.5" />
      <path d="M12 12c-4.5 0-7.5 2.2-7.5 4v1.5h15V16c0-1.8-3-4-7.5-4z" />
    </svg>
  )
}

function IconData() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
      <rect x="3"    y="4"    width="18" height="3" rx="1.5" />
      <rect x="3"    y="10.5" width="18" height="3" rx="1.5" />
      <rect x="3"    y="17"   width="18" height="3" rx="1.5" />
    </svg>
  )
}


function IconSun() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2"  x2="12" y2="5"  stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="2"  y1="12" x2="5"  y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="19" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="4.2"  y1="4.2"  x2="6.3"  y2="6.3"  stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="17.7" y1="17.7" x2="19.8" y2="19.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="19.8" y1="4.2"  x2="17.7" y2="6.3"  stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="6.3"  y1="17.7" x2="4.2"  y2="19.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default function Viewport({
  onToggleLeft,
  onToggleRight,
  leftOpen,
  rightOpen,
  onToggleLeftPlanet,
  onToggleRightPlanet,
  leftPlanetOpen,
  rightPlanetOpen,
}: ViewportProps) {
  const hideTooltip  = useStore((s) => s.hideTooltip)
  const hasChart     = useStore((s) => !!(s.chartPlanetsPersonality && s.chartPlanetsDesign))
  const autoSpin     = useStore((s) => s.autoSpin)
  const toggleSpin   = useStore((s) => s.toggleAutoSpin)

  return (
    <div className="flex-1 relative" style={{ backgroundColor: BG_COLOR }}>
      <Canvas
        camera={{ fov: 45, near: 0.1, far: 100, position: [2.5, 2, 3] }}
        gl={{ antialias: true }}
        onPointerMissed={() => hideTooltip()}
      >
        <Scene />
      </Canvas>
      <PlanetColumns
        mobileLeftVisible={leftPlanetOpen}
        mobileRightVisible={rightPlanetOpen}
      />
      <ChartBadges />

      {/* Sun buttons at top corners — mobile only, only when chart data exists */}
      {hasChart && (
        <div className="absolute top-4 left-0 right-0 flex justify-between px-5 md:hidden pointer-events-none z-30">
          <button
            onClick={onToggleLeftPlanet}
            aria-label="Toggle unconscious planet column"
            className="pointer-events-auto w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-150 text-white"
            style={{
              background:     COLOR_UNCONSCIOUS,
              borderColor:    leftPlanetOpen ? 'rgba(255,255,255,0.8)' : 'transparent',
              backdropFilter: 'blur(8px)',
            }}
          >
            <IconSun />
          </button>

          <button
            onClick={onToggleRightPlanet}
            aria-label="Toggle conscious planet column"
            className="pointer-events-auto w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-150 text-white"
            style={{
              background:     COLOR_CONSCIOUS,
              borderColor:    rightPlanetOpen ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <IconSun />
          </button>
        </div>
      )}

      {/* Panel toggle buttons at bottom corners — mobile only */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-between items-end px-5 md:hidden pointer-events-none z-30">

        {/* Left column: reset (top) + bodygraph toggle (bottom) */}
        <div className="flex flex-col items-center gap-2 pointer-events-auto">
          <button
            onClick={toggleSpin}
            aria-label={autoSpin ? 'Stop spin' : 'Start spin'}
            className={[
              'w-10 h-10 rounded-full flex items-center justify-center',
              'border transition-colors duration-150 text-base',
              autoSpin
                ? 'bg-accent-dim border-accent text-text'
                : 'bg-surface border-border text-muted',
            ].join(' ')}
            style={{ backdropFilter: 'blur(8px)' }}
          >
            {autoSpin ? '⏹' : '⟳'}
          </button>
          <button
            onClick={onToggleLeft}
            aria-label="Toggle bodygraph panel"
            className={[
              'w-12 h-12 rounded-full flex items-center justify-center',
              'border transition-colors duration-150',
              leftOpen
                ? 'bg-accent-dim border-accent text-text'
                : 'bg-surface border-border text-muted',
            ].join(' ')}
            style={{ backdropFilter: 'blur(8px)' }}
          >
            <IconData />
          </button>
        </div>

        <button
          onClick={onToggleRight}
          aria-label="Toggle data panel"
          className={[
            'pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center',
            'border transition-colors duration-150',
            rightOpen
              ? 'bg-accent-dim border-accent text-text'
              : 'bg-surface border-border text-muted',
          ].join(' ')}
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <IconHuman />
        </button>
      </div>
    </div>
  )
}

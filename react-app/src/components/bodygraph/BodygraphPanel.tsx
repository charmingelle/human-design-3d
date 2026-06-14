import { useStore } from '../../store/useStore'

export default function BodygraphPanel() {
  const autoSpin     = useStore((s) => s.autoSpin)
  const toggleSpin   = useStore((s) => s.toggleAutoSpin)
  const speed        = useStore((s) => s.speed)
  const setSpeed     = useStore((s) => s.setSpeed)
  const triggerReset = useStore((s) => s.triggerReset)

  return (
    <div className="flex flex-col flex-1 gap-4">
      <h1 className="text-xs font-semibold tracking-widest uppercase text-muted">
        Bodygraph
      </h1>

      <div className="flex flex-col gap-1">
        <p className="text-xs text-dim leading-relaxed">Human Design bodygraph</p>
        <ul className="text-xs text-dim leading-relaxed list-none">
          <li><span className="text-muted">9 centres</span></li>
          <li><span className="text-muted">36 channels</span></li>
          <li><span className="text-muted">64 gates</span></li>
        </ul>
      </div>

      <div className="h-px bg-border" />

      {/* Auto-spin + reset view */}
      <div className="flex flex-col gap-2.5">
        <label className="text-[11px] font-medium uppercase tracking-wider text-dim">
          Auto-Spin
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={toggleSpin}
            className={`btn-ctrl text-sm ${autoSpin ? 'text-accent' : ''}`}
          >
            {autoSpin ? '⏹ Stop' : '⟳ Spin'}
          </button>
          <button onClick={triggerReset} className="btn-ctrl text-sm">
            ⤢ Reset
          </button>
        </div>
      </div>

      {/* Speed */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-[11px] font-medium uppercase tracking-wider text-dim">
            Speed
          </label>
          <span className="text-xs text-muted">{speed.toFixed(1)}×</span>
        </div>
        <div className="flex flex-col gap-4">
          <input
            type="range"
            min={0.2}
            max={5}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
          />
          <p className="text-xs text-dim leading-relaxed">Drag to orbit · scroll to zoom</p>
        </div>
      </div>

    </div>
  )
}

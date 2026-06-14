import { useStore } from '../store/useStore'

export default function Tooltip() {
  const tooltip = useStore((s) => s.tooltip)

  if (!tooltip) return null

  const aboveCenter = tooltip.mode === 'above-center'

  return (
    <div
      style={{
        position:   'fixed',
        left:       aboveCenter ? tooltip.x : tooltip.x + 14,
        top:        aboveCenter ? tooltip.y - 6 : tooltip.y - 42,
        transform:  aboveCenter ? 'translateX(-50%) translateY(-100%)' : undefined,
        zIndex:     9999,
        pointerEvents: 'none',
        maxWidth:   '280px',
        padding:    '6px 12px',
      }}
      className="bg-surface border border-border rounded-lg text-xs text-text shadow-lg"
    >
      <div className="font-semibold text-sm leading-tight mb-1">{tooltip.title}</div>
      {tooltip.lines?.map((line, i) => (
        <div key={i} className="text-xs opacity-80 leading-snug">{line}</div>
      ))}
    </div>
  )
}

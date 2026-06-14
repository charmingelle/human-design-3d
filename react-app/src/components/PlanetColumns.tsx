import { useStore, PlanetMap } from '../store/useStore'

// ── Planet catalogue ─────────────────────────────────────────────────────────

const PLANET_ORDER = [
  'Sun', 'Earth', 'N.Node', 'S.Node', 'Moon',
  'Mercury', 'Venus', 'Mars',
  'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
]

const PLANET_SYMBOL: Record<string, string> = {
  Sun:      '⊙',
  Earth:    '⊕',
  Moon:     '☽',
  'N.Node': '☊',
  'S.Node': '☋',
  Mercury:  '☿',
  Venus:    '♀',
  Mars:     '♂',
  Jupiter:  '♃',
  Saturn:   '♄',
  Uranus:   '♅',
  Neptune:  '♆',
  Pluto:    '♇',
}

// ── Design tokens ────────────────────────────────────────────────────────────

const COLOR_UNCONSCIOUS = '#9d2a7e'   // magenta (Design / Unconscious)
const COLOR_CONSCIOUS   = '#1a1a2e'   // near-black (Personality / Conscious)
const TEXT_COLOR        = '#ffffff'

// ── Sub-components ───────────────────────────────────────────────────────────

function PlanetCard({
  planet,
  data,
  bg,
}: {
  planet: string
  data:   { gate: number; line: number } | undefined
  bg:     string
}) {
  return (
    <div
      style={{
        background:    bg,
        color:         TEXT_COLOR,
        borderRadius:  6,
        marginBottom:  3,
        padding:       '3px 8px',
        display:       'flex',
        alignItems:    'center',
        gap:           7,
        minWidth:      72,
        fontSize:      12,
        fontFamily:    'system-ui, sans-serif',
        lineHeight:    '1.4',
      }}
    >
      <span style={{ fontSize: 15, lineHeight: 1, opacity: 0.9 }}>
        {PLANET_SYMBOL[planet] ?? '?'}
      </span>
      <span style={{ fontWeight: 600, letterSpacing: '0.02em' }}>
        {data ? `${data.gate}.${data.line}` : '—'}
      </span>
    </div>
  )
}

function Column({
  label,
  planets,
  bg,
  align,
}: {
  label:   string
  planets: PlanetMap
  bg:      string
  align:   'left' | 'right'
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: align === 'left' ? 'flex-start' : 'flex-end' }}>
      <div
        style={{
          fontSize:      10,
          fontWeight:    600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color:         'rgba(255,255,255,0.5)',
          marginBottom:  6,
          fontFamily:    'system-ui, sans-serif',
        }}
      >
        {label}
      </div>
      {PLANET_ORDER.map((planet) => (
        <PlanetCard key={planet} planet={planet} data={planets[planet]} bg={bg} />
      ))}
    </div>
  )
}

// ── Main overlay ─────────────────────────────────────────────────────────────

export default function PlanetColumns() {
  const personality = useStore((s) => s.chartPlanetsPersonality)
  const design      = useStore((s) => s.chartPlanetsDesign)

  if (!personality || !design) return null

  return (
    <div
      style={{
        position:      'absolute',
        inset:         0,
        pointerEvents: 'none',
        display:       'flex',
        alignItems:    'center',
        justifyContent:'space-between',
        padding:       '0 12px',
      }}
    >
      {/* Left — Unconscious (Design) */}
      <Column label="Unconscious" planets={design} bg={COLOR_UNCONSCIOUS} align="left" />

      {/* Right — Conscious (Personality) */}
      <Column label="Conscious" planets={personality} bg={COLOR_CONSCIOUS} align="right" />
    </div>
  )
}

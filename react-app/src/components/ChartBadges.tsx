import { useState } from 'react'
import { useStore } from '../store/useStore'

const BG    = '#1a1a2e'
const TEXT  = '#ffffff'
const DIM   = 'rgba(255,255,255,0.45)'
const FONT  = 'system-ui, sans-serif'

const TYPE_META: Record<string, { percent: string; lines: string[]; signature: string; challenge: string }> = {
  'Generator': {
    percent:   '~37% of people',
    lines:     [
      'The builders and workers of society.',
      'Have consistent life-force energy for activities they enjoy.',
      'Tend to thrive when responding to opportunities rather than initiating them.',
    ],
    signature: 'Satisfaction',
    challenge: 'Frustration',
  },
  'Manifesting Generator': {
    percent:   '~33% of people',
    lines:     [
      'A subtype of Generator with a faster, more multi-tasking energy.',
      'Often juggle several interests and may move quickly between projects.',
      'Tend to benefit from responding first and then taking action.',
    ],
    signature: 'Satisfaction',
    challenge: 'Frustration (and sometimes anger)',
  },
  'Projector': {
    percent:   '~20% of people',
    lines:     [
      'Natural guides, advisors, and managers of energy rather than sustained workers.',
      'Often excel at understanding systems and people.',
      'Traditionally advised to wait for recognition and invitation in major life areas.',
    ],
    signature: 'Success',
    challenge: 'Bitterness',
  },
  'Manifestor': {
    percent:   '~9% of people',
    lines:     [
      'Independent initiators who can start new movements or projects.',
      'Often value autonomy and freedom.',
      'Traditionally encouraged to inform others before acting to reduce resistance.',
    ],
    signature: 'Peace',
    challenge: 'Anger',
  },
  'Reflector': {
    percent:   '~1% of people',
    lines:     [
      'The rarest Human Design type.',
      'Highly sensitive to their environment and community.',
      'Said to reflect the health and dynamics of the groups around them.',
      'Traditionally advised to take significant time before making major decisions.',
    ],
    signature: 'Surprise (or delight)',
    challenge: 'Disappointment',
  },
}


const PROFILE_META: Record<string, { subtitle: string; lines: string[] }> = {
  '1/3': {
    subtitle: 'Investigator / Martyr — The Researcher and Experimenter',
    lines: [
      'Driven to build a solid foundation of knowledge.',
      'Learns through study, investigation, and personal experience.',
      'Often discovers what works by finding out what doesn\'t.',
      'Values certainty and practical understanding.',
    ],
  },
  '1/4': {
    subtitle: 'Investigator / Opportunist — The Knowledge Builder and Networker',
    lines: [
      'Seeks depth and understanding before taking action.',
      'Opportunities often come through friendships and trusted connections.',
      'Combines expertise with relationship-building.',
      'Tends to influence others through a strong personal network.',
    ],
  },
  '2/4': {
    subtitle: 'Hermit / Opportunist — The Natural Talent',
    lines: [
      'Possesses innate gifts that may seem effortless.',
      'Needs regular periods of solitude and retreat.',
      'Often recognized and "called out" by others for their talents.',
      'Balances private time with community connections.',
    ],
  },
  '2/5': {
    subtitle: 'Hermit / Heretic — The Natural Problem-Solver',
    lines: [
      'Has natural abilities but may prefer to be left alone.',
      'Others often project expectations onto them.',
      'Frequently seen as someone who can provide practical solutions.',
      'Benefits from clear boundaries and realistic expectations.',
    ],
  },
  '3/5': {
    subtitle: 'Martyr / Heretic — The Practical Innovator',
    lines: [
      'Learns through trial and error.',
      'Often develops practical solutions based on real-world experience.',
      'Resilient and adaptable when facing setbacks.',
      'Can become a source of wisdom from lived experience.',
    ],
  },
  '3/6': {
    subtitle: 'Martyr / Role Model — The Experiential Learner',
    lines: [
      'Early life tends to involve extensive experimentation and learning.',
      'Matures into a more observational and reflective role.',
      'Often develops wisdom through direct experience.',
      'May eventually become an example for others.',
    ],
  },
  '4/6': {
    subtitle: 'Opportunist / Role Model — The Influential Role Model',
    lines: [
      'Relationships and community are central themes.',
      'Opportunities often arise through personal networks.',
      'Over time, grows into a leadership or role-model position.',
      'Values trust, loyalty, and meaningful connections.',
    ],
  },
  '4/1': {
    subtitle: 'Opportunist / Investigator — The Stable Influencer',
    lines: [
      'Combines social influence with a desire for solid knowledge.',
      'Often values consistency and reliability.',
      'Can have a strong sense of purpose and direction.',
      'Tends to build influence through trusted relationships.',
    ],
  },
  '5/1': {
    subtitle: 'Heretic / Investigator — The Problem-Solving Leader',
    lines: [
      'Often viewed as someone who can fix problems.',
      'Seeks a strong factual foundation before offering solutions.',
      'Can be influential in practical or leadership roles.',
      'May need to manage others\' expectations and projections.',
    ],
  },
  '5/2': {
    subtitle: 'Heretic / Hermit — The Reluctant Leader',
    lines: [
      'Naturally talented but may not seek the spotlight.',
      'Others often look to them for answers or guidance.',
      'Benefits from balancing public demands with private time.',
      'Can be highly effective when recognized for genuine strengths.',
    ],
  },
  '6/2': {
    subtitle: 'Role Model / Hermit — The Wise Observer',
    lines: [
      'Often follows a three-stage life path: experimentation, observation, role model.',
      'Values authenticity and perspective.',
      'Needs periods of solitude to integrate experiences.',
    ],
  },
  '6/3': {
    subtitle: 'Role Model / Martyr — The Resilient Role Model',
    lines: [
      'Gains wisdom through extensive personal experience.',
      'Early life may involve many lessons through trial and error.',
      'Over time develops a broader perspective and leadership presence.',
      'Often inspires others through authenticity and perseverance.',
    ],
  },
}

const AUTHORITY_META: Record<string, { subtitle: string; lines: string[] }> = {
  'Emotional': {
    subtitle: 'Solar Plexus — The Wave Rider (~50% of people)',
    lines: [
      'Decisions are best made over time rather than in the moment.',
      'Emotions naturally rise and fall in waves.',
      'Clarity comes after experiencing the emotional highs and lows.',
      'Important decisions are often delayed until emotional neutrality is reached.',
    ],
  },
  'Sacral': {
    subtitle: 'The Gut Responder — common among Generators and Manifesting Generators',
    lines: [
      'Relies on immediate gut responses.',
      'Often experienced as a clear "yes" or "no" feeling in the body.',
      'Works best when responding to specific options or questions.',
      'Encourages trusting instinctive bodily reactions.',
    ],
  },
  'Splenic': {
    subtitle: 'The Intuitive Knower',
    lines: [
      'Decisions arise from immediate intuition and instinct.',
      'Signals are often subtle, quiet, and momentary.',
      'Associated with awareness of safety, health, and well-being.',
      'Encourages trusting first impressions.',
    ],
  },
  'Ego': {
    subtitle: 'Heart / Will — The Self-Motivated Decider',
    lines: [
      'Decisions are guided by desire, willpower, and what one genuinely wants.',
      'Focuses on personal commitment and motivation.',
      'Clarity comes from recognizing authentic wants.',
      'Often asks: "Do I truly want this?"',
    ],
  },
  'Self-Projected': {
    subtitle: 'G Center — The Identity-Based Decider',
    lines: [
      'Clarity emerges through speaking thoughts out loud.',
      'Decisions are guided by a sense of identity and direction.',
      'Talking with trusted listeners can help reveal the answer.',
      'Often discovers truth through hearing oneself speak.',
    ],
  },
  'Mental': {
    subtitle: 'Environmental Authority — The Sounding Board User',
    lines: [
      'Common among Projectors with no inner authority centers defined.',
      'Gains clarity by discussing options with trusted people.',
      'The purpose of conversation is reflection, not advice.',
      'Environment and surroundings are considered especially important.',
    ],
  },
  'Lunar': {
    subtitle: 'The Cyclical Observer — found only in Reflectors',
    lines: [
      'Major decisions are traditionally given a full lunar cycle (~28 days).',
      'Clarity develops through observing changing perspectives over time.',
      'Encourages patience and reflection.',
      'Considered the rarest authority.',
    ],
  },
  'Ego-Projected': {
    subtitle: 'Heart-Led Speaker — a rare variation of Ego Authority',
    lines: [
      'Decisions become clear through speaking from desire and will.',
      'Similar to Ego Authority, but clarity often emerges verbally.',
      'Focuses on what feels genuinely worth pursuing.',
      'Encourages honoring personal commitments and ambitions.',
    ],
  },
}

function AuthorityBadge({ value }: { value: string }) {
  const showTooltip = useStore((s) => s.showTooltip)
  const [hovered, setHovered] = useState(false)
  const meta = AUTHORITY_META[value]

  const handleClick = (e: React.MouseEvent) => {
    if (!meta) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    showTooltip(`${value} Authority`, rect.left + rect.width / 2, rect.top, [meta.subtitle, ...meta.lines], 'above-center')
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:    BG,
        borderRadius:  6,
        padding:       '5px 14px',
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        gap:           2,
        minWidth:      80,
        fontFamily:    FONT,
        cursor:        meta ? 'pointer' : 'default',
        opacity:       hovered && meta ? 0.75 : 1,
        transition:    'opacity 0.15s ease',
        pointerEvents: 'auto',
      }}
    >
      <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: DIM }}>
        Authority
      </span>
      <span style={{ fontSize: 13, fontWeight: 700, color: TEXT, letterSpacing: '0.02em' }}>
        {value}
      </span>
    </div>
  )
}

function ProfileBadge({ value }: { value: string }) {
  const showTooltip = useStore((s) => s.showTooltip)
  const [hovered, setHovered] = useState(false)
  const meta = PROFILE_META[value]

  const handleClick = (e: React.MouseEvent) => {
    if (!meta) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    showTooltip(`Profile ${value}`, rect.left + rect.width / 2, rect.top, [meta.subtitle, ...meta.lines], 'above-center')
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:    BG,
        borderRadius:  6,
        padding:       '5px 14px',
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        gap:           2,
        minWidth:      80,
        fontFamily:    FONT,
        cursor:        meta ? 'pointer' : 'default',
        opacity:       hovered && meta ? 0.75 : 1,
        transition:    'opacity 0.15s ease',
        pointerEvents: 'auto',
      }}
    >
      <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: DIM }}>
        Profile
      </span>
      <span style={{ fontSize: 13, fontWeight: 700, color: TEXT, letterSpacing: '0.02em' }}>
        {value}
      </span>
    </div>
  )
}

function TypeBadge({ value }: { value: string }) {
  const showTooltip = useStore((s) => s.showTooltip)
  const [hovered, setHovered] = useState(false)
  const meta = TYPE_META[value]

  const handleClick = (e: React.MouseEvent) => {
    if (!meta) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    showTooltip(
      value,
      rect.left + rect.width / 2,
      rect.top,
      [
        meta.percent,
        ...meta.lines,
        `Signature: ${meta.signature}`,
        `Challenge: ${meta.challenge}`,
      ],
      'above-center',
    )
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:    BG,
        borderRadius:  6,
        padding:       '5px 14px',
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        gap:           2,
        minWidth:      80,
        fontFamily:    FONT,
        cursor:        meta ? 'pointer' : 'default',
        opacity:       hovered && meta ? 0.75 : 1,
        transition:    'opacity 0.15s ease',
        pointerEvents: 'auto',
      }}
    >
      <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: DIM }}>
        Type
      </span>
      <span style={{ fontSize: 13, fontWeight: 700, color: TEXT, letterSpacing: '0.02em' }}>
        {value}
      </span>
    </div>
  )
}

export default function ChartBadges() {
  const type      = useStore((s) => s.chartType)
  const profile   = useStore((s) => s.chartProfile)
  const authority = useStore((s) => s.chartAuthority)

  if (!type || !profile || !authority) return null

  return (
    <div
      style={{
        position:       'absolute',
        bottom:         20,
        left:           0,
        right:          0,
        display:        'flex',
        justifyContent: 'center',
        gap:            8,
        pointerEvents:  'none',
      }}
    >
      <TypeBadge      value={type}      />
      <ProfileBadge   value={profile}   />
      <AuthorityBadge value={authority} />
    </div>
  )
}

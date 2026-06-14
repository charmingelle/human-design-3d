import * as THREE from 'three'
import { useState } from 'react'
import { Text, useCursor } from '@react-three/drei'
import { useStore } from '../../store/useStore'
import {
  GATE_COLOR_ACTIVE,   GATE_OPACITY_ACTIVE,
  GATE_COLOR_INACTIVE, GATE_OPACITY_INACTIVE,
  GATE_COLOR_NEUTRAL,  GATE_OPACITY_NEUTRAL,
} from '../../constants/colors'

export interface GateData {
  value: number
  /**
   * [x, y] visual offset from the EnergyCenter's centre in scene units:
   *   +x = visual right,  +y = visual up
   * This is independent of the EnergyCenter's own rotation — EnergyCenter
   * converts visual coords to its local space automatically.
   */
  position: [number, number]
}

interface GateProps {
  value: number
  /** 3D position in the parent EnergyCenter's local space */
  position: [number, number, number]
  /** Counter-rotation to cancel any parent group rotation so numbers stay upright */
  rotation?: [number, number, number]
  /**
   * undefined = no chart loaded → neutral (0.5 opacity white)
   * true      = gate is active in the loaded chart → full opacity, teal tint
   * false     = gate is inactive in the loaded chart → very dim
   */
  isActive?: boolean
}

export const GATE_RADIUS = 0.060

const GATE_META: Record<number, string> = {
  // Head
  61: 'Inner Truth — drive to understand mysteries.',
  63: 'Doubt — questioning and testing ideas.',
  64: 'Confusion — pressure to make sense of experiences.',
  // Ajna
  47: 'Realization — transforming confusion into insight.',
  24: 'Rationalization — returning to and processing ideas.',
  4:  'Answers — formulating logical solutions.',
  17: 'Opinions — organizing patterns and viewpoints.',
  11: 'Ideas — conceptual creativity and possibilities.',
  // Throat
  62: 'Details — precise expression.',
  23: 'Assimilation — explaining insights simply.',
  56: 'Stimulation — storytelling and sharing experiences.',
  35: 'Change — expressing progress and new experiences.',
  12: 'Caution — selective emotional expression.',
  45: 'Gathering Together — leadership and resource management.',
  33: 'Privacy — reflection and remembrance.',
  8:  'Contribution — expressing individual style.',
  31: 'Influence — democratic leadership.',
  20: 'The Now — spontaneous expression and action.',
  16: 'Skills — enthusiasm and mastery.',
  // G Center
  1:  'Self-Expression — creative individuality.',
  2:  'Direction of the Self — receptivity and guidance.',
  7:  'Role of the Self — leadership through direction.',
  10: 'Behavior of the Self — authentic self-love.',
  13: 'The Listener — collecting stories and experiences.',
  15: 'Extremes — love of humanity and diversity.',
  25: 'Innocence — universal love and acceptance.',
  46: 'Determination of the Self — love of the body.',
  // Heart
  21: 'Control — managing resources.',
  26: 'The Egoist — persuasion and influence.',
  40: 'Aloneness — work, rest, and commitment.',
  51: 'Shock — initiation and courage.',
  // Solar Plexus
  6:  'Friction — intimacy and boundaries.',
  22: 'Openness — social grace and mood.',
  30: 'Feelings — desire and emotional intensity.',
  36: 'Crisis — growth through experience.',
  37: 'Friendship — family and community bonds.',
  49: 'Principles — values and revolution.',
  55: 'Spirit — emotional abundance and faith.',
  // Sacral
  3:  'Ordering — mutation and beginnings.',
  5:  'Fixed Rhythms — natural timing.',
  9:  'Focus — concentration on details.',
  14: 'Power Skills — generating resources.',
  27: 'Caring — nurturing and responsibility.',
  29: 'Perseverance — commitment and endurance.',
  34: 'Power — pure sacral energy.',
  42: 'Growth — completion of cycles.',
  59: 'Sexuality — intimacy and connection.',
  // Spleen
  18: 'Correction — improving what is flawed.',
  28: 'Struggle — searching for meaning.',
  32: 'Continuity — instinct for what will endure.',
  44: 'Alertness — recognizing patterns from the past.',
  48: 'Depth — wisdom and resourcefulness.',
  50: 'Values — responsibility and protection.',
  57: 'Intuitive Clarity — instinctive awareness.',
  // Root
  19: 'Wanting — sensitivity to needs.',
  38: 'Fighter — struggle for purpose.',
  39: 'Provocation — triggering transformation.',
  41: 'Contraction — imagination and beginnings.',
  52: 'Stillness — focused concentration.',
  53: 'Beginnings — starting new cycles.',
  54: 'Ambition — drive for advancement.',
  58: 'Joy — vitality and improvement.',
  60: 'Limitation — innovation through constraints.',
}

const FONT_SIZE = 0.048

const SPHERE_GEO = new THREE.SphereGeometry(GATE_RADIUS, 16, 12)

function gateAppearance(isActive: boolean | undefined): { color: string; opacity: number } {
  if (isActive === true)  return { color: GATE_COLOR_ACTIVE,   opacity: GATE_OPACITY_ACTIVE   }
  if (isActive === false) return { color: GATE_COLOR_INACTIVE, opacity: GATE_OPACITY_INACTIVE }
  return                         { color: GATE_COLOR_NEUTRAL,  opacity: GATE_OPACITY_NEUTRAL  }
}

export default function Gate({ value, position, rotation = [0, 0, 0], isActive }: GateProps) {
  const { color, opacity } = gateAppearance(isActive)
  const showTooltip = useStore((s) => s.showTooltip)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)

  return (
    <group
      position={position}
      rotation={rotation}
      onPointerEnter={(e) => { e.stopPropagation(); setHovered(true) }}
      onPointerLeave={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation()
        const statusLabel = isActive === true ? ' — Active' : isActive === false ? ' — Inactive' : ''
        const description = GATE_META[value]
        showTooltip(
          `Gate ${value}${statusLabel}`,
          e.nativeEvent.clientX,
          e.nativeEvent.clientY,
          description ? [description] : undefined,
        )
      }}
    >
      <mesh geometry={SPHERE_GEO}>
        <meshBasicMaterial color={color} transparent opacity={Math.min(1, opacity + (hovered ? 0.1 : 0))} />
      </mesh>
      <Text
        position={[0, 0, GATE_RADIUS + 0.001]}
        fontSize={FONT_SIZE}
        fontWeight="bold"
        color="#000000"
        anchorX="center"
        anchorY="middle"
        renderOrder={1}
      >
        {String(value)}
      </Text>
    </group>
  )
}

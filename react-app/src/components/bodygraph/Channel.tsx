import * as THREE from "three";
import { useMemo, useState, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";
import { useStore } from "../../store/useStore";
import {
  CHANNEL_COLOR_PERSONALITY,
  CHANNEL_COLOR_DESIGN,
  CHANNEL_COLOR_DEFAULT,
  CHANNEL_OPACITY_DEFAULT,
} from "../../constants/colors";

// ── Channel metadata ──────────────────────────────────────────
// Keyed by "min-max" of the two gate numbers for order-independent lookup.

const CHANNEL_META: Record<string, { name: string; circuit: string; description: string }> = {
  // Individual — Knowing Circuit
  '24-61': { name: 'Awareness',             circuit: 'Individual / Knowing',    description: 'Mental contemplation and insight.' },
  '4-63':  { name: 'Logic',                 circuit: 'Individual / Knowing',    description: 'Questioning and finding answers.' },
  '47-64': { name: 'Abstraction',           circuit: 'Individual / Knowing',    description: 'Making sense of past experiences.' },
  '23-43': { name: 'Structuring',           circuit: 'Individual / Knowing',    description: 'Unique insights expressed clearly.' },
  // Individual — Centering Circuit
  '1-8':   { name: 'Inspiration',           circuit: 'Individual / Centering',  description: 'Creative self-expression and contribution.' },
  '2-14':  { name: 'The Beat',              circuit: 'Individual / Centering',  description: 'Direction powered by inner resources.' },
  '7-31':  { name: 'The Alpha',             circuit: 'Individual / Centering',  description: 'Democratic leadership and guidance.' },
  '10-20': { name: 'Awakening',             circuit: 'Individual / Centering',  description: 'Living authentically in the present.' },
  '10-34': { name: 'Exploration',           circuit: 'Individual / Centering',  description: 'Self-empowerment and independence.' },
  '10-57': { name: 'Perfected Form',        circuit: 'Individual / Centering',  description: 'Intuitive authenticity.' },
  '25-51': { name: 'Initiation',            circuit: 'Individual / Centering',  description: 'Courageous transformation and awakening.' },
  // Collective — Logic Circuit
  '17-62': { name: 'Acceptance',            circuit: 'Collective / Logic',      description: 'Organizing and communicating logical patterns.' },
  '18-58': { name: 'Judgment',              circuit: 'Collective / Logic',      description: 'Improvement and correction.' },
  '16-48': { name: 'Talent',                circuit: 'Collective / Logic',      description: 'Mastery developed through practice.' },
  '20-57': { name: 'Brainwave',             circuit: 'Collective / Logic',      description: 'Instant intuitive awareness.' },
  '9-52':  { name: 'Concentration',         circuit: 'Collective / Logic',      description: 'Sustained focus and attention.' },
  // Collective — Sensing Circuit
  '11-56': { name: 'Curiosity',             circuit: 'Collective / Sensing',    description: 'Ideas shared through stories.' },
  '13-33': { name: 'The Prodigal',          circuit: 'Collective / Sensing',    description: 'Reflection and collective memory.' },
  '35-36': { name: 'Transitoriness',        circuit: 'Collective / Sensing',    description: 'Growth through experience and change.' },
  '30-41': { name: 'Recognition of Feelings', circuit: 'Collective / Sensing',  description: 'Desire fueling experience.' },
  '42-53': { name: 'Maturation',            circuit: 'Collective / Sensing',    description: 'Development through cycles and completion.' },
  // Tribal — Defense Circuit
  '27-50': { name: 'Preservation',          circuit: 'Tribal / Defense',        description: 'Care, responsibility, and protection.' },
  '32-54': { name: 'Transformation',        circuit: 'Tribal / Defense',        description: 'Ambition and material success.' },
  '6-59':  { name: 'Mating',               circuit: 'Tribal / Defense',        description: 'Intimacy, bonding, and reproduction.' },
  // Tribal — Ego Circuit
  '21-45': { name: 'Money Line',            circuit: 'Tribal / Ego',            description: 'Management of resources and leadership.' },
  '26-44': { name: 'Surrender',             circuit: 'Tribal / Ego',            description: 'Persuasion, salesmanship, and influence.' },
  '37-40': { name: 'Community',             circuit: 'Tribal / Ego',            description: 'Agreements, family, and mutual support.' },
  // Integration Circuit
  '20-34': { name: 'Charisma',              circuit: 'Integration',             description: 'Powerful action in the present moment.' },
  '34-57': { name: 'Power',                 circuit: 'Integration',             description: 'Intuitive survival energy.' },
  // Bridge Channels
  '3-60':  { name: 'Mutation',              circuit: 'Bridge',                  description: 'Innovation emerging from limitation.' },
  '28-38': { name: 'Struggle',              circuit: 'Bridge',                  description: 'Finding purpose through challenge.' },
  '39-55': { name: 'Emoting',               circuit: 'Bridge',                  description: 'Emotional provocation and spirit.' },
  '12-22': { name: 'Openness',              circuit: 'Bridge',                  description: 'Emotional expression and social grace.' },
  '19-49': { name: 'Synthesis',             circuit: 'Bridge',                  description: 'Sensitivity to needs and values.' },
  '5-15':  { name: 'Rhythm',                circuit: 'Bridge',                  description: 'Natural flow and extremes.' },
  '29-46': { name: 'Discovery',             circuit: 'Bridge',                  description: 'Commitment leading to experience.' },
}

function channelKey(a: number, b: number): string {
  return `${Math.min(a, b)}-${Math.max(a, b)}`
}

// ── Channel catalogue ─────────────────────────────────────────
// All 36 Human Design channels, each identified by its two gate numbers.

export interface ChannelDef {
  from: number;
  to: number;
  /**
   * When set, replaces the straight LineCurve3 with a QuadraticBezierCurve3
   * whose control point is at the xy-midpoint pushed by `bowZ` along z.
   * Negative = behind the bodygraph, positive = in front.
   */
  bowZ?: number;
}

export const CHANNEL_DEFS: ChannelDef[] = [
  { from: 2, to: 14, bowZ: 0.1 },
  { from: 1, to: 8, bowZ: 0.1 },
  { from: 3, to: 60, bowZ: 0.1 },
  { from: 4, to: 63, bowZ: 0.1 },
  { from: 5, to: 15, bowZ: 0.1 },
  { from: 6, to: 59, bowZ: 0.1 },
  { from: 7, to: 31, bowZ: 0.1 },
  { from: 9, to: 52, bowZ: 0.1 },
  { from: 10, to: 20, bowZ: 0.1 },
  { from: 10, to: 34, bowZ: 0.1 },
  { from: 10, to: 57, bowZ: 0.1 },
  { from: 11, to: 56, bowZ: 0.1 },
  { from: 12, to: 22, bowZ: 0.4 },
  { from: 13, to: 33, bowZ: 0.1 },
  { from: 16, to: 48, bowZ: 0.6 },
  { from: 17, to: 62, bowZ: 0.1 },
  { from: 18, to: 58, bowZ: 0.6 },
  { from: 19, to: 49, bowZ: 0.2 },
  { from: 20, to: 34, bowZ: -1.2 },
  { from: 20, to: 57, bowZ: 0.4 },
  { from: 21, to: 45, bowZ: 0.1 },
  { from: 23, to: 43, bowZ: 0.1 },
  { from: 24, to: 61, bowZ: 0.1 },
  { from: 25, to: 51, bowZ: 0.1 },
  { from: 26, to: 44, bowZ: 0.7 },
  { from: 27, to: 50, bowZ: 0.1 },
  { from: 28, to: 38, bowZ: 0.4 },
  { from: 29, to: 46, bowZ: 0.1 },
  { from: 30, to: 41, bowZ: 0.6 },
  { from: 32, to: 54, bowZ: 0.2 },
  { from: 34, to: 57, bowZ: 0.1 },
  { from: 35, to: 36, bowZ: 0.6 },
  { from: 37, to: 40, bowZ: 0.1 },
  { from: 39, to: 55, bowZ: 0.4 },
  { from: 42, to: 53, bowZ: 0.1 },
  { from: 47, to: 64, bowZ: 0.1 },
];

// ── Rendering ─────────────────────────────────────────────────

const PIPE_RADIUS    = 0.018;
const PARTICLE_COUNT = 6;
const DISC_GEO       = new THREE.CircleGeometry(0.026, 10);

// Stable per-instance random parameters for particle animation
function makeParticleParams(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    phase: (i / n) + (Math.random() - 0.5) * (0.6 / n),
    speed: 0.08 + Math.random() * 0.16,   // curve units / second
    freq:  2.5  + Math.random() * 5,      // glitter pulse frequency
    pOff:  Math.random() * Math.PI * 2,   // pulse phase offset
  }))
}

// Disc particles that slide along `curve`, billboard toward the camera,
// and glitter by pulsing scale + opacity.
function ActiveParticles({ curve }: { curve: THREE.Curve<THREE.Vector3> }) {
  const { camera } = useThree()
  const refs   = useRef<(THREE.Mesh | null)[]>(new Array(PARTICLE_COUNT).fill(null))
  const params = useMemo(() => makeParticleParams(PARTICLE_COUNT), [])
  // Reusable quaternions — avoid per-frame allocation
  const _pq = useMemo(() => new THREE.Quaternion(), [])
  const _bq = useMemo(() => new THREE.Quaternion(), [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    // Correct billboard quaternion: local_quat = parent_world_quat⁻¹ × camera_world_quat.
    // Doing this once per channel (all particles share the same parent transform).
    const first = refs.current.find(Boolean)
    if (first?.parent) {
      first.parent.getWorldQuaternion(_pq)
      _pq.invert()
      _bq.multiplyQuaternions(_pq, camera.quaternion)
    } else {
      _bq.copy(camera.quaternion)
    }

    refs.current.forEach((mesh, i) => {
      if (!mesh) return
      const p = params[i]
      const tPos = ((p.phase + t * p.speed) % 1 + 1) % 1
      mesh.position.copy(curve.getPoint(tPos))
      mesh.quaternion.copy(_bq)
      const pulse = Math.abs(Math.sin(t * p.freq + p.pOff))
      mesh.scale.setScalar(0.3 + 0.7 * pulse)
      ;(mesh.material as THREE.MeshStandardMaterial).opacity = 0.2 + 0.8 * pulse
    })
  })

  return (
    <>
      {params.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => { refs.current[i] = el }}
          geometry={DISC_GEO}
        >
          <meshStandardMaterial
            color="#ffe066"
            emissive="#ffe066"
            emissiveIntensity={0.6}
            metalness={0.6}
            roughness={0.2}
            transparent
            opacity={0.9}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  )
}

function halfProps(
  gate: number,
  personality: ReadonlySet<number> | undefined,
  design: ReadonlySet<number> | undefined,
): { color: string; opacity: number } {
  if (personality?.has(gate))
    return {
      color: CHANNEL_COLOR_PERSONALITY,
      opacity: CHANNEL_OPACITY_DEFAULT,
    };
  if (design?.has(gate))
    return { color: CHANNEL_COLOR_DESIGN, opacity: CHANNEL_OPACITY_DEFAULT };
  return { color: CHANNEL_COLOR_DEFAULT, opacity: CHANNEL_OPACITY_DEFAULT };
}

// ── Component ─────────────────────────────────────────────────

interface ChannelProps {
  from: number;
  to: number;
  bowZ?: number;
  personalityGates?: ReadonlySet<number>;
  designGates?: ReadonlySet<number>;
  /** Gate world-position lookup built once in BodygraphMesh */
  posMap: ReadonlyMap<number, THREE.Vector3>;
}

export default function Channel({
  from,
  to,
  bowZ,
  personalityGates,
  designGates,
  posMap,
}: ChannelProps) {
  const showTooltip      = useStore((s) => s.showTooltip);
  const chartActiveGates = useStore((s) => s.chartActiveGates);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const start = posMap.get(from);
  const end   = posMap.get(to);

  const curves = useMemo(() => {
    if (!start || !end) return null;

    if (bowZ !== undefined) {
      const C = new THREE.Vector3(
        (start.x + end.x) / 2,
        (start.y + end.y) / 2,
        (start.z + end.z) / 2 + bowZ,
      );
      const mid = new THREE.Vector3(
        0.25 * start.x + 0.5 * C.x + 0.25 * end.x,
        0.25 * start.y + 0.5 * C.y + 0.25 * end.y,
        0.25 * start.z + 0.5 * C.z + 0.25 * end.z,
      );
      const c1 = start.clone().add(C).multiplyScalar(0.5);
      const c2 = C.clone().add(end).multiplyScalar(0.5);
      return {
        curve1:    new THREE.QuadraticBezierCurve3(start.clone(), c1, mid),
        curve2:    new THREE.QuadraticBezierCurve3(mid, c2, end.clone()),
        fullCurve: new THREE.QuadraticBezierCurve3(start.clone(), C, end.clone()),
      };
    }

    const mid = new THREE.Vector3(
      (start.x + end.x) / 2,
      (start.y + end.y) / 2,
      (start.z + end.z) / 2,
    );
    return {
      curve1:    new THREE.LineCurve3(start.clone(), mid),
      curve2:    new THREE.LineCurve3(mid.clone(), end.clone()),
      fullCurve: new THREE.LineCurve3(start.clone(), end.clone()),
    };
  }, [start, end, bowZ]);

  if (!curves) return null;

  const { curve1, curve2, fullCurve } = curves;
  const isActive = !!(chartActiveGates?.has(from) && chartActiveGates?.has(to));

  const p1    = halfProps(from, personalityGates, designGates);
  const p2    = halfProps(to,   personalityGates, designGates);
  const boost = hovered ? 0.1 : 0;

  const handleClick = (e: { stopPropagation(): void; nativeEvent: MouseEvent }) => {
    e.stopPropagation();
    const meta = CHANNEL_META[channelKey(from, to)]
    const statusLabel = chartActiveGates ? (isActive ? ' — Active' : ' — Inactive') : ''
    const title = meta ? `Channel ${from}–${to}: ${meta.name}${statusLabel}` : `Channel ${from}–${to}${statusLabel}`
    const lines = meta ? [`${meta.circuit}`, meta.description] : undefined
    showTooltip(title, e.nativeEvent.clientX, e.nativeEvent.clientY, lines)
  };
  const handleEnter = (e: { stopPropagation(): void }) => { e.stopPropagation(); setHovered(true); };
  const handleLeave = () => setHovered(false);

  return (
    <>
      <mesh onClick={handleClick} onPointerEnter={handleEnter} onPointerLeave={handleLeave}>
        <tubeGeometry args={[curve1, 10, PIPE_RADIUS, 8, false]} />
        <meshPhongMaterial color={p1.color} shininess={80} side={THREE.DoubleSide} transparent opacity={Math.min(1, p1.opacity + boost)} />
      </mesh>
      <mesh onClick={handleClick} onPointerEnter={handleEnter} onPointerLeave={handleLeave}>
        <tubeGeometry args={[curve2, 10, PIPE_RADIUS, 8, false]} />
        <meshPhongMaterial color={p2.color} shininess={80} side={THREE.DoubleSide} transparent opacity={Math.min(1, p2.opacity + boost)} />
      </mesh>

      {isActive && <ActiveParticles curve={fullCurve} />}
    </>
  );
}

import * as THREE from 'three'
import { useMemo, useState, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useCursor } from '@react-three/drei'
import Gate, { GateData, GATE_RADIUS } from './Gate'
import { useStore } from '../../store/useStore'
import {
  COLOR_TEAL,
  OPACITY_CENTER_NEUTRAL,
  OPACITY_CENTER_DEFINED,
} from '../../constants/colors'

export type CentreShape = 'triangle' | 'square' | 'rhombus'

export interface EnergyCenterProps {
  shape: CentreShape
  /**
   * Primary dimension in Three.js scene units (≈ SVG px × 0.01):
   *  • triangle → equilateral side length
   *  • square   → height  (width = size × aspectRatio)
   *  • rhombus  → side length  (diagonal = size × √2)
   */
  size: number
  /**
   * Width-to-height multiplier for 'square' — allows rectangles.
   * Default 1 (perfect square).
   */
  aspectRatio?: number
  color?: string
  /** Extrusion depth in scene units. Default 0.20. */
  depth?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
  /**
   * Gates to display on the front face of this centre.
   * Each gate's position is in visual coordinates:
   *   +x = visual right, +y = visual up
   * EnergyCenter converts these to its local space automatically.
   */
  gates?: GateData[]
  /**
   * undefined = no chart loaded → neutral (0.5 opacity)
   * true      = centre is defined in the loaded chart → full color, high opacity
   * false     = centre is undefined in the loaded chart → grey, very dim
   */
  isDefined?: boolean
  /** Set of active gate numbers from the loaded chart (passed through to Gate children). */
  activeGates?: ReadonlySet<number>
  /** Human-readable identifier used in click logs. */
  centreId?: string
}

const DEPTH_DEFAULT  = 0.20
const COLOR_DEFAULT  = COLOR_TEAL
const CORNER_RADIUS  = 0.04   // scene units — tweak here to adjust rounding

// ── Shape factory ─────────────────────────────────────────────
// All shapes are centred at (0, 0) and wound counter-clockwise
// in Three.js y-up space so the extruded front face is at +z.

/**
 * Build a rounded polygon from an ordered list of [x, y] vertices.
 * Each corner is replaced by a quadratic bezier arc of radius `r`.
 */
function roundedPolygon(pts: [number, number][], r: number): THREE.Shape {
  const s = new THREE.Shape()
  const n = pts.length

  for (let i = 0; i < n; i++) {
    const [cx, cy] = pts[i]
    const [px, py] = pts[(i - 1 + n) % n]
    const [nx, ny] = pts[(i + 1) % n]

    // Unit vectors from corner toward the two neighbouring vertices
    const dpx = px - cx, dpy = py - cy, dpl = Math.hypot(dpx, dpy)
    const dnx = nx - cx, dny = ny - cy, dnl = Math.hypot(dnx, dny)

    const clamp = Math.min(r, dpl / 2, dnl / 2)

    // Points on the two edges, `clamp` units away from the corner
    const ep = [cx + (dpx / dpl) * clamp, cy + (dpy / dpl) * clamp] as [number, number]
    const en = [cx + (dnx / dnl) * clamp, cy + (dny / dnl) * clamp] as [number, number]

    if (i === 0) s.moveTo(ep[0], ep[1])
    else         s.lineTo(ep[0], ep[1])

    s.quadraticCurveTo(cx, cy, en[0], en[1])
  }

  s.closePath()
  return s
}

function buildShape(type: CentreShape, size: number, ar: number): THREE.Shape {
  switch (type) {
    case 'triangle': {
      // Equilateral triangle, apex pointing up (+y), centroid at origin.
      const h = (size * Math.sqrt(3)) / 2
      return roundedPolygon([
        [-size / 2, -h / 3],   // bottom-left
        [ size / 2, -h / 3],   // bottom-right
        [0,        (2*h) / 3], // apex
      ], CORNER_RADIUS)
    }

    case 'square': {
      // Rectangle centred at origin: width = size × ar, height = size.
      const hw = (size * ar) / 2
      const hh = size / 2
      return roundedPolygon([
        [-hw, -hh],
        [ hw, -hh],
        [ hw,  hh],
        [-hw,  hh],
      ], CORNER_RADIUS)
    }

    case 'rhombus': {
      // Square rotated 45°.  Side = size → diagonal = size × √2.
      const d = (size * Math.SQRT2) / 2
      return roundedPolygon([
        [ d,  0],
        [ 0,  d],
        [-d,  0],
        [ 0, -d],
      ], CORNER_RADIUS)
    }
  }
}

/**
 * Convert a gate's visual [x, y] offset (positive x = visual right,
 * positive y = visual up) into the EnergyCenter group's local space,
 * compensating for the group's z-axis rotation.
 *
 * For rotation[2] = 0   → local = visual  (no change)
 * For rotation[2] = π   → local = -visual (x and y both flipped)
 */
function visualToLocal(
  vx: number,
  vy: number,
  rz: number,
): [number, number] {
  const c = Math.cos(rz)
  const s = Math.sin(rz)
  return [vx * c + vy * s, -vx * s + vy * c]
}

// ── Defined-center particle effect ────────────────────────────

const PARTICLE_COUNT = 6
const PART_GEO       = new THREE.SphereGeometry(0.009, 8, 6)

/** Radius of the largest circle that fits inside the shape (with safety margin). */
function inscribedRadius(shape: CentreShape, size: number, ar: number): number {
  switch (shape) {
    case 'triangle': return (size * Math.sqrt(3)) / 6 * 0.92
    case 'square':   return Math.min(size * ar, size) / 2 * 0.92
    case 'rhombus':  return (size / 2) * 0.92
  }
}

function randomDisk(r: number): [number, number] {
  const angle = Math.random() * Math.PI * 2
  const rad   = Math.sqrt(Math.random()) * r   // uniform disk sampling
  return [Math.cos(angle) * rad, Math.sin(angle) * rad]
}

function DefinedParticles({
  shape, size, ar, depth,
}: {
  shape: CentreShape; size: number; ar: number; depth: number
}) {
  const refs     = useRef<(THREE.Mesh | null)[]>(new Array(PARTICLE_COUNT).fill(null))
  const xyLimit  = inscribedRadius(shape, size, ar)
  const zHalf    = depth / 2 * 0.85   // keep particles inside the extrusion volume

  const state = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => {
      const [x, y] = randomDisk(xyLimit * 0.6)
      const z      = (Math.random() * 2 - 1) * zHalf
      const speed  = 0.02 + Math.random() * 0.04
      const angle  = Math.random() * Math.PI * 2
      return {
        x, y, z,
        vx:   Math.cos(angle) * speed,
        vy:   Math.sin(angle) * speed,
        vz:   (Math.random() - 0.5) * 0.025,
        freq: 2 + Math.random() * 4,
        pOff: Math.random() * Math.PI * 2,
      }
    })
  )

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime()
    state.current.forEach((p, i) => {
      const mesh = refs.current[i]
      if (!mesh) return

      p.x += p.vx * delta
      p.y += p.vy * delta
      p.z += p.vz * delta

      // XY: reset when outside inscribed circle
      if (p.x * p.x + p.y * p.y > xyLimit * xyLimit) {
        const [nx, ny] = randomDisk(xyLimit * 0.5)
        p.x = nx; p.y = ny
        const a = Math.random() * Math.PI * 2
        const s = 0.02 + Math.random() * 0.04
        p.vx = Math.cos(a) * s
        p.vy = Math.sin(a) * s
      }

      // Z: bounce off front/back faces
      if (Math.abs(p.z) > zHalf) {
        p.vz = -p.vz
        p.z  = Math.sign(p.z) * zHalf
      }

      mesh.position.set(p.x, p.y, p.z)
      const pulse = Math.abs(Math.sin(t * p.freq + p.pOff))
      mesh.scale.setScalar(0.3 + 0.7 * pulse)
      ;(mesh.material as THREE.MeshStandardMaterial).opacity = 0.2 + 0.8 * pulse
    })
  })

  return (
    <>
      {state.current.map((_, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el }} geometry={PART_GEO}>
          <meshStandardMaterial
            color="#ffe066"
            emissive="#ffe066"
            emissiveIntensity={0.6}
            metalness={0.6}
            roughness={0.2}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </>
  )
}

// ── Center metadata ───────────────────────────────────────────

const CENTER_META: Record<string, { displayName: string; lines: [string, string] }> = {
  head:   { displayName: 'Head Center',              lines: ['Inspiration, ideas, questions, and mental pressure to think.', 'Associated with conceptual and abstract inspiration.'] },
  ajna:   { displayName: 'Ajna Center',              lines: ['Analysis, opinions, beliefs, and mental processing.', 'Helps organize and interpret information.'] },
  throat: { displayName: 'Throat Center',            lines: ['Communication, expression, and manifestation.', 'The center through which ideas and energy are expressed outwardly.'] },
  g:      { displayName: 'G Center',                 lines: ['Identity, love, direction, and sense of self.', 'Often described as the center of personal purpose and orientation.'] },
  heart:  { displayName: 'Heart (Ego/Will) Center',  lines: ['Willpower, motivation, self-worth, and material resources.', 'Connected to commitment and the drive to achieve.'] },
  solar:  { displayName: 'Solar Plexus Center',      lines: ['Emotions, feelings, and emotional awareness.', 'Considered the emotional center of the Human Design system.'] },
  sacral: { displayName: 'Sacral Center',            lines: ['Life-force energy, work, creativity, sexuality, and sustainable vitality.', 'A key center for generators and manifesting generators.'] },
  spleen: { displayName: 'Spleen Center',            lines: ['Intuition, instinct, health, and survival awareness.', 'Associated with immediate, spontaneous knowing.'] },
  root:   { displayName: 'Root Center',              lines: ['Stress, pressure, drive, and momentum.', 'Provides the energy to begin and complete processes.'] },
}

// ── Component ─────────────────────────────────────────────────

export default function EnergyCenter({
  shape,
  size,
  aspectRatio = 1,
  color       = COLOR_DEFAULT,
  depth       = DEPTH_DEFAULT,
  position    = [0, 0, 0],
  rotation    = [0, 0, 0],
  gates       = [],
  isDefined,
  activeGates,
  centreId,
}: EnergyCenterProps) {
  const showTooltip = useStore((s) => s.showTooltip)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)
  const geo  = useMemo(
    () => buildShape(shape, size, aspectRatio),
    [shape, size, aspectRatio],
  )
  const opts = useMemo<THREE.ExtrudeGeometryOptions>(
    () => ({ depth, bevelEnabled: false }),
    [depth],
  )

  // Front face of the extrusion is at group-local z = +depth/2.
  // The inner mesh is shifted back by depth/2 so the slab is centred
  // on the group origin. Gates sit just proud of the front face.
  const meshZ  = -depth / 2
  const gateZ  =  depth / 2 + GATE_RADIUS
  const rz     = rotation[2]

  // undefined → no chart: own colour, 0.5 opacity
  // true      → defined: own colour, nearly opaque
  // false     → undefined centre: channel teal, 0.5 opacity
  // No chart (undefined) → neutral teal for all centres
  // Chart loaded, defined (true) → centre's own colour
  // Chart loaded, undefined (false) → neutral teal
  const matColor = isDefined === true ? color : COLOR_TEAL

  return (
    <group position={position} rotation={rotation}>
      <mesh
        position-z={meshZ}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true) }}
        onPointerLeave={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation()
          const meta = centreId ? CENTER_META[centreId] : undefined
          const displayName = meta?.displayName ?? `Center: ${centreId ?? shape}`
          const definedLabel = isDefined === true ? ' — Defined' : isDefined === false ? ' — Open' : ''
          showTooltip(
            `${displayName}${definedLabel}`,
            e.nativeEvent.clientX,
            e.nativeEvent.clientY,
            meta?.lines,
          )
        }}
      >
        <extrudeGeometry args={[geo, opts]} />
        <meshPhongMaterial
          color={matColor}
          shininess={80}
          side={THREE.DoubleSide}
          transparent
          opacity={Math.min(1, (isDefined === true ? OPACITY_CENTER_DEFINED : OPACITY_CENTER_NEUTRAL) + (hovered ? 0.1 : 0))}
        />
      </mesh>

      {gates.map((gate, i) => {
        const [lx, ly] = visualToLocal(gate.position[0], gate.position[1], rz)
        return (
          <Gate
            key={i}
            value={gate.value}
            position={[lx, ly, gateZ]}
            rotation={[0, 0, -rz]}
            isActive={activeGates?.has(gate.value)}
          />
        )
      })}

      {isDefined === true && (
        <DefinedParticles
          shape={shape}
          size={size}
          ar={aspectRatio}
          depth={depth}
        />
      )}
    </group>
  )
}

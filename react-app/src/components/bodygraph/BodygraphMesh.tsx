import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useStore } from "../../store/useStore";
import EnergyCenter, { EnergyCenterProps } from "./EnergyCenter";
import {
  CENTER_COLOR_HEAD,
  CENTER_COLOR_AJNA,
  CENTER_COLOR_THROAT,
  CENTER_COLOR_G,
  CENTER_COLOR_HEART,
  CENTER_COLOR_SACRAL,
  CENTER_COLOR_ROOT,
  CENTER_COLOR_SPLEEN,
  CENTER_COLOR_SOLAR,
} from "../../constants/colors";
import { GateData, GATE_RADIUS } from "./Gate";
import Channel, { CHANNEL_DEFS } from "./Channel";

// ── Coordinate mapping: SVG (360×530, y-down) → Three.js (y-up) ──
const S = 0.01; // 1 SVG px  →  0.01 Three.js units
const CX = 180; // SVG x=180 → Three.js x=0
const CY = 265; // SVG y=265 → Three.js y=0
const tx = (x: number) => (x - CX) * S;
const ty = (y: number) => -(y - CY) * S;

type P3 = [number, number, number];

/** Build a Three.js world position from SVG x,y of the shape centroid */
const svgPos = (x: number, y: number): P3 => [tx(x), ty(y), 0];

/** Flip a shape upside-down (rotation around z by 180°) */
const ROT_DOWN: P3 = [0, 0, Math.PI];

// ── 9 Energy Centres ──────────────────────────────────────────
// Positions are the geometric centroids of the original SVG shapes.
// Sizes are converted from SVG px × S.
// aspectRatio on 'square' lets Throat / Sacral / Root be proper rectangles.

// ── Gate position data ─────────────────────────────────────────
// All positions are in VISUAL coordinates relative to each centre's
// visual centre: +x = right, +y = up. EnergyCenter converts these
// to local space automatically, accounting for the centre's rotation.

const HEAD_GATES: GateData[] = [
  { value: 64, position: [-0.15, -0.05] },
  { value: 61, position: [0, 0.15] },
  { value: 63, position: [0.15, -0.05] },
];

const AJNA_GATES: GateData[] = [
  // Upper row (visual top = flat side of down-pointing triangle)
  { value: 47, position: [-0.15, 0.08] },
  { value: 24, position: [0, 0.08] },
  { value: 4, position: [0.15, 0.08] },
  // Lower rows
  { value: 17, position: [-0.08, -0.05] },
  { value: 11, position: [0.08, -0.05] },
  { value: 43, position: [0, -0.2] },
];

const THROAT_GATES: GateData[] = [
  // Top row
  { value: 62, position: [-0.12, 0.2] },
  { value: 23, position: [0, 0.2] },
  { value: 56, position: [0.12, 0.2] },
  // Left column
  { value: 16, position: [-0.2, 0.09] },
  { value: 20, position: [-0.2, -0.05] },
  // Right column
  { value: 35, position: [0.2, 0.09] },
  { value: 12, position: [0.2, -0.05] },
  // Bottom row — mirrors the top row spacing
  { value: 31, position: [-0.12, -0.2] },
  { value: 8, position: [0, -0.2] },
  { value: 33, position: [0.12, -0.2] },
  { value: 45, position: [0.24, -0.2] },
];

const G_GATES: GateData[] = [
  { value: 1, position: [0, 0.22] },
  { value: 7, position: [-0.14, 0.12] },
  { value: 13, position: [0.14, 0.12] },
  { value: 10, position: [-0.27, 0] },
  { value: 25, position: [0.27, 0] },
  { value: 15, position: [-0.14, -0.12] },
  { value: 46, position: [0.14, -0.12] },
  { value: 2, position: [0, -0.22] },
];

const HEART_GATES: GateData[] = [
  { value: 40, position: [0.10, -0.10] }, // apex corner (lower-right after 45° CCW)
  { value: 21, position: [0.04, 0.14] }, // opposite side, near upper-right vertex
  { value: 51, position: [-0.04, 0.05] }, // opposite side, midpoint
  { value: 26, position: [-0.12, -0.04] }, // opposite side, near lower-left vertex
];

const SACRAL_GATES: GateData[] = [
  { value: 34, position: [-0.2, 0.09] },
  { value: 14, position: [0, 0.2] },
  { value: 29, position: [0.12, 0.2] },
  { value: 9, position: [0.12, -0.2] },
  { value: 3, position: [0, -0.2] },
  { value: 42, position: [-0.12, -0.2] },
  { value: 5, position: [-0.12, 0.2] },
  { value: 59, position: [0.2, -0.05] },
  { value: 27, position: [-0.2, -0.05] },
];

const ROOT_GATES: GateData[] = [
  { value: 53, position: [-0.12, 0.2] },
  { value: 60, position: [0, 0.2] },
  { value: 52, position: [0.12, 0.2] },
  { value: 54, position: [-0.20, 0.07] },
  { value: 19, position: [0.20, 0.07] },
  { value: 39, position: [0.20, -0.06] },
  { value: 38, position: [-0.20, -0.06] },
  { value: 41, position: [0.20, -0.19] },
  { value: 58, position: [-0.20, -0.19] },
];

const SPLEEN_GATES: GateData[] = [
  // Visual down-pointing triangle: base at top, apex at bottom
  { value: 48, position: [-0.09, 0.31] },
  { value: 57, position: [0.04, 0.18] },
  { value: 44, position: [0.18, 0.04] },
  { value: 50, position: [0.31, -0.08] },
  { value: 32, position: [0.13, -0.12] },
  { value: 28, position: [-0.05, -0.18] },
  { value: 18, position: [-0.23, -0.23] },
];

const SOLAR_GATES: GateData[] = [
  { value: 6, position: [-0.31, -0.08] }, // apex (right corner)
  { value: 37, position: [-0.18, 0.05] }, // upper side — near top vertex
  { value: 22, position: [-0.03, 0.18] }, // upper side — midpoint
  { value: 36, position: [0.09, 0.31] }, // upper side — near apex
  { value: 49, position: [-0.13, -0.13] }, // lower side — near bottom-left vertex
  { value: 55, position: [0.06, -0.18] }, // lower side — midpoint
  { value: 30, position: [0.23, -0.23] }, // lower side — near apex
];

const CENTRES: Array<EnergyCenterProps & { id: string }> = [
  {
    id: "head",
    shape: "triangle",
    size: 0.68,
    color: CENTER_COLOR_HEAD,
    position: svgPos(180, 60), // centroid of (180,14)(146,72)(214,72)
    gates: HEAD_GATES,
  },
  {
    id: "ajna",
    shape: "triangle",
    size: 0.68,
    color: CENTER_COLOR_AJNA,
    position: svgPos(180, 116), // centroid of trapezoid (157-203,84)-(164-196,148)
    rotation: ROT_DOWN,
    gates: AJNA_GATES,
  },
  {
    id: "throat",
    shape: "square",
    size: 0.56,
    color: CENTER_COLOR_THROAT,
    position: svgPos(180, 190), // centre of rect 143,162 w74 h56
    gates: THROAT_GATES,
  },
  {
    id: "g",
    shape: "rhombus",
    size: 0.57, // side ≈ 80/√2 SVG px
    color: CENTER_COLOR_G,
    position: svgPos(180, 268), // centre of diamond (180,228)(220,268)(180,308)(140,268)
    gates: G_GATES,
  },
  {
    id: "heart",
    shape: "triangle",
    size: 0.5,
    color: CENTER_COLOR_HEART,
    position: svgPos(250, 300), // centroid of (244,262)(284,262)(264,308)
    rotation: [0, 0, (5 * Math.PI) / 4] as P3, // ROT_DOWN + 45° CCW → apex points lower-right
    gates: HEART_GATES,
  },
  {
    id: "sacral",
    shape: "square",
    size: 0.56,
    color: CENTER_COLOR_SACRAL,
    position: svgPos(180, 360), // centre of rect 143,320 w74 h52
    gates: SACRAL_GATES,
  },
  {
    id: "root",
    shape: "square",
    size: 0.56,
    color: CENTER_COLOR_ROOT,
    position: svgPos(180, 440), // centre of rect 143,428 w74 h56
    gates: ROOT_GATES,
  },
  {
    id: "spleen",
    shape: "triangle",
    size: 0.78,
    color: CENTER_COLOR_SPLEEN,
    position: svgPos(60, 338), // centroid of (40,312)(118,312)(79,390)
    rotation: [0, 0, (-5 * Math.PI) / 4] as P3,
    gates: SPLEEN_GATES,
  },
  {
    id: "solar",
    shape: "triangle",
    size: 0.78,
    color: CENTER_COLOR_SOLAR,
    position: svgPos(300, 338), // centroid of (242,312)(320,312)(281,390)
    rotation: [0, 0, (5 * Math.PI) / 4] as P3, // ROT_DOWN + 45° CCW → apex points lower-right (right corner)
    gates: SOLAR_GATES,
  },
];

// ── Gate world-position map ────────────────────────────────────
// Gate positions are in visual coords (centre + visual offset), so:
//   world_x = centre.position[0] + gate.position[0]
//   world_y = centre.position[1] + gate.position[1]
//   world_z = DEPTH_DEFAULT/2 + GATE_RADIUS  (front face of the extrusion)
// DEPTH_DEFAULT = 0.20 (EnergyCenter), GATE_RADIUS imported from Gate.
const GATE_WORLD_Z = 0.2 / 2 + GATE_RADIUS; // 0.130

const GATE_POS_MAP = (() => {
  const map = new Map<number, THREE.Vector3>();
  for (const centre of CENTRES) {
    const [cx, cy, cz] = centre.position ?? [0, 0, 0];
    for (const gate of centre.gates ?? []) {
      map.set(
        gate.value,
        new THREE.Vector3(
          cx + gate.position[0],
          cy + gate.position[1],
          cz + GATE_WORLD_Z,
        ),
      );
    }
  }
  return map as ReadonlyMap<number, THREE.Vector3>;
})();

// ── Scene root ────────────────────────────────────────────────

export default function BodygraphMesh() {
  const chartActiveGates      = useStore((s) => s.chartActiveGates)
  const chartDefinedCenterIds = useStore((s) => s.chartDefinedCenterIds)
  const chartPersonalityGates = useStore((s) => s.chartPersonalityGates)
  const chartDesignGates      = useStore((s) => s.chartDesignGates)
  const groupRef = useRef<THREE.Group>(null);
  const lastResetRef = useRef(0); // tracks the last resetToken we handled

  useFrame(() => {
    if (!groupRef.current) return;
    const { autoSpin, speed, resetToken } = useStore.getState();

    // Reset rotation atomically inside the rAF loop — avoids the race between
    // useEffect (commit phase) and OrbitControls / useFrame (rAF phase).
    if (resetToken !== lastResetRef.current) {
      lastResetRef.current = resetToken;
      groupRef.current.rotation.set(0, 0, 0);
      return; // skip spinning on the same frame as a reset
    }

    if (autoSpin) groupRef.current.rotation.y += 0.008 * speed;
  });

  return (
    <group ref={groupRef} scale={1.2}>
      {CENTRES.map(({ id, ...centreProps }) => (
        <EnergyCenter
          key={id}
          {...centreProps}
          centreId={id}
          isDefined={
            chartDefinedCenterIds ? chartDefinedCenterIds.has(id) : undefined
          }
          activeGates={chartActiveGates ?? undefined}
        />
      ))}
      {CHANNEL_DEFS.map(({ from, to, bowZ }, i) => (
        <Channel
          key={i}
          from={from}
          to={to}
          bowZ={bowZ}
          personalityGates={chartPersonalityGates ?? undefined}
          designGates={chartDesignGates ?? undefined}
          posMap={GATE_POS_MAP}
        />
      ))}
    </group>
  );
}

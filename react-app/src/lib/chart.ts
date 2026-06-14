/**
 * Human Design Chart Engine — TypeScript
 *
 * Self-contained: no npm dependencies for chart calculation.
 *
 * Accuracy notes:
 *   Sun      ≈ 0.01°  (Meeus Ch. 25 — full series with nutation/aberration)
 *   Moon     ≈ 0.3°   (Meeus Ch. 47 — 59 main terms)
 *   N.Node   ≈ 0.5°   (mean node + main oscillating correction)
 *   Planets  ≈ 1–2°   (mean orbital elements + Kepler equation)
 *   All well within the 5.625° gate size used by Human Design.
 */

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

export interface GateLine {
  gate:   number
  line:   number
  degree: number
}

export interface ChartResult {
  type:              string
  profile:           string
  authority:         string
  defined_centers:   string[]
  undefined_centers: string[]
  personality:       Record<string, GateLine>
  design:            Record<string, GateLine>
  all_active_gates:  number[]
}

/* ═══════════════════════════════════════════════════════════════════════════
   MATH HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

const RAD = Math.PI / 180
const DEG = 180 / Math.PI

/** Normalise any angle to [0, 360). */
const mod360 = (x: number) => ((x % 360) + 360) % 360

/* ═══════════════════════════════════════════════════════════════════════════
   JULIAN DAY NUMBER
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Julian Day Number (UT) for a proleptic Gregorian calendar date.
 * @param year   - full year, e.g. 1988
 * @param month  - 1–12
 * @param day    - 1–31
 * @param hourUT - decimal UT hour, 0–24
 */
export function julianDay(year: number, month: number, day: number, hourUT = 0): number {
  if (month <= 2) { year -= 1; month += 12 }
  const A = Math.floor(year / 100)
  const B = 2 - A + Math.floor(A / 4)
  return Math.floor(365.25 * (year + 4716))
       + Math.floor(30.6001 * (month + 1))
       + day + hourUT / 24 + B - 1524.5
}

/* ═══════════════════════════════════════════════════════════════════════════
   KEPLER'S EQUATION
   ═══════════════════════════════════════════════════════════════════════════ */

/** Solve E = M + e·sin E for eccentric anomaly via Newton–Raphson. */
function solveKepler(M: number, e: number): number {
  let E = M
  for (let i = 0; i < 100; i++) {
    const dE = (M - E + e * Math.sin(E)) / (1 - e * Math.cos(E))
    E += dE
    if (Math.abs(dE) < 1e-12) break
  }
  return E
}

/* ═══════════════════════════════════════════════════════════════════════════
   SUN'S APPARENT ECLIPTIC LONGITUDE
   Jean Meeus "Astronomical Algorithms" Ch. 25 — accurate to 0.01°
   ═══════════════════════════════════════════════════════════════════════════ */

function sunApparentLongitude(T: number): number {
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T
  const M  = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * RAD
  const C  = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
           + (0.019993 - 0.000101 * T) * Math.sin(2 * M)
           +  0.000289 * Math.sin(3 * M)
  const omega = (125.04 - 1934.136 * T) * RAD
  return mod360(L0 + C - 0.00569 - 0.00478 * Math.sin(omega))
}

/* ═══════════════════════════════════════════════════════════════════════════
   MOON'S GEOCENTRIC ECLIPTIC LONGITUDE
   Jean Meeus Ch. 47 — 59 dominant terms, accurate to ~0.3°
   ═══════════════════════════════════════════════════════════════════════════ */

function moonLongitude(T: number): number {
  const L0 = mod360(218.3164477 + 481267.88123421 * T - 0.0015786 * T * T)
  const M  = mod360(357.5291092 +  35999.0502909  * T - 0.0001536 * T * T) // Sun anomaly
  const Mp = mod360(134.9633964 + 477198.8675055  * T + 0.0087414 * T * T) // Moon anomaly
  const D  = mod360(297.8501921 + 445267.1114034  * T - 0.0018819 * T * T) // Elongation
  const F  = mod360(93.2720950  + 483202.0175233  * T - 0.0036539 * T * T) // Arg. of latitude
  const E  = 1 - 0.002516 * T - 0.0000074 * T * T                         // Eccentricity

  // [dD, dM(sun), dM'(moon), dF, coefficient × 10⁻⁶ degrees]
  const terms: [number, number, number, number, number][] = [
    [0, 0,  1,  0,  6288774], [2, 0, -1,  0,  1274027], [2, 0,  0,  0,   658314],
    [0, 0,  2,  0,   213618], [0, 1,  0,  0,  -185116], [0, 0,  0,  2,  -114332],
    [2, 0, -2,  0,    58793], [2,-1, -1,  0,    57066], [2, 0,  1,  0,    53322],
    [2,-1,  0,  0,    45758], [0, 1, -1,  0,   -40923], [1, 0,  0,  0,   -34720],
    [0, 1,  1,  0,   -30383], [2, 0,  0, -2,    15327], [0, 0,  1,  2,   -12528],
    [0, 0,  1, -2,    10980], [4, 0, -1,  0,    10675], [0, 0,  3,  0,    10034],
    [4, 0, -2,  0,     8548], [2, 1, -1,  0,    -7888], [2, 1,  0,  0,    -6766],
    [1, 0, -1,  0,    -5163], [1, 1,  0,  0,     4987], [2,-1,  1,  0,     4036],
    [2, 0,  2,  0,     3994], [4, 0,  0,  0,     3861], [2, 0, -3,  0,     3665],
    [0, 1, -2,  0,    -2689], [2, 0, -1,  2,    -2602], [2,-1, -2,  0,     2390],
    [1, 0,  1,  0,    -2348], [2,-2,  0,  0,     2236], [0, 1,  2,  0,    -2120],
    [0, 2,  0,  0,    -2069], [2,-2, -1,  0,     2048], [2, 0,  1, -2,    -1773],
    [2, 0,  0,  2,    -1595], [4,-1, -1,  0,     1215], [0, 0,  2,  2,    -1110],
    [3, 0, -1,  0,     -892], [2, 1,  1,  0,     -810], [4,-1, -2,  0,      759],
    [0, 2, -1,  0,     -713], [2, 2, -1,  0,     -700], [2, 1, -2,  0,      691],
    [2,-1,  0, -2,      596], [4, 0,  1,  0,      549], [0, 0,  4,  0,      537],
    [4,-1,  0,  0,      520], [1, 0, -2,  0,     -487], [2, 1,  0, -2,     -399],
    [0, 0,  2, -2,     -381], [1, 1,  1,  0,      351], [3, 0, -2,  0,     -340],
    [4, 0, -3,  0,      330], [2,-1,  2,  0,      327], [0, 2,  1,  0,     -323],
    [1, 1, -1,  0,      299], [2, 0,  3,  0,      294],
  ]

  let dl = 0
  for (const [dD, dM, dMp, dF, c] of terms) {
    const arg = (dD * D + dM * M + dMp * Mp + dF * F) * RAD
    const ef  = Math.abs(dM) === 2 ? E * E : (Math.abs(dM) === 1 ? E : 1)
    dl += c * ef * Math.sin(arg)
  }
  return mod360(L0 + dl / 1e6)
}

/* ═══════════════════════════════════════════════════════════════════════════
   MOON'S TRUE (OSCULATING) NODE
   Mean node + main oscillating corrections — accurate to ~0.5°
   ═══════════════════════════════════════════════════════════════════════════ */

function trueNode(T: number): number {
  const Omega = mod360(125.04452 - 1934.136261 * T + 0.0020708 * T * T)
  const M  = mod360(357.5291092 + 35999.0502909  * T)
  const Mp = mod360(134.9633964 + 477198.8675055 * T)
  const D  = mod360(297.8501921 + 445267.1114034 * T)
  const F  = mod360(93.2720950  + 483202.0175233 * T)
  const corr = -1.4979 * Math.sin(2 * (D - F) * RAD)
               -0.1500 * Math.sin(M  * RAD)
               -0.1226 * Math.sin(2 *  D * RAD)
               +0.1176 * Math.sin(2 *  F * RAD)
               -0.0801 * Math.sin(2 * (Mp - F) * RAD)
  return mod360(Omega + corr)
}

/* ═══════════════════════════════════════════════════════════════════════════
   PLANET HELIOCENTRIC → GEOCENTRIC ECLIPTIC LONGITUDE
   Mean orbital elements (Meeus Table 31.a) + Kepler equation.
   Accurate to 1–2° — well within the 5.625° Human Design gate width.
   ═══════════════════════════════════════════════════════════════════════════ */

interface OrbitalElements {
  L0: number; L1: number; a: number
  e0: number; e1: number; i0: number
  W0: number; W1: number; P0: number; P1: number
}

// Mean orbital elements at J2000.0. Rates are per Julian century.
// { L0°, L1°/cy, a AU, e0, e1/cy, i0°, Ω0°, Ω1°/cy, ϖ0°, ϖ1°/cy }
const ORBITAL_ELEMENTS: Record<string, OrbitalElements> = {
  Mercury: { L0: 252.250906, L1: 149472.6746358, a:  0.38709927, e0: 0.20563593, e1:  2.037e-5,  i0:  7.004979, W0:  48.33167, W1: -0.12594, P0:  77.45645, P1: 0.15953 },
  Venus:   { L0: 181.979801, L1:  58517.8156760, a:  0.72332982, e0: 0.00677188, e1: -4.776e-5,  i0:  3.394662, W0:  76.67992, W1: -0.27858, P0: 131.56370, P1: 0.05690 },
  Earth:   { L0: 100.464457, L1:  35999.3728565, a:  1.00000011, e0: 0.01671022, e1: -4.204e-5,  i0:  0.000000, W0:   0.00000, W1:  0.00000, P0: 102.93735, P1: 0.71953 },
  Mars:    { L0: 355.432671, L1:  19140.2993313, a:  1.52366231, e0: 0.09341233, e1:  9.045e-5,  i0:  1.849726, W0:  49.57854, W1: -0.29257, P0: 336.04084, P1: 0.44441 },
  Jupiter: { L0:  34.351519, L1:   3034.9056606, a:  5.20260319, e0: 0.04849485, e1:  1.632e-4,  i0:  1.303270, W0: 100.46444, W1:  0.17441, P0:  14.33131, P1: 0.18103 },
  Saturn:  { L0:  50.077444, L1:   1222.1138488, a:  9.53707032, e0: 0.05550825, e1: -3.466e-4,  i0:  2.488879, W0: 113.71504, W1: -0.25015, P0:  92.86136, P1: 0.54479 },
  Uranus:  { L0: 314.055005, L1:    429.8640561, a: 19.19126393, e0: 0.04629590, e1: -2.734e-5,  i0:  0.773197, W0:  74.22988, W1:  0.07650, P0: 170.96424, P1: 0.40897 },
  Neptune: { L0: 304.348665, L1:    219.8833092, a: 30.06896348, e0: 0.00898809, e1:  6.408e-6,  i0:  1.769953, W0: 131.72169, W1: -0.00690, P0:  44.96476, P1: 0.68050 },
  Pluto:   { L0: 238.928524, L1:    145.2078800, a: 39.48168677, e0: 0.24880766, e1:  6.465e-6,  i0: 17.141750, W0: 110.30347, W1: -0.01294, P0: 224.06676, P1:-0.04069 },
}

interface Vec3 { x: number; y: number; z: number }

/** Heliocentric ecliptic rectangular coordinates (AU) for a named body. */
function helioXYZ(T: number, name: string): Vec3 {
  const el = ORBITAL_ELEMENTS[name]
  const L  = mod360(el.L0 + el.L1 * T) * RAD
  const e  = el.e0 + el.e1 * T
  const i  = el.i0 * RAD
  const W  = mod360(el.W0 + el.W1 * T) * RAD // Ω ascending node
  const P  = mod360(el.P0 + el.P1 * T) * RAD // ϖ longitude of perihelion

  const E  = solveKepler(L - P, e)
  const v  = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2),
                             Math.sqrt(1 - e) * Math.cos(E / 2))
  const r  = el.a * (1 - e * Math.cos(E))
  const u  = v + P - W // argument of latitude in orbital plane

  const cW = Math.cos(W), sW = Math.sin(W)
  const cU = Math.cos(u), sU = Math.sin(u)
  const cI = Math.cos(i)

  return {
    x: r * (cW * cU - sW * sU * cI),
    y: r * (sW * cU + cW * sU * cI),
    z: r * sU * Math.sin(i),
  }
}

/** Geocentric ecliptic longitude (degrees) for a planet, via helio → geo. */
function planetLongitude(T: number, name: string): number {
  const e = helioXYZ(T, 'Earth')
  const p = helioXYZ(T, name)
  return mod360(Math.atan2(p.y - e.y, p.x - e.x) * DEG)
}

/* ═══════════════════════════════════════════════════════════════════════════
   ALL BODY ECLIPTIC LONGITUDES at Julian Day jd
   ═══════════════════════════════════════════════════════════════════════════ */

function allLongitudes(jd: number): Record<string, number> {
  const T  = (jd - 2451545.0) / 36525.0
  const sun = sunApparentLongitude(T)
  const nn  = trueNode(T)
  return {
    Sun:      sun,
    Earth:    mod360(sun + 180),
    Moon:     moonLongitude(T),
    'N.Node': nn,
    'S.Node': mod360(nn + 180),
    Mercury:  planetLongitude(T, 'Mercury'),
    Venus:    planetLongitude(T, 'Venus'),
    Mars:     planetLongitude(T, 'Mars'),
    Jupiter:  planetLongitude(T, 'Jupiter'),
    Saturn:   planetLongitude(T, 'Saturn'),
    Uranus:   planetLongitude(T, 'Uranus'),
    Neptune:  planetLongitude(T, 'Neptune'),
    Pluto:    planetLongitude(T, 'Pluto'),
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   HUMAN DESIGN — GATE & LINE from ecliptic degree
   ═══════════════════════════════════════════════════════════════════════════ */

const GATE_SEQUENCE = [
  25, 17, 21, 51, 42,  3,  // Aries
  27, 24,  2, 23,  8, 20,  // Taurus
  16, 35, 45, 12, 15, 52,  // Gemini
  39, 53, 62, 56, 31, 33,  // Cancer
   7,  4, 29, 59, 40, 64,  // Leo
  47,  6, 46, 18, 48, 57,  // Virgo/Libra
  32, 50, 28, 44,  1, 43,  // Libra/Scorpio
  14, 34,  9,  5, 26, 11,  // Scorpio/Sag
  10, 58, 38, 54, 61, 60,  // Capricorn
  41, 19, 13, 49, 30, 55,  // Aquarius
  37, 63, 22, 36,           // Pisces
]

const HD_START_DEGREE = 358.25 // 28°15' Pisces

export function degreeToGateLine(degree: number): { gate: number; line: number } {
  const GATE_SIZE = 360 / 64
  const LINE_SIZE = GATE_SIZE / 6
  const adjusted  = mod360(degree - HD_START_DEGREE)
  const index     = Math.floor(adjusted / GATE_SIZE)
  const line      = Math.floor((adjusted % GATE_SIZE) / LINE_SIZE) + 1
  return { gate: GATE_SEQUENCE[index], line }
}

/** Get gate/line for every body at a given Julian Day. */
function getPlanetPositions(jd: number): Record<string, GateLine> {
  const lons = allLongitudes(jd)
  const out: Record<string, GateLine> = {}
  for (const [name, deg] of Object.entries(lons)) {
    const { gate, line } = degreeToGateLine(deg)
    out[name] = { degree: deg, gate, line }
  }
  return out
}

/* ═══════════════════════════════════════════════════════════════════════════
   HUMAN DESIGN — CENTERS, CHANNELS, TYPE, AUTHORITY
   ═══════════════════════════════════════════════════════════════════════════ */

const CENTERS: Record<string, number[]> = {
  Head:           [61, 63, 64],
  Ajna:           [4, 11, 17, 24, 43, 47],
  Throat:         [8, 12, 16, 20, 23, 31, 33, 35, 45, 56, 62],
  Self:           [1, 2, 7, 10, 13, 15, 25, 46],
  Sacral:         [3, 5, 9, 14, 27, 29, 34, 42, 59],
  Root:           [19, 28, 38, 39, 41, 52, 53, 54, 58, 60],
  Spleen:         [18, 28, 32, 44, 48, 50, 57],
  'Solar Plexus': [6, 22, 30, 36, 37, 49, 55],
  Heart:          [21, 26, 40, 51],
}

// [gate1, gate2] — always gate1 < gate2 to match CHANNEL_CENTERS keys
const CHANNELS: [number, number][] = [
  [1, 8], [2, 14], [3, 60], [4, 63], [5, 15],
  [6, 59], [7, 31], [9, 52], [10, 20], [11, 56],
  [12, 22], [13, 33], [16, 48], [17, 62], [18, 58],
  [19, 49], [20, 34], [20, 57], [21, 45], [23, 43],
  [24, 61], [25, 51], [26, 44], [27, 50], [28, 38],
  [29, 46], [30, 41], [32, 54], [34, 57], [35, 36],
  [37, 40], [39, 55], [42, 53], [47, 64],
]

const CHANNEL_CENTERS = new Map<string, [string, string]>([
  ['1,8',   ['Self', 'Throat']],         ['2,14',  ['Self', 'Sacral']],
  ['3,60',  ['Sacral', 'Root']],         ['4,63',  ['Ajna', 'Head']],
  ['5,15',  ['Sacral', 'Self']],         ['6,59',  ['Solar Plexus', 'Sacral']],
  ['7,31',  ['Self', 'Throat']],         ['9,52',  ['Sacral', 'Root']],
  ['10,20', ['Self', 'Throat']],         ['11,56', ['Ajna', 'Throat']],
  ['12,22', ['Throat', 'Solar Plexus']], ['13,33', ['Self', 'Throat']],
  ['16,48', ['Throat', 'Spleen']],       ['17,62', ['Ajna', 'Throat']],
  ['18,58', ['Spleen', 'Root']],         ['19,49', ['Root', 'Solar Plexus']],
  ['20,34', ['Throat', 'Sacral']],       ['20,57', ['Throat', 'Spleen']],
  ['21,45', ['Heart', 'Throat']],        ['23,43', ['Throat', 'Ajna']],
  ['24,61', ['Ajna', 'Head']],           ['25,51', ['Self', 'Heart']],
  ['26,44', ['Heart', 'Spleen']],        ['27,50', ['Sacral', 'Spleen']],
  ['28,38', ['Spleen', 'Root']],         ['29,46', ['Sacral', 'Self']],
  ['30,41', ['Solar Plexus', 'Root']],   ['32,54', ['Spleen', 'Root']],
  ['34,57', ['Sacral', 'Spleen']],       ['35,36', ['Throat', 'Solar Plexus']],
  ['37,40', ['Solar Plexus', 'Heart']], ['39,55', ['Root', 'Solar Plexus']],
  ['42,53', ['Sacral', 'Root']],         ['47,64', ['Ajna', 'Head']],
])

function getDefinedCenters(allGates: Set<number>): Set<string> {
  const defined = new Set<string>()
  for (const [g1, g2] of CHANNELS) {
    if (allGates.has(g1) && allGates.has(g2)) {
      const pair = CHANNEL_CENTERS.get(`${g1},${g2}`)
      if (pair) { defined.add(pair[0]); defined.add(pair[1]) }
    }
  }
  return defined
}

function determineType(definedCenters: Set<string>, allGates: Set<number>): string {
  if (definedCenters.size === 0) return 'Reflector'

  const hasSacral = definedCenters.has('Sacral')
  const hasThroat = definedCenters.has('Throat')

  if (!hasThroat) return hasSacral ? 'Generator' : 'Projector'

  // BFS from Throat: does any motor center connect to it?
  const MOTORS = new Set(['Sacral', 'Heart', 'Solar Plexus', 'Root'])
  const graph: Record<string, Set<string>> = {}
  for (const center of Object.keys(CENTERS)) graph[center] = new Set()
  for (const [g1, g2] of CHANNELS) {
    if (allGates.has(g1) && allGates.has(g2)) {
      const pair = CHANNEL_CENTERS.get(`${g1},${g2}`)
      if (pair) { graph[pair[0]].add(pair[1]); graph[pair[1]].add(pair[0]) }
    }
  }

  const visited = new Set<string>()
  const queue   = ['Throat']
  let motorToThroat = false
  while (queue.length) {
    const cur = queue.shift()!
    if (visited.has(cur)) continue
    visited.add(cur)
    if (MOTORS.has(cur)) { motorToThroat = true; break }
    graph[cur].forEach(n => { if (!visited.has(n)) queue.push(n) })
  }

  if (hasSacral && motorToThroat) return 'Manifesting Generator'
  if (hasSacral)                  return 'Generator'
  if (motorToThroat)              return 'Manifestor'
  return 'Projector'
}

function determineAuthority(definedCenters: Set<string>): string {
  for (const [center, name] of [
    ['Solar Plexus', 'Emotional'],
    ['Sacral',       'Sacral'],
    ['Spleen',       'Splenic'],
    ['Heart',        'Ego'],
    ['Self',         'Self-Projected'],
  ] as [string, string][]) {
    if (definedCenters.has(center)) return name
  }
  return 'Mental/Outer'
}

/* ═══════════════════════════════════════════════════════════════════════════
   CALCULATE CHART
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Calculate a Human Design chart.
 *
 * @param birthYear
 * @param birthMonth   1–12
 * @param birthDay
 * @param birthHour    local 24-hour clock
 * @param birthMinute
 * @param utcOffset    hours east of UTC (e.g. -7 for MST, +5.5 for IST)
 */
export function calculateChart(
  birthYear: number, birthMonth: number, birthDay: number,
  birthHour: number, birthMinute: number, utcOffset: number,
): ChartResult {
  const utcHour       = birthHour - utcOffset + birthMinute / 60
  const jdPersonality = julianDay(birthYear, birthMonth, birthDay, utcHour)

  // Design moment: find JD where Sun is exactly 88° behind personality Sun
  const pSunDeg   = sunApparentLongitude((jdPersonality - 2451545.0) / 36525.0)
  const targetDeg = mod360(pSunDeg - 88)
  let jdLow    = jdPersonality - 100
  let jdHigh   = jdPersonality - 80
  let jdDesign = (jdLow + jdHigh) / 2

  for (let i = 0; i < 50; i++) {
    const mid    = (jdLow + jdHigh) / 2
    const sunDeg = sunApparentLongitude((mid - 2451545.0) / 36525.0)
    const diff   = ((sunDeg - targetDeg + 180) % 360 + 360) % 360 - 180
    jdDesign = mid
    if (Math.abs(diff) < 0.0001) break
    if (diff > 0) jdHigh = mid; else jdLow = mid
  }

  const personality = getPlanetPositions(jdPersonality)
  const design      = getPlanetPositions(jdDesign)

  const allGates = new Set([
    ...Object.values(personality).map(p => p.gate),
    ...Object.values(design).map(p => p.gate),
  ])

  const definedCenters = getDefinedCenters(allGates)

  return {
    type:              determineType(definedCenters, allGates),
    profile:           `${personality.Sun.line}/${design.Sun.line}`,
    authority:         determineAuthority(definedCenters),
    defined_centers:   [...definedCenters].sort(),
    undefined_centers: Object.keys(CENTERS).filter(c => !definedCenters.has(c)).sort(),
    personality,
    design,
    all_active_gates:  [...allGates].sort((a, b) => a - b),
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   GEOCODING  (async, network — optional)
   City string → historical UTC offset using Nominatim + Intl timezone API.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Resolve a city string to the UTC offset that was in effect at the given
 * birth date/time (DST-aware).
 *
 * @param city   - e.g. "Boise, Idaho" or "Paris, France"
 * @returns UTC offset in hours (e.g. -6, +5.5)
 */
export async function getHistoricalOffset(
  city: string,
  year: number, month: number, day: number,
  hour: number, minute: number,
): Promise<number> {
  // 1. Geocode city → lat/lon via Nominatim (OpenStreetMap)
  const geoURL = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`
  const geoRes  = await fetch(geoURL, { headers: { 'User-Agent': 'human-design-chart-js/1.0' } })
  const geoData = await geoRes.json() as { lat: string; lon: string; display_name: string }[]
  if (!geoData.length)
    throw new Error(`Could not locate "${city}". Try adding the state or country.`)

  const { lat, lon } = geoData[0]

  // 2. Resolve IANA timezone name for those coordinates via timeapi.io (free, no key)
  const tzURL  = `https://timeapi.io/api/TimeZone/coordinate?latitude=${lat}&longitude=${lon}`
  const tzRes  = await fetch(tzURL)
  const tzData = await tzRes.json() as { timeZone?: string }
  const tzName = tzData.timeZone
  if (!tzName) throw new Error('Could not determine timezone for those coordinates.')

  // 3. Compute the UTC offset at that specific historical moment using the Intl API.
  //    The Intl API carries the full IANA tzdata including historical DST rules.
  return _intlOffset(tzName, year, month, day, hour, minute)
}

/**
 * Use Intl.DateTimeFormat to find the UTC offset in effect for a given
 * local date/time in an IANA timezone. Two-step to handle DST correctly.
 */
function _intlOffset(
  tzName: string,
  year: number, month: number, day: number,
  hour: number, minute: number,
): number {
  const fmt = (utcMs: number): number => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tzName,
      timeZoneName: 'longOffset',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date(utcMs))
    const tz = parts.find(p => p.type === 'timeZoneName')?.value ?? 'GMT+0'
    const m  = tz.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/)
    return m ? (m[1] === '+' ? 1 : -1) * (parseInt(m[2]) + parseInt(m[3] ?? '0') / 60) : 0
  }

  // Step 1: treat local time as UTC to get an approximate offset
  const approxUTC = Date.UTC(year, month - 1, day, hour, minute)
  const approxOff = fmt(approxUTC)

  // Step 2: correct the UTC timestamp using that offset, then re-read
  const refinedUTC = Date.UTC(year, month - 1, day, hour, minute) - approxOff * 3_600_000
  return fmt(refinedUTC)
}

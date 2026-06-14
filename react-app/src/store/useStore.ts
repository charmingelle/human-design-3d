import { create } from 'zustand'

export type PlanetEntry = { gate: number; line: number; degree: number }
export type PlanetMap   = Record<string, PlanetEntry>

// chart center names → bodygraph mesh IDs
const CENTER_NAME_TO_ID: Record<string, string> = {
  'Head':         'head',
  'Ajna':         'ajna',
  'Throat':       'throat',
  'Self':         'g',
  'Sacral':       'sacral',
  'Root':         'root',
  'Spleen':       'spleen',
  'Solar Plexus': 'solar',
  'Heart':        'heart',
}

interface State {
  // ── Bodygraph controls ───────────────────────────────────
  autoSpin: boolean
  toggleAutoSpin: () => void
  speed: number
  setSpeed: (v: number) => void

  // ── Reset token (increment triggers rotation + camera reset) ─
  resetToken: number
  triggerReset: () => void

  // ── Tooltip ──────────────────────────────────────────────
  tooltip: { title: string; lines?: string[]; x: number; y: number; mode?: 'cursor' | 'above-center' } | null
  showTooltip: (title: string, x: number, y: number, lines?: string[], mode?: 'cursor' | 'above-center') => void
  hideTooltip: () => void

  // ── Chart result ─────────────────────────────────────────
  // null = no chart loaded (use neutral 0.5 opacity for all objects)
  chartActiveGates:      ReadonlySet<number> | null
  chartDefinedCenterIds: ReadonlySet<string> | null
  chartPersonalityGates: ReadonlySet<number> | null
  chartDesignGates:      ReadonlySet<number> | null
  chartPlanetsPersonality: PlanetMap | null   // Conscious
  chartPlanetsDesign:      PlanetMap | null   // Unconscious
  chartType:      string | null
  chartProfile:   string | null
  chartAuthority: string | null
  clearChartResult: () => void
  setChartResult: (result: {
    all_active_gates: number[]
    defined_centers:  string[]
    personality:      PlanetMap
    design:           PlanetMap
    type:             string
    profile:          string
    authority:        string
  }) => void
}

export const useStore = create<State>((set) => ({
  autoSpin: true,
  toggleAutoSpin: () => set((s) => ({ autoSpin: !s.autoSpin })),
  speed: 0.5,
  setSpeed: (speed) => set({ speed }),

  resetToken: 0,
  triggerReset: () =>
    set((s) => ({
      resetToken: s.resetToken + 1,
      autoSpin: false,
      speed: 0.5,
    })),

  tooltip: null,
  showTooltip: (title, x, y, lines, mode) => set({ tooltip: { title, lines, x, y, mode } }),
  hideTooltip: () => set({ tooltip: null }),

  chartActiveGates:        null,
  chartDefinedCenterIds:   null,
  chartPersonalityGates:   null,
  chartDesignGates:        null,
  chartPlanetsPersonality: null,
  chartPlanetsDesign:      null,
  chartType:               null,
  chartProfile:            null,
  chartAuthority:          null,
  clearChartResult: () => set({
    chartActiveGates:        null,
    chartDefinedCenterIds:   null,
    chartPersonalityGates:   null,
    chartDesignGates:        null,
    chartPlanetsPersonality: null,
    chartPlanetsDesign:      null,
    chartType:               null,
    chartProfile:            null,
    chartAuthority:          null,
  }),
  setChartResult: ({ all_active_gates, defined_centers, personality, design, type, profile, authority }) =>
    set({
      chartActiveGates:        new Set(all_active_gates),
      chartDefinedCenterIds:   new Set(
        defined_centers.map((n) => CENTER_NAME_TO_ID[n]).filter(Boolean),
      ),
      chartPersonalityGates:   new Set(Object.values(personality).map((gl) => gl.gate)),
      chartDesignGates:        new Set(Object.values(design).map((gl) => gl.gate)),
      chartPlanetsPersonality: personality,
      chartPlanetsDesign:      design,
      chartType:               type,
      chartProfile:            profile,
      chartAuthority:          authority,
    }),
}))

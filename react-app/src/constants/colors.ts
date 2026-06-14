// ─────────────────────────────────────────────────────────────────────────────
// Design-system color constants for the 3D bodygraph viewer.
// Import from this file everywhere — never hardcode colors in components.
// ─────────────────────────────────────────────────────────────────────────────

// ── Viewport ──────────────────────────────────────────────────────────────────
/** Background color of the 3D canvas area. */
export const BG_COLOR = '#000000'

// ── Shared base ───────────────────────────────────────────────────────────────
/** Default teal used for unactivated channels and undefined energy centers. */
export const COLOR_TEAL = '#ffffff'

// ── Energy center colors (one per center) ─────────────────────────────────────
export const CENTER_COLOR_HEAD   = '#f128d9'   // violet
export const CENTER_COLOR_AJNA   = '#4947f9'   // dark blue
export const CENTER_COLOR_THROAT = '#0dcbfe'   // blue
export const CENTER_COLOR_G      = '#08ff7b'   // green
export const CENTER_COLOR_HEART  = '#8df70d'   // green
export const CENTER_COLOR_SACRAL = '#ff6101'   // orange
export const CENTER_COLOR_ROOT   = '#fb0b34'   // red
export const CENTER_COLOR_SPLEEN = '#fcc60d'   // yellow
export const CENTER_COLOR_SOLAR  = '#faf20a'   // yellow

// ── Energy center opacity ─────────────────────────────────────────────────────
/** No chart loaded — neutral appearance. */
export const OPACITY_CENTER_NEUTRAL = 0.5
/** Chart loaded and this center is defined. */
export const OPACITY_CENTER_DEFINED = 0.5
/** Chart loaded but this center is undefined — uses COLOR_TEAL at NEUTRAL. */
export const OPACITY_CENTER_UNDEFINED = 0.5

// ── Gate colors & opacity ─────────────────────────────────────────────────────
/** Active gate in the loaded chart. */
export const GATE_COLOR_ACTIVE   = '#9b59b6'   // purple
export const GATE_OPACITY_ACTIVE = 0.9

/** Inactive gate in the loaded chart. */
export const GATE_COLOR_INACTIVE   = '#ffffff'
export const GATE_OPACITY_INACTIVE = 0.35

/** No chart loaded — neutral gate appearance. */
export const GATE_COLOR_NEUTRAL   = '#ffffff'
export const GATE_OPACITY_NEUTRAL = 0.5

// ── Channel colors & opacity ──────────────────────────────────────────────────
/** Half of a channel whose adjacent gate is a personality (conscious) gate. */
export const CHANNEL_COLOR_PERSONALITY = '#707070'   // dark grey

/** Half of a channel whose adjacent gate is a design (unconscious) gate. */
export const CHANNEL_COLOR_DESIGN = '#cc0000'        // red

/** Channel half with no chart loaded or gate not in personality/design. */
export const CHANNEL_COLOR_DEFAULT   = COLOR_TEAL
export const CHANNEL_OPACITY_DEFAULT = 0.5

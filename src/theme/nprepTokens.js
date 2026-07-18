// NPrep design tokens — single source of truth for the My Doubts section.
//
// Every hex here was pixel-sampled from the official NPrep homepage
// collaterals ("Free User" / "Paid User Homepage"), not guessed. If the
// production app's palette changes, update this file only — components
// import from here and never hard-code brand values.

// ── Brand / action ───────────────────────────────────────────────────────────
export const BLUE = '#008DFF'        // primary action: CTAs, links, active tab, selection
export const BLUE_TILE = '#F1F4FF'   // icon tiles, soft info panels
export const NAVY = '#131B63'        // emphasis: stat numbers, letter chips, avatars

// ── Text ─────────────────────────────────────────────────────────────────────
export const INK = '#16181D'         // titles and primary text (near-black, as in app)
export const BODY = '#62677D'        // secondary body text
export const LABEL = '#888CB0'       // blue-grey labels ("Exam Readiness" style)
export const GREY = '#7F7F8A'        // meta text ("20min • 28 lessons" style)

// ── Surfaces ─────────────────────────────────────────────────────────────────
export const PAGE_BG = '#F3F9FF'     // page ground behind white cards
export const BORDER = '#E7EAF2'      // hairline card/list borders

// ── Semantic status (dot + text, never loud pills) ───────────────────────────
export const GREEN = '#189A57'
export const GREEN_BG = '#E9F8F0'
export const GREEN_BORDER = '#BDE8D2'
export const ORANGE = '#C98A1B'
export const ORANGE_BG = '#FDF4E3'
export const RED = '#E5484D'
export const RED_BG = '#FDECED'
export const RED_BORDER = '#F5C6C8'

// ── Type / shape (reference for implementers) ────────────────────────────────
// Font: Poppins, weights 400 / 500 / 600 / 700 only (no 800+ anywhere in-app).
// Scale: 17/700 screen titles · 14/700 card headers · 13.5/600 card titles ·
//        13 body · 11.5–11 meta · 15/600 buttons.
// Radii: 14 cards · 12 tiles/panels · 24 (pill) CTAs · 50% circular controls.
// Headers are white with 1px BORDER bottom — never gradients.

// ── Legacy aliases (existing components reference these short names) ─────────
export const P = NAVY
export const PL = BLUE_TILE
export const PB = BLUE
export const PD = NAVY
export const T1 = INK
export const T2 = BODY
export const T3 = LABEL
export const BD = BORDER
export const BG2 = PAGE_BG
export const EXPERT = NAVY
export const CALLED = BLUE

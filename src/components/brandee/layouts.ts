import type { BrandeeState } from "@/types";

/**
 * Per-asset layout values used to position Brandee on top of the desk.
 *
 *   bodyBottomY  — Y coordinate (in playground stage pixels at width=420)
 *                  where Brandee's body-bottom edge should sit. The wrapper
 *                  scales this proportionally for any rendered size.
 *   bodyX        — Horizontal offset from stage center, same coord system.
 *   behindBase   — When true, the desk renders ABOVE Brandee (her arms etc.
 *                  are hidden behind the desk surface). When false, Brandee
 *                  is on top of the desk.
 *
 * All values are tuned in the playground (`/playground`), then copied here.
 * The reference width is the playground stage width: 420 pixels. The
 * `<BrandeeWithDesk>` wrapper scales these values to whatever size the
 * caller is rendering.
 */
export interface AssetLayout {
  bodyBottomY: number;
  bodyX: number;
  behindBase: boolean;
}

/** Reference stage width these values were tuned at (the playground). */
export const LAYOUT_REFERENCE_WIDTH = 420;

/** Default applied to any state/frame that hasn't been tuned yet. */
export const DEFAULT_LAYOUT: AssetLayout = {
  bodyBottomY: 420,
  bodyX: 0,
  behindBase: false,
};

/* ──────────────────────────────────────────────────────────────────────────
 * Per-state layouts
 * Tune in the playground → copy → replace the block below.
 * ────────────────────────────────────────────────────────────────────────── */
export const STATE_LAYOUTS: Record<BrandeeState, AssetLayout> = {
  greeting: { bodyBottomY: 430, bodyX: 3, behindBase: false },
  idle: { bodyBottomY: 436, bodyX: 0, behindBase: true },
  bored: { bodyBottomY: 444, bodyX: -7, behindBase: false },
  sleeping: { bodyBottomY: 443, bodyX: -31, behindBase: false },
  listening: { bodyBottomY: 431, bodyX: 0, behindBase: false },
  thinking: { bodyBottomY: 443, bodyX: 0, behindBase: false },
  speaking: { bodyBottomY: 422, bodyX: 3, behindBase: false },
  celebrating: { bodyBottomY: 454, bodyX: -7, behindBase: true },
  confused: { bodyBottomY: 433, bodyX: 1, behindBase: false },
};

/* ──────────────────────────────────────────────────────────────────────────
 * Per-transition-frame layouts
 * Keys are the asset filenames. Same shape as state layouts.
 * ────────────────────────────────────────────────────────────────────────── */
export const FRAME_LAYOUTS: Record<string, AssetLayout> = {
  "idle-to-listening.png": { bodyBottomY: 426, bodyX: 0, behindBase: false },
  "listening-to-thinking.png": {
    bodyBottomY: 420,
    bodyX: 0,
    behindBase: false,
  },
  "thinking-to-speaking.png": { bodyBottomY: 420, bodyX: 0, behindBase: false },
  "thinking-to-celebrating.png": {
    bodyBottomY: 453,
    bodyX: 0,
    behindBase: true,
  },
  "idle-to-bored.png": { bodyBottomY: 428, bodyX: -7, behindBase: true },
  "bored-to-sleeping.png": { bodyBottomY: 430, bodyX: -7, behindBase: false },
  "bored-to-listening.png": { bodyBottomY: 435, bodyX: -26, behindBase: false },
  "waking-up.png": { bodyBottomY: 443, bodyX: 0, behindBase: false },
};

/**
 * Resolves the active layout for a given state + optional transition frame.
 * If a transition frame is in flight and has a tuned layout, that wins;
 * otherwise we fall back to the state's layout. Always returns a layout
 * (defaults if no tuned value exists).
 */
export function resolveLayout(
  state: BrandeeState,
  transitionFrame: string | null = null,
): AssetLayout {
  if (transitionFrame && FRAME_LAYOUTS[transitionFrame]) {
    return FRAME_LAYOUTS[transitionFrame];
  }
  return STATE_LAYOUTS[state] ?? DEFAULT_LAYOUT;
}

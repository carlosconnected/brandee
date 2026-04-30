import type { BrandeeState } from "@/types";

/**
 * A single frame entry inside a state. `hold` is how long this frame is shown
 * before advancing to the next one in the array (looping). For single-frame
 * states the hold is irrelevant — it's still required for type uniformity.
 */
export interface FrameEntry {
  frame: string;
  hold: number;
}

/**
 * Each Brandee state maps to one or more frames that loop in order.
 *
 *   - Single-frame states (e.g. `bored`, `thinking`) are just a 1-element array.
 *   - `greeting` alternates between two waving frames at 250ms each.
 *   - `idle` shows the eyes-open frame for 5.5s, then the eyes-closed frame for
 *     0.5s — a natural-looking blink every 6 seconds.
 */
export const STATE_TO_FRAMES: Record<BrandeeState, FrameEntry[]> = {
  greeting: [
    { frame: "greeting-1.png", hold: 250 },
    { frame: "greeting-2.png", hold: 250 },
  ],
  idle: [
    { frame: "idle-1.png", hold: 4500 },
    { frame: "idle-2.png", hold: 500 },
  ],
  bored: [{ frame: "bored.png", hold: 0 }],
  sleeping: [{ frame: "sleeping.png", hold: 0 }],
  listening: [{ frame: "listening.png", hold: 0 }],
  thinking: [{ frame: "thinking.png", hold: 0 }],
  speaking: [{ frame: "speaking.png", hold: 0 }],
  celebrating: [
    { frame: "celebrating-1.png", hold: 300 },
    { frame: "celebrating-2.png", hold: 300 },
  ],
  confused: [{ frame: "confused.png", hold: 0 }],
};

/**
 * Single-frame transitions between states. The intermediate pose is held for
 * TIMINGS.singleTransitionHold ms, then we cross-fade into the new state.
 * Keys are `${from}->${to}`.
 */
export const TRANSITIONS: Record<string, string> = {
  "idle->listening": "idle-to-listening.png",
  "listening->idle": "idle-to-listening.png", // reuse the same intermediate pose
  "listening->thinking": "listening-to-thinking.png",
  "thinking->speaking": "thinking-to-speaking.png",
  "idle->bored": "idle-to-bored.png",
  "bored->sleeping": "bored-to-sleeping.png",
  "bored->listening": "bored-to-listening.png",
};

/**
 * Multi-frame transition sequences for cinematic moments — each frame is held
 * for its `hold` ms before the next, and the final state is set after the
 * last frame finishes.
 */
export const TRANSITION_SEQUENCES: Record<
  string,
  { frame: string; hold: number }[]
> = {
  "sleeping->listening": [
    { frame: "waking-up.png", hold: 400 },
    { frame: "bored-to-listening.png", hold: 250 },
  ],
};

export function getFrames(state: BrandeeState): FrameEntry[] {
  return STATE_TO_FRAMES[state];
}

/** All frames + transition frames + sequence frames, deduped — used for image preloading. */
export function getAllImagePaths(): string[] {
  const stateFrames = Object.values(STATE_TO_FRAMES)
    .flat()
    .map((f) => f.frame);
  const single = Object.values(TRANSITIONS);
  const seq = Object.values(TRANSITION_SEQUENCES)
    .flat()
    .map((s) => s.frame);
  return Array.from(new Set([...stateFrames, ...single, ...seq]));
}

export const BRANDEE_IMAGE_PREFIX = "/brandee";

export function frameUrl(frame: string): string {
  return `${BRANDEE_IMAGE_PREFIX}/${frame}`;
}

export const TIMINGS = {
  greetingDuration: 3000,
  idleToBored: 45_000,
  boredToSleeping: 45_000, // 45s after entering bored = 90s total
  microBehaviorMin: 8000,
  microBehaviorMax: 15_000,
  celebratingDuration: 3000,
  confusedDuration: 3000,
  speakingMinDuration: 2000,
  singleTransitionHold: 200,
  crossFadeDuration: 180,
  listeningInactivity: 2000,
} as const;

// Image-based blink replaces the CSS scaleY blink for idle, so it's
// removed from the micro-behavior list to avoid double-blinking.
export type MicroBehavior =
  | "lookLeft"
  | "lookRight"
  | "tinyBounce"
  | "tilt"
  | "wiggle";

export const MICRO_BEHAVIORS: { name: MicroBehavior; duration: number }[] = [
  { name: "lookLeft", duration: 1500 },
  { name: "lookRight", duration: 1500 },
  { name: "tinyBounce", duration: 600 },
  { name: "tilt", duration: 2000 },
  { name: "wiggle", duration: 400 },
];

/** States during which Brandee is at rest (gets the breathe/float layer). */
export const RESTING_STATES: ReadonlySet<BrandeeState> = new Set<BrandeeState>([
  "idle",
  "bored",
  "sleeping",
]);

export function transitionKey(from: BrandeeState, to: BrandeeState): string {
  return `${from}->${to}`;
}

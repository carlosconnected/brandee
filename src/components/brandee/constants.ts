import type { BrandeeState } from '@/types';

/**
 * Each Brandee state maps to an array of frames. Single-frame states use a 1-element array.
 * The greeting state has 2 frames that alternate every TIMINGS.greetingFrameSwap ms.
 */
export const STATE_TO_FRAMES: Record<BrandeeState, string[]> = {
  greeting:    ['greeting-1.png', 'greeting-2.png'],
  idle:        ['idle.png'],
  bored:       ['bored.png'],
  sleeping:    ['sleeping.png'],
  listening:   ['listening.png'],
  thinking:    ['thinking.png'],
  speaking:    ['speaking.png'],
  celebrating: ['celebrating.png'],
  confused:    ['confused.png'],
};

/**
 * Single-frame transitions between states. The intermediate pose is held for
 * TIMINGS.singleTransitionHold ms, then we cross-fade into the new state.
 * Keys are `${from}->${to}`.
 */
export const TRANSITIONS: Record<string, string> = {
  'idle->listening':      'idle-to-listening.png',
  'listening->idle':      'idle-to-listening.png', // reuse the same intermediate pose
  'listening->thinking':  'listening-to-thinking.png',
  'thinking->speaking':   'thinking-to-speaking.png',
  'idle->bored':          'idle-to-bored.png',
  'bored->sleeping':      'bored-to-sleeping.png',
  'bored->listening':     'bored-to-listening.png',
};

/**
 * Multi-frame transition sequences for cinematic moments — each frame is held
 * for its `hold` ms before the next, and the final state is set after the
 * last frame finishes.
 */
export const TRANSITION_SEQUENCES: Record<string, { frame: string; hold: number }[]> = {
  'sleeping->listening': [
    { frame: 'waking-up.png',           hold: 400 },
    { frame: 'bored-to-listening.png',  hold: 250 },
  ],
};

export function getFrames(state: BrandeeState): string[] {
  return STATE_TO_FRAMES[state];
}

/** All frames + transition frames + sequence frames, deduped — used for image preloading. */
export function getAllImagePaths(): string[] {
  const stateFrames = Object.values(STATE_TO_FRAMES).flat();
  const single      = Object.values(TRANSITIONS);
  const seq         = Object.values(TRANSITION_SEQUENCES).flat().map((s) => s.frame);
  return Array.from(new Set([...stateFrames, ...single, ...seq]));
}

export const BRANDEE_IMAGE_PREFIX = '/brandee';

export function frameUrl(frame: string): string {
  return `${BRANDEE_IMAGE_PREFIX}/${frame}`;
}

export const TIMINGS = {
  greetingDuration:      3000,
  greetingFrameSwap:     250,
  idleToBored:           45_000,
  boredToSleeping:       45_000, // 45s after entering bored = 90s total
  microBehaviorMin:      8000,
  microBehaviorMax:      15_000,
  celebratingDuration:   3000,
  confusedDuration:      3000,
  speakingMinDuration:   2000,
  singleTransitionHold:  200,
  crossFadeDuration:     180,
  listeningInactivity:   2000,
} as const;

export type MicroBehavior =
  | 'blink'
  | 'lookLeft'
  | 'lookRight'
  | 'tinyBounce'
  | 'tilt'
  | 'wiggle';

export const MICRO_BEHAVIORS: { name: MicroBehavior; duration: number }[] = [
  { name: 'blink',      duration: 200 },
  { name: 'lookLeft',   duration: 1500 },
  { name: 'lookRight',  duration: 1500 },
  { name: 'tinyBounce', duration: 600 },
  { name: 'tilt',       duration: 2000 },
  { name: 'wiggle',     duration: 400 },
];

/** States during which Brandee is at rest (gets the breathe/float layer). */
export const RESTING_STATES: ReadonlySet<BrandeeState> = new Set<BrandeeState>([
  'idle',
  'bored',
  'sleeping',
]);

export function transitionKey(from: BrandeeState, to: BrandeeState): string {
  return `${from}->${to}`;
}

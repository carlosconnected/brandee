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

export function getFrames(state: BrandeeState): string[] {
  return STATE_TO_FRAMES[state];
}

/** All frames flattened — used for image preloading on mount. */
export function getAllImagePaths(): string[] {
  return Object.values(STATE_TO_FRAMES).flat();
}

export const BRANDEE_IMAGE_PREFIX = '/brandee';

/** Resolve a frame filename to a public URL. */
export function frameUrl(frame: string): string {
  return `${BRANDEE_IMAGE_PREFIX}/${frame}`;
}

export const TIMINGS = {
  greetingDuration:     3000,
  greetingFrameSwap:    250,
  idleToBored:          45_000,
  boredToSleeping:      45_000, // bored → sleeping (45s after entering bored = 90s total)
  microBehaviorMin:     8000,
  microBehaviorMax:     15_000,
  celebratingDuration:  3000,
  confusedDuration:     3000,
  speakingMinDuration:  2000,
  wakeUpBounceDuration: 300,
  listeningInactivity:  2000, // input has content but no keystrokes for 2s → idle
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

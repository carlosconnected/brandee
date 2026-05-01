const STORAGE_KEY        = 'brandee:lastGreeting';
const SPOKEN_STORAGE_KEY  = 'brandee:lastGreetingSpoken';

/** Local-time `YYYY-MM-DD` for "is this still today?" comparisons. */
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Returns true if Brandee hasn't greeted the user yet today.
 * On the server (or when localStorage throws) this returns false so we
 * skip the greeting until the client takes over.
 */
export function shouldGreet(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY) !== todayKey();
  } catch {
    return false;
  }
}

export function markGreetedToday(): void {
  try {
    localStorage.setItem(STORAGE_KEY, todayKey());
  } catch {
    /* ignore */
  }
}

/**
 * Audio greeting is tracked separately from the visible wave so that React
 * Strict Mode's dev double-invoke doesn't fire `speakText` twice. (Visual
 * is already idempotent via the `STORAGE_KEY` gate inside `useBrandeeState`,
 * but the speech hook needs its own latch.)
 */
export function hasSpokenGreetingToday(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(SPOKEN_STORAGE_KEY) === todayKey();
  } catch {
    // Fail closed — better to skip a greeting than to speak it twice.
    return true;
  }
}

export function markGreetingSpokenToday(): void {
  try {
    localStorage.setItem(SPOKEN_STORAGE_KEY, todayKey());
  } catch {
    /* ignore */
  }
}

/** Forget the greeting timestamp — next sign-in will trigger a fresh greeting. */
export function clearGreetingHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SPOKEN_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

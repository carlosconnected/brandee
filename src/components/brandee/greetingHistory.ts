const STORAGE_KEY = 'brandee:lastGreeting';

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

/** Forget the greeting timestamp — next sign-in will trigger a fresh greeting. */
export function clearGreetingHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

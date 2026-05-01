'use client';

/**
 * Thin synchronous wrapper around `speechSynthesis`.
 *
 * `speakText` is intentionally synchronous so that the call to `synth.speak()`
 * stays inside the user-gesture window that authorised it. An async hop (e.g.
 * awaiting `voiceschanged`) can push the actual `speak` past the gesture's
 * lifetime and Chrome will silently block it.
 *
 * Voice selection therefore reads from whatever voices are currently loaded.
 * On the very first call after a fresh page load, voices may not be ready
 * yet and the browser default voice is used. Subsequent calls pick the
 * preferred voice once the cache fills.
 */

const PREFERRED_VOICE_PATTERN =
  /samantha|zira|karen|moira|tessa|allison|susan|google\s*us\s*english|google.*female/i;

export function speechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speakText(text: string, onEnd?: () => void): void {
  if (!speechAvailable()) {
    onEnd?.();
    return;
  }

  const synth     = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(text);

  const voice = pickBestVoice(synth.getVoices());
  if (voice) utterance.voice = voice;
  utterance.lang    = voice?.lang ?? 'en-US';
  utterance.rate    = 1.0;
  utterance.pitch   = 1.05;
  utterance.volume  = 1.0;
  utterance.onend   = () => onEnd?.();
  utterance.onerror = () => onEnd?.();

  // NOTE: deliberately no `synth.cancel()` before speaking. Chrome has a
  // long-standing bug where cancel-immediately-followed-by-speak causes the
  // new utterance to fire `onend` synchronously without playing any audio.
  // Callers that want to preempt prior speech should call `cancelSpeech()`
  // earlier (e.g. on a user gesture, well before the next `speakText`).
  synth.speak(utterance);
}

export function cancelSpeech(): void {
  if (!speechAvailable()) return;
  window.speechSynthesis.cancel();
}

function pickBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const englishVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  return (
    englishVoices.find((v) => PREFERRED_VOICE_PATTERN.test(v.name)) ??
    englishVoices[0] ??
    null
  );
}

// Kick off voice loading as soon as this module is imported so that by the
// time `speakText` runs (a few hundred ms later, after the sign-in render
// settles), `getVoices()` already has results to filter through.
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
}

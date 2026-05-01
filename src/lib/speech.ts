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

/* ────────────────────────────────────────────────────────────────────────── */
/*  Speech recognition (mic in)                                              */
/* ────────────────────────────────────────────────────────────────────────── */

interface RecognitionHandle {
  stop: () => void;
}

interface StartRecognitionOptions {
  /** Fired with the latest transcript. `isFinal` is true on the last segment. */
  onResult: (transcript: string, isFinal: boolean) => void;
  /** Fired once when the recognition session ends (manually or automatically). */
  onEnd?: () => void;
  /** Fired on errors (denied permission, no speech detected, network, etc.). */
  onError?: (errorCode: string) => void;
  lang?: string;
}

export function recognitionAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  );
}

/**
 * Starts a one-shot speech recognition session. Returns a handle whose
 * `stop()` ends recognition early. Returns null if the browser doesn't
 * support it.
 */
export function startRecognition(opts: StartRecognitionOptions): RecognitionHandle | null {
  if (!recognitionAvailable()) return null;

  // SpeechRecognition isn't standardised yet; Chrome/Edge use the webkit prefix.
  const Ctor =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
  if (!Ctor) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognition: any = new Ctor();
  recognition.continuous     = false;        // one phrase per session
  recognition.interimResults = true;         // partial transcripts as user speaks
  recognition.lang           = opts.lang ?? 'en-US';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onresult = (event: any) => {
    const result      = event.results[event.results.length - 1];
    const transcript  = result[0].transcript as string;
    opts.onResult(transcript, Boolean(result.isFinal));
  };

  recognition.onend = () => opts.onEnd?.();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onerror = (e: any) => opts.onError?.(e?.error ?? 'unknown');

  try {
    recognition.start();
  } catch {
    return null;
  }

  return {
    stop: () => {
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
    },
  };
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

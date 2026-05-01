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
  /** Fired with the latest transcript. `isFinal` is true when nothing is interim. */
  onResult: (transcript: string, isFinal: boolean) => void;
  /** Fired once when the recognition session ends (manually or automatically). */
  onEnd?: () => void;
  /** Fired on errors (denied permission, no speech detected, network, etc.). */
  onError?: (errorCode: string) => void;
  lang?: string;
  /**
   * If true, recognition keeps listening across pauses instead of ending after
   * the browser's default silence threshold (~1s). Pair with `silenceTimeout`
   * to define when to auto-stop.
   */
  continuous?: boolean;
  /**
   * Only honoured when `continuous: true`. Auto-stops the recognition session
   * after this many ms with no new speech. Lets users pause naturally
   * mid-sentence without being cut off.
   */
  silenceTimeout?: number;
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
  recognition.continuous     = opts.continuous ?? false;
  recognition.interimResults = true;         // partial transcripts as user speaks
  recognition.lang           = opts.lang ?? 'en-US';

  let silenceTimer: ReturnType<typeof setTimeout> | null = null;

  function clearSilenceTimer() {
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }
  }

  function armSilenceTimer() {
    if (!opts.continuous || !opts.silenceTimeout) return;
    clearSilenceTimer();
    silenceTimer = setTimeout(() => {
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
    }, opts.silenceTimeout);
  }

  // Iterate ALL results (not just the latest) so that in continuous mode we
  // produce the full accumulated transcript on every event. In non-continuous
  // mode there's only one result, so the behaviour is identical to before.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onresult = (event: any) => {
    let combined   = '';
    let hasInterim = false;
    for (let i = 0; i < event.results.length; i++) {
      const result     = event.results[i];
      const transcript = result[0].transcript as string;
      combined += transcript;
      if (!result.isFinal) hasInterim = true;
    }
    opts.onResult(combined.trim(), !hasInterim);
    armSilenceTimer();
  };

  recognition.onstart = () => armSilenceTimer();
  recognition.onend   = () => {
    clearSilenceTimer();
    opts.onEnd?.();
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onerror = (e: any) => {
    clearSilenceTimer();
    opts.onError?.(e?.error ?? 'unknown');
  };

  try {
    recognition.start();
  } catch {
    return null;
  }

  return {
    stop: () => {
      clearSilenceTimer();
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
    },
  };
}

/**
 * Web Speech Recognition strips punctuation — every transcript comes back as
 * a flat string of words. To restore the most-noticeable bit (questions), we
 * check whether the utterance opens with a typical question word and append
 * a "?" if so. Best-effort: it won't catch every question (e.g. "you free
 * tonight?") but handles the common wh-/auxiliary cases cleanly.
 *
 * Idempotent: existing terminal punctuation is left alone.
 */
const QUESTION_STARTERS = new Set([
  // Wh-words
  'who', 'whom', 'whose', 'what', 'when', 'where', 'why', 'which', 'how',
  // Auxiliary verbs that typically front a question
  'is', 'are', 'was', 'were', 'am',
  'do', 'does', 'did',
  'have', 'has', 'had',
  'can', 'could', 'will', 'would', 'should', 'shall', 'may', 'might', 'must',
  // Common contractions — speech recognition emits "what's", "isn't", etc.
  // verbatim, so we list both the bare and contracted forms here. (The check
  // also strips a trailing apostrophe-suffix as a safety net for browsers
  // that drop the apostrophe entirely.)
  "who's", "what's", "when's", "where's", "why's", "how's",
  "isn't", "aren't", "wasn't", "weren't",
  "don't", "doesn't", "didn't",
  "haven't", "hasn't", "hadn't",
  "can't", "couldn't", "won't", "wouldn't", "shouldn't", "shan't",
]);

export function inferQuestionMark(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;
  // Already has terminal punctuation — don't double up.
  if (/[?.!]$/.test(trimmed)) return trimmed;
  const firstWord = trimmed
    .split(/\s+/)[0]!
    .toLowerCase()
    .replace(/[^a-z']/g, '');
  if (QUESTION_STARTERS.has(firstWord)) return `${trimmed}?`;
  // Fallback: drop a contraction suffix ("whats" → still no match, but
  // "wheres" / "hows" might come through without an apostrophe on some
  // browsers). Match on the part before the apostrophe too.
  const stem = firstWord.includes("'") ? firstWord.split("'")[0]! : firstWord;
  return QUESTION_STARTERS.has(stem) ? `${trimmed}?` : trimmed;
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

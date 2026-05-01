'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { MAX_MSG_CHARS } from '@/lib/schema';
import type { BrandeeState } from '@/types';
import { recognitionAvailable, startRecognition } from '@/lib/speech';
import { MicIcon } from '@/components/icons';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  /** `viaVoice` is true when the message was composed (at least partly) via the mic. */
  onSend: (value: string, viaVoice: boolean) => void;
  disabled: boolean;
  /** Optional — fires on every focus / keystroke so Brandee can wake up. */
  onActivity?: () => void;
  /** Optional — drives Brandee's listening / idle states from the input. */
  setBrandeeState?: (state: BrandeeState) => void;
}

const LISTENING_INACTIVITY_MS = 2000;

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  onActivity,
  setBrandeeState,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const length      = value.length;
  const overLimit   = length > MAX_MSG_CHARS;
  const nearLimit   = length > MAX_MSG_CHARS * 0.85;

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  // Drive Brandee's state from the input contents:
  //   non-empty value     → listening
  //   empty value         → idle
  //   no typing for 2s    → idle (even if value still has content)
  // The chat layer owns thinking/speaking — we don't override those.
  //
  // We gate on actual value changes (not just dep changes) so that spurious
  // re-renders from the parent don't clobber upstream states like the greeting.
  const prevValueRef  = useRef(value);
  const idleTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const valueChanged = prevValueRef.current !== value;
    prevValueRef.current = value;

    if (!valueChanged) return;
    if (disabled) return;

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    if (!value) {
      setBrandeeState?.('idle');
      return;
    }

    setBrandeeState?.('listening');
    idleTimerRef.current = setTimeout(() => setBrandeeState?.('idle'), LISTENING_INACTIVITY_MS);
  }, [value, disabled, setBrandeeState]);

  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  // ── Microphone (speech-to-text) ──────────────────────────────────────────
  // When the mic was used to compose the current message we set `viaVoiceRef`
  // — that flag rides along with the send so the chat layer knows to play
  // the reply back as TTS. Cleared after every send.
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError]       = useState<string | null>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const viaVoiceRef    = useRef(false);
  const baseValueRef   = useRef('');
  const micSupported   = recognitionAvailable();

  function micErrorMessage(code: string): string {
    switch (code) {
      case 'not-allowed':
      case 'permission-denied':
        return 'Mic blocked. Allow microphone access in browser/system settings.';
      case 'no-speech':
        return 'Didn’t catch that — try again.';
      case 'audio-capture':
        return 'No microphone available.';
      case 'network':
        return 'Voice recognition needs an internet connection.';
      case 'service-not-allowed':
        return 'Voice recognition service is unavailable.';
      default:
        return `Mic error: ${code}`;
    }
  }

  function startMic() {
    if (isListening || disabled) return;

    baseValueRef.current = value;
    setMicError(null);
    setIsListening(true);
    onActivity?.();

    const handle = startRecognition({
      onResult: (transcript, isFinal) => {
        // Replace whatever's after the base value with the latest interim/final
        // transcript. This way the textarea updates live while the user speaks.
        const sep = baseValueRef.current && !baseValueRef.current.endsWith(' ') ? ' ' : '';
        onChange(baseValueRef.current + sep + transcript);
        if (isFinal) {
          viaVoiceRef.current = true;
          baseValueRef.current = baseValueRef.current + sep + transcript;
        }
      },
      onEnd: () => {
        setIsListening(false);
        recognitionRef.current = null;
      },
      onError: (errorCode) => {
        setMicError(micErrorMessage(errorCode));
        setIsListening(false);
        recognitionRef.current = null;
      },
    });

    if (!handle) {
      setMicError('Voice recognition not available in this browser.');
      setIsListening(false);
      return;
    }
    recognitionRef.current = handle;
  }

  function stopMic() {
    recognitionRef.current?.stop();
  }

  // Stop recognition if the input gets disabled (chat starts thinking/speaking).
  useEffect(() => {
    if (disabled && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, [disabled]);

  function performSend() {
    if (!canSend) return;
    onSend(value, viaVoiceRef.current);
    viaVoiceRef.current = false;
    baseValueRef.current = '';
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      performSend();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onActivity?.();
    onChange(e.target.value);
  }

  const canSend = !disabled && value.trim().length > 0 && !overLimit;

  return (
    <div className="flex flex-col gap-1 px-4 pb-4 pt-2">
      <div
        className={`flex items-center gap-2 bg-input border rounded-2xl px-4 py-2.5 focus-within:border-brand transition-colors duration-150 ${overLimit ? 'border-red-500' : 'border-divider'}`}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={handleChange}
          onFocus={onActivity}
          onKeyDown={handleKeyDown}
          placeholder="Type your message…"
          disabled={disabled}
          className="flex-1 resize-none bg-transparent text-content placeholder:text-muted text-[21px] leading-normal outline-none min-h-[34px] max-h-[200px] disabled:opacity-50 py-1"
        />

        {micSupported && (
          <button
            type="button"
            onClick={isListening ? stopMic : startMic}
            disabled={disabled}
            aria-label={isListening ? 'Stop voice input' : 'Speak instead of typing'}
            className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
              isListening
                ? 'bg-red-500/90 hover:bg-red-500 text-white animate-pulse'
                : 'bg-card hover:bg-card/70 text-muted hover:text-content border border-divider'
            }`}
          >
            <MicIcon className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={performSend}
          disabled={!canSend}
          aria-label="Send message"
          className="shrink-0 w-10 h-10 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center transition-colors duration-150"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white translate-x-px">
            <path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.925A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.896 28.896 0 0 0 15.293-7.154.75.75 0 0 0 0-1.115A28.897 28.897 0 0 0 3.105 2.289Z" />
          </svg>
        </button>
      </div>

      {micError && (
        <p className="text-xs text-red-400 px-1 leading-snug">
          {micError}
        </p>
      )}

      {nearLimit && (
        <p className={`text-md text-right pr-1 ${overLimit ? 'text-red-500' : 'text-muted'}`}>
          {overLimit && 'Message too long: '}
          {length.toLocaleString()} / {MAX_MSG_CHARS.toLocaleString()}
        </p>
      )}
    </div>
  );
}

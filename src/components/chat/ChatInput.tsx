"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { MAX_MSG_CHARS } from "@/lib/schema";
import type { BrandeeState } from "@/types";
import {
  cancelSpeech,
  recognitionAvailable,
  startRecognition,
} from "@/lib/speech";
import { HeadphonesIcon, MicIcon } from "@/components/icons";

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
  /**
   * If set, the conversation has reached a server-side cap. Send is disabled
   * and a banner is shown above the input. User can click the banner to open
   * the conversation-full modal.
   */
  conversationError?: string | null;
  /** Fired when the user clicks the "Manage" button on the conversation banner. */
  onConversationFullClick?: () => void;
}

const LISTENING_INACTIVITY_MS = 2000;

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  onActivity,
  setBrandeeState,
  conversationError = null,
  onConversationFullClick,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const length = value.length;
  const overLimit = length > MAX_MSG_CHARS;
  const nearLimit = length > MAX_MSG_CHARS * 0.85;

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  // Drive Brandee's state from the input contents:
  //   non-empty value     → listening
  //   empty value         → idle
  //   no typing for 2s    → idle (even if value still has content)
  // The chat layer owns thinking/speaking — we don't override those.
  const prevValueRef = useRef(value);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const valueChanged = prevValueRef.current !== value;
    prevValueRef.current = value;

    if (!valueChanged) return;
    if (disabled) return;

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    if (!value) {
      setBrandeeState?.("idle");
      return;
    }

    setBrandeeState?.("listening");
    idleTimerRef.current = setTimeout(
      () => setBrandeeState?.("idle"),
      LISTENING_INACTIVITY_MS,
    );
  }, [value, disabled, setBrandeeState]);

  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  // ── Voice input ──────────────────────────────────────────────────────────
  // Two modes:
  //   1. Dictation (mic button)        — single phrase, fills the input,
  //                                      user clicks send manually. The
  //                                      reply still gets TTS because the
  //                                      message was composed via voice.
  //   2. Voice mode (headphones btn)   — continuous hands-free conversation.
  //                                      Mic listens, on silence auto-sends,
  //                                      reply plays via TTS, mic restarts.
  //                                      Toggle off to exit.
  const [isListening, setIsListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const viaVoiceRef = useRef(false);
  const baseValueRef = useRef("");
  const finalTranscriptRef = useRef("");

  // Keep a live ref of voiceMode so recognition callbacks read the latest.
  const voiceModeRef = useRef(voiceMode);
  useEffect(() => {
    voiceModeRef.current = voiceMode;
  }, [voiceMode]);

  // Same trick for conversationError — voice mode's onEnd callback fires
  // outside React's render cycle, so it needs the latest value via a ref.
  const conversationErrorRef = useRef(conversationError);
  useEffect(() => {
    conversationErrorRef.current = conversationError;
  }, [conversationError]);

  const onConversationFullClickRef = useRef(onConversationFullClick);
  useEffect(() => {
    onConversationFullClickRef.current = onConversationFullClick;
  }, [onConversationFullClick]);

  const micSupported = recognitionAvailable();

  function micErrorMessage(code: string): string {
    switch (code) {
      case "not-allowed":
      case "permission-denied":
        return "Mic blocked. Allow microphone access in browser/system settings.";
      case "no-speech":
        return "Didn’t catch that — try again.";
      case "audio-capture":
        return "No microphone available.";
      case "network":
        return "Voice recognition needs an internet connection.";
      case "service-not-allowed":
        return "Voice recognition service is unavailable.";
      default:
        return `Mic error: ${code}`;
    }
  }

  // ── Dictation (single phrase) ────────────────────────────────────────────
  function startMic() {
    if (isListening || disabled || voiceMode) return;

    baseValueRef.current = value;
    setMicError(null);
    setIsListening(true);
    onActivity?.();

    const handle = startRecognition({
      onResult: (transcript, isFinal) => {
        const sep =
          baseValueRef.current && !baseValueRef.current.endsWith(" ")
            ? " "
            : "";
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
      setMicError("Voice recognition not available in this browser.");
      setIsListening(false);
      return;
    }
    recognitionRef.current = handle;
  }

  function stopMic() {
    recognitionRef.current?.stop();
  }

  // ── Voice mode (continuous loop) ─────────────────────────────────────────
  function startVoiceListening() {
    if (recognitionRef.current) return; // already listening
    if (disabled) return; // chat is busy

    finalTranscriptRef.current = "";
    setMicError(null);
    setIsListening(true);
    onActivity?.();

    const handle = startRecognition({
      // Continuous + a longer silence threshold so the user can pause
      // mid-sentence without being cut off and auto-sent prematurely.
      continuous: true,
      silenceTimeout: 2000,
      onResult: (transcript) => {
        // Show what we're hearing live in the input. Always save the
        // running transcript — in continuous mode the "final" flag is
        // per-segment, but the silence timer is what truly ends speech.
        onChange(transcript);
        if (transcript) {
          finalTranscriptRef.current = transcript;
          viaVoiceRef.current = true;
        }
      },
      onEnd: () => {
        setIsListening(false);
        recognitionRef.current = null;

        if (!voiceModeRef.current) return; // user toggled voice mode off

        const text = finalTranscriptRef.current.trim();
        finalTranscriptRef.current = "";

        if (text) {
          // Conversation is full — surface the modal instead of silently
          // dropping the message in useChat's internal guard. Don't restart
          // listening; the user has to resolve the modal first.
          if (conversationErrorRef.current) {
            onConversationFullClickRef.current?.();
            return;
          }
          // Auto-send. Brandee replies via TTS, then we'll restart via the
          // useEffect below once `disabled` flips back to false.
          onSend(text, true);
          onChange("");
          baseValueRef.current = "";
          viaVoiceRef.current = false;
        } else {
          // Silence with no content — keep listening.
          startVoiceListening();
        }
      },
      onError: (errorCode) => {
        setIsListening(false);
        recognitionRef.current = null;
        setMicError(micErrorMessage(errorCode));
        // Permission/device errors — exit voice mode so we don't loop.
        if (
          errorCode === "not-allowed" ||
          errorCode === "permission-denied" ||
          errorCode === "audio-capture" ||
          errorCode === "service-not-allowed"
        ) {
          setVoiceMode(false);
        }
        // For transient errors (no-speech, network), the useEffect will
        // pick voice mode back up.
      },
    });

    if (!handle) {
      setIsListening(false);
      setMicError("Voice recognition not available in this browser.");
      setVoiceMode(false);
      return;
    }
    recognitionRef.current = handle;
  }

  function toggleVoiceMode() {
    if (voiceMode) {
      // Exiting voice mode — stop recognition + any TTS that's playing.
      setVoiceMode(false);
      recognitionRef.current?.stop();
      cancelSpeech();
    } else {
      // Entering voice mode while at the cap is pointless — the mic won't
      // restart anyway. Pop the modal so the user can resolve it first.
      if (conversationError) {
        onConversationFullClick?.();
        return;
      }
      setVoiceMode(true);
      setMicError(null);
      // The useEffect below will start listening once it sees voiceMode=true.
    }
  }

  // While in voice mode, restart listening whenever the chat is idle and
  // we don't already have an active recognition session. This is what makes
  // the loop "continuous" — after every reply finishes (disabled flips to
  // false), the mic comes back on automatically.
  useEffect(() => {
    if (!voiceMode) return;
    if (disabled) return;
    if (recognitionRef.current) return;
    // Conversation is at the cap — surface the modal instead of silently
    // staying mute. The user has to trim / clear before we can keep going.
    if (conversationError) {
      onConversationFullClick?.();
      return;
    }

    startVoiceListening();
    // We intentionally omit startVoiceListening from deps — it's recreated
    // every render but only depends on stable refs / state setters internally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceMode, disabled, conversationError]);

  // Stop any in-flight recognition when chat becomes busy (user manually
  // sent, OR auto-send fired) so the mic doesn't fight the reply.
  useEffect(() => {
    if (disabled && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, [disabled]);

  // ── Send ────────────────────────────────────────────────────────────────
  // The button is enabled whenever the user has something to send and the
  // chat isn't busy. If the conversation has hit the cap, the click is
  // routed to opening the "Conversation full" modal instead of fetching.
  const hasContent      = value.trim().length > 0;
  const canTriggerSend  = !disabled && hasContent && !overLimit;

  function performSend() {
    if (!canTriggerSend) return;
    if (conversationError) {
      onConversationFullClick?.();
      return;
    }
    onSend(value, viaVoiceRef.current);
    viaVoiceRef.current = false;
    baseValueRef.current = "";
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      performSend();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onActivity?.();
    onChange(e.target.value);
  }

  return (
    <div className="flex flex-col gap-1 px-4 pb-4 pt-2">
      <div
        className={`flex items-center gap-2 bg-input border rounded-2xl px-4 py-2.5 focus-within:border-brand transition-colors duration-150 ${overLimit ? "border-red-500" : "border-divider"}`}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={handleChange}
          onFocus={onActivity}
          onKeyDown={handleKeyDown}
          placeholder={
            voiceMode
              ? isListening
                ? "Listening… speak naturally"
                : "Voice mode on — Brandee is replying"
              : "Type your message…"
          }
          disabled={disabled || voiceMode}
          className="flex-1 resize-none bg-transparent text-content placeholder:text-muted text-[21px] leading-normal outline-none min-h-[34px] max-h-[200px] disabled:opacity-50 py-1"
        />

        {/* Voice mode (continuous, hands-free, TTS replies) */}
        {micSupported && (
          <button
            type="button"
            onClick={toggleVoiceMode}
            aria-label={
              voiceMode ? "Exit voice mode" : "Start voice conversation"
            }
            title={
              voiceMode ? "Exit voice mode" : "Voice conversation (hands-free)"
            }
            className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-150 cursor-pointer ${
              voiceMode
                ? "bg-brand hover:bg-brand-dark text-white animate-pulse"
                : "bg-card hover:bg-card/70 text-muted hover:text-content border border-divider"
            }`}
          >
            <HeadphonesIcon className="w-4 h-4" />
          </button>
        )}

        {/* Single-shot dictation (only available outside voice mode) */}
        {micSupported && !voiceMode && (
          <button
            type="button"
            onClick={isListening ? stopMic : startMic}
            disabled={disabled}
            aria-label={
              isListening ? "Stop voice input" : "Speak instead of typing"
            }
            title="Dictate a single message"
            className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
              isListening
                ? "bg-red-500/90 hover:bg-red-500 text-white animate-pulse"
                : "bg-card hover:bg-card/70 text-muted hover:text-content border border-divider"
            }`}
          >
            <MicIcon className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={performSend}
          disabled={!canTriggerSend}
          aria-label="Send message"
          className="shrink-0 w-10 h-10 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center transition-colors duration-150"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4 text-white translate-x-px"
          >
            <path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.925A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.896 28.896 0 0 0 15.293-7.154.75.75 0 0 0 0-1.115A28.897 28.897 0 0 0 3.105 2.289Z" />
          </svg>
        </button>
      </div>

      {conversationError && (
        <div className="flex items-center justify-between gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          <p className="text-xs text-red-300 leading-snug flex-1">
            {conversationError}
          </p>
          {onConversationFullClick && (
            <button
              type="button"
              onClick={onConversationFullClick}
              className="text-xs font-semibold text-red-200 hover:text-white shrink-0 cursor-pointer underline underline-offset-2"
            >
              Manage
            </button>
          )}
        </div>
      )}

      {micError && (
        <p className="text-xs text-red-400 px-1 leading-snug">{micError}</p>
      )}

      {nearLimit && (
        <p
          className={`text-md text-right pr-1 ${overLimit ? "text-red-500" : "text-muted"}`}
        >
          {overLimit && "Message too long: "}
          {length.toLocaleString()} / {MAX_MSG_CHARS.toLocaleString()}
        </p>
      )}
    </div>
  );
}

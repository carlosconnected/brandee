'use client';

import { useState, useEffect, useRef, startTransition } from 'react';
import type { BrandeeState, Message } from '@/types';
import { cancelSpeech, speakText } from '@/lib/speech';

const STORAGE_KEY = 'brandee-messages';
// Word-by-word typing cadence. Bumped from 38 to 50ms (~30% slower) for a
// more deliberate reading pace.
const TYPING_WORD_DELAY_MS = 50;
// Hold the `speaking` state for an extra beat after the typing animation
// finishes — gives Brandee a moment to "finish her thought" before relaxing.
const SPEAKING_TAIL_MS = 1000;

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function loadMessages(): Message[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Message[]) : [];
  } catch {
    return [];
  }
}

function persistMessages(messages: Message[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    /* ignore quota errors */
  }
}

interface UseChatOptions {
  userName?: string;
  /** Called by the chat layer to drive Brandee's state machine. */
  setBrandeeState?: (state: BrandeeState) => void;
}

export function useChat({ userName, setBrandeeState }: UseChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const messagesRef = useRef(messages);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    const stored = loadMessages();
    if (stored.length > 0) startTransition(() => setMessages(stored));
  }, []);

  // Persist on every change
  useEffect(() => {
    if (messages.length > 0) persistMessages(messages);
  }, [messages]);

  // Cleanup typing timer on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  function simulateTyping(fullText: string, messageId: string, onDone: () => void) {
    const words = fullText.split(' ');
    let idx = 0;

    function tick() {
      if (idx >= words.length) {
        onDone();
        return;
      }
      const partial = words.slice(0, idx + 1).join(' ');
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, content: partial } : m))
      );
      idx++;
      typingTimerRef.current = setTimeout(tick, TYPING_WORD_DELAY_MS);
    }

    tick();
  }

  async function sendMessage(content: string, viaVoice: boolean = false) {
    const text = content.trim();
    if (!text || isThinking || isSpeaking) return;

    // Cancel any speech still rolling from a previous reply.
    cancelSpeech();

    const userMsg: Message = { id: uid(), role: 'user', content: text, timestamp: Date.now() };
    const history = [...messagesRef.current, userMsg];

    setMessages(history);
    setInputValue('');
    setIsThinking(true);
    setBrandeeState?.('thinking');

    try {
      const apiMessages = history.map(({ role, content: c }) => ({ role, content: c }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          ...(userName ? { userName } : {}),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const { reply, cue } = (await res.json()) as {
        reply: string;
        cue: 'celebrate' | 'confused' | null;
      };
      const assistantId = uid();

      setIsThinking(false);

      // Cue overrides the speaking visual: celebrate / confused take priority.
      if (cue === 'celebrate') setBrandeeState?.('celebrating');
      else if (cue === 'confused') setBrandeeState?.('confused');
      else setBrandeeState?.('speaking');

      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', timestamp: Date.now() },
      ]);
      setIsSpeaking(true);

      // Visual typing and audio TTS run in parallel. The speaking state ends
      // only when BOTH have finished — whichever takes longer governs.
      // Celebrate/confused cues auto-return to idle on their own timers, so
      // we don't push them back to idle from here.
      let typingDone = false;
      let speechDone = false;
      const tryFinishSpeaking = () => {
        if (!typingDone || !speechDone) return;
        setIsSpeaking(false);
        if (cue === null) setBrandeeState?.('idle');
      };

      simulateTyping(reply, assistantId, () => {
        // Tail keeps the visual a beat longer after the last word is typed.
        typingTimerRef.current = setTimeout(() => {
          typingDone = true;
          tryFinishSpeaking();
        }, SPEAKING_TAIL_MS);
      });

      // TTS only when the user composed via mic AND it's a regular speaking
      // reply. Typed messages get a silent reply (typing animation only).
      // Celebrate/confused cues are short visual reactions — no TTS for those.
      if (viaVoice && cue === null) {
        speakText(reply, () => {
          speechDone = true;
          tryFinishSpeaking();
        });
      } else {
        speechDone = true;
      }
    } catch {
      setIsThinking(false);
      setBrandeeState?.('confused');
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
          timestamp: Date.now(),
        },
      ]);
    }
  }

  function clearChat() {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    cancelSpeech();
    setMessages([]);
    setIsThinking(false);
    setIsSpeaking(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  return {
    messages,
    inputValue,
    setInputValue,
    isThinking,
    isSpeaking,
    sendMessage,
    clearChat,
  };
}

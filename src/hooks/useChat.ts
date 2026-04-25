'use client';

import { useState, useEffect, useRef, startTransition } from 'react';
import type { AgentState, Message } from '@/types';

const STORAGE_KEY = 'brandee-messages';
const TYPING_WORD_DELAY_MS = 38;

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

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Ref so sendMessage always reads the latest messages without being listed
  // as a reactive dependency — avoids re-creating the handler on every update.
  const messagesRef = useRef(messages);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Hydrate from localStorage once on mount.
  // startTransition marks this as a non-urgent update so React doesn't treat it
  // as a synchronous setState call inside an effect body.
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

  const agentState: AgentState = isThinking
    ? 'thinking'
    : isSpeaking
      ? 'speaking'
      : inputValue.trim()
        ? 'listening'
        : 'idle';

  // React Compiler (enabled in next.config.ts) memoizes functions automatically —
  // useCallback wrappers are omitted intentionally.

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

  async function sendMessage(content: string) {
    const text = content.trim();
    if (!text || isThinking || isSpeaking) return;

    const userMsg: Message = { id: uid(), role: 'user', content: text, timestamp: Date.now() };
    const history = [...messagesRef.current, userMsg];

    setMessages(history);
    setInputValue('');
    setIsThinking(true);

    try {
      const apiMessages = history.map(({ role, content: c }) => ({ role, content: c }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const { reply } = (await res.json()) as { reply: string };
      const assistantId = uid();

      setIsThinking(false);
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', timestamp: Date.now() },
      ]);
      setIsSpeaking(true);

      simulateTyping(reply, assistantId, () => setIsSpeaking(false));
    } catch {
      setIsThinking(false);
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
    agentState,
    isThinking,
    isSpeaking,
    sendMessage,
    clearChat,
  };
}

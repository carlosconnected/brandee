'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

  const messagesRef = useRef(messages);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep ref in sync so sendMessage always sees the latest messages
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    const stored = loadMessages();
    if (stored.length > 0) setMessages(stored);
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

  const simulateTyping = useCallback((fullText: string, messageId: string, onDone: () => void) => {
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
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
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
    },
    [isThinking, isSpeaking, simulateTyping]
  );

  const clearChat = useCallback(() => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    setMessages([]);
    setIsThinking(false);
    setIsSpeaking(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

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

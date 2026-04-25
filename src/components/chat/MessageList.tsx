'use client';

import { useEffect, useRef } from 'react';
import type { Message } from '@/types';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: Message[];
  isSpeaking: boolean;
}

export function MessageList({ messages, isSpeaking }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastLength = useRef(0);

  useEffect(() => {
    if (messages.length !== lastLength.current) {
      lastLength.current = messages.length;
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-3 text-center px-8 select-none">
        <div className="w-12 h-12 rounded-full bg-brand/20 flex items-center justify-center text-2xl">
          ✨
        </div>
        <p className="text-muted text-sm leading-relaxed max-w-[240px]">
          Say hello to Brandee! Ask anything to get started.
        </p>
      </div>
    );
  }

  const lastAssistantIndex = [...messages].reverse().findIndex((m) => m.role === 'assistant');
  const lastAssistantId =
    lastAssistantIndex !== -1
      ? messages[messages.length - 1 - lastAssistantIndex].id
      : null;

  return (
    <div className="flex flex-col flex-1 overflow-y-auto px-4 py-4 gap-4 min-h-0">
      {messages.map((msg) => (
        <MessageItem
          key={msg.id}
          message={msg}
          isLastAssistant={msg.id === lastAssistantId}
          isSpeaking={isSpeaking}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

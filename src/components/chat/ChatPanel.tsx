'use client';

import type { Message } from '@/types';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

interface ChatPanelProps {
  messages: Message[];
  inputValue: string;
  onInputChange: (v: string) => void;
  onSend: (v: string) => void;
  onClear: () => void;
  isThinking: boolean;
  isSpeaking: boolean;
}

export function ChatPanel({
  messages,
  inputValue,
  onInputChange,
  onSend,
  onClear,
  isThinking,
  isSpeaking,
}: ChatPanelProps) {
  const isDisabled = isThinking || isSpeaking;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3.5 border-b border-divider shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-xs font-bold text-white">
            B
          </div>
          <div>
            <p className="text-sm font-semibold text-content leading-none">Brandee</p>
            <p className="text-[11px] text-muted leading-none mt-0.5">AI Chat Agent</p>
          </div>
          {/* Online dot */}
          <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1" />
        </div>

        <button
          onClick={onClear}
          disabled={messages.length === 0}
          className="text-xs text-muted hover:text-content disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-2 py-1 rounded-lg hover:bg-card"
        >
          Clear
        </button>
      </header>

      {/* Thinking indicator bar */}
      {isThinking && (
        <div className="flex items-center gap-2 px-5 py-2 bg-card/50 border-b border-divider text-xs text-muted shrink-0">
          <span className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1 h-1 rounded-full bg-brand-light animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </span>
          Brandee is thinking…
        </div>
      )}

      {/* Messages */}
      <MessageList messages={messages} isSpeaking={isSpeaking} />

      {/* Input */}
      <div className="shrink-0 border-t border-divider">
        <ChatInput
          value={inputValue}
          onChange={onInputChange}
          onSend={onSend}
          disabled={isDisabled}
        />
        <p className="text-center text-[10px] text-dim pb-2 select-none">
          Brandee can make mistakes. Please verify important information.
        </p>
      </div>
    </div>
  );
}

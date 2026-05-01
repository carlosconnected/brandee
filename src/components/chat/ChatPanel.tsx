'use client';

import type { BrandeeState, Message } from '@/types';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

interface ChatPanelProps {
  messages: Message[];
  inputValue: string;
  onInputChange: (v: string) => void;
  onSend: (v: string, viaVoice: boolean) => void;
  onClear: () => void;
  isThinking: boolean;
  isSpeaking: boolean;
  userName: string;
  onActivity?: () => void;
  setBrandeeState?: (state: BrandeeState) => void;
}

export function ChatPanel({
  messages,
  inputValue,
  onInputChange,
  onSend,
  onClear,
  isThinking,
  isSpeaking,
  userName,
  onActivity,
  setBrandeeState,
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
            <p className="text-xl font-bold text-content leading-none">Brandee</p>
            <p className="text-xs text-muted leading-none mt-1">AI Chat Agent</p>
          </div>
          {/* Online dot */}
          <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1" />
        </div>

        <button
          onClick={onClear}
          disabled={messages.length === 0}
          className="flex items-center gap-1.5 lg:gap-[8px] text-xs lg:text-[17px] font-medium text-muted border border-divider rounded-lg px-3 lg:px-[17px] py-1.5 lg:py-[8px] hover:border-divider-strong hover:text-content disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 lg:w-5 lg:h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 4h12M5 4V2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5V4M6 7v5M10 7v5M3.5 4l.75 9.5a.5.5 0 0 0 .5.5h6.5a.5.5 0 0 0 .5-.5L12.5 4" />
          </svg>
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
      <MessageList messages={messages} isSpeaking={isSpeaking} userName={userName} />

      {/* Input */}
      <div className="shrink-0 border-t border-divider">
        <ChatInput
          value={inputValue}
          onChange={onInputChange}
          onSend={onSend}
          disabled={isDisabled}
          onActivity={onActivity}
          setBrandeeState={setBrandeeState}
        />
        <p className="text-center text-[10px] text-dim pb-2 select-none">
          Brandee can make mistakes. Please verify important information.
        </p>
      </div>
    </div>
  );
}

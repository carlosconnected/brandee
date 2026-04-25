'use client';

import { useEffect, useRef, type KeyboardEvent } from 'react';
import { MAX_MSG_CHARS } from '@/lib/schema';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (value: string) => void;
  disabled: boolean;
}

export function ChatInput({ value, onChange, onSend, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const length = value.length;
  const overLimit = length > MAX_MSG_CHARS;
  const nearLimit = length > MAX_MSG_CHARS * 0.85;

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim() && !overLimit) {
        onSend(value);
      }
    }
  };

  const canSend = !disabled && value.trim().length > 0 && !overLimit;

  return (
    <div className="flex flex-col gap-1 px-4 pb-4 pt-2">
      <div className={`flex items-center gap-2 bg-input border rounded-2xl px-4 py-2.5 focus-within:border-brand transition-colors duration-150 ${overLimit ? 'border-red-500' : 'border-divider'}`}>
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message…"
          disabled={disabled}
          className="flex-1 resize-none bg-transparent text-content placeholder:text-muted text-[21px] leading-normal outline-none min-h-[34px] max-h-[200px] disabled:opacity-50 py-1"
        />

        <button
          onClick={() => canSend && onSend(value)}
          disabled={!canSend}
          aria-label="Send message"
          className="shrink-0 w-10 h-10 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center transition-colors duration-150"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white translate-x-px">
            <path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.925A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.896 28.896 0 0 0 15.293-7.154.75.75 0 0 0 0-1.115A28.897 28.897 0 0 0 3.105 2.289Z" />
          </svg>
        </button>
      </div>

      {nearLimit && (
        <p className={`text-xs text-right pr-1 ${overLimit ? 'text-red-500' : 'text-muted'}`}>
          {length.toLocaleString()} / {MAX_MSG_CHARS.toLocaleString()}
        </p>
      )}
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';
import type { Message } from '@/types';

interface MessageItemProps {
  message: Message;
  isLastAssistant: boolean;
  isSpeaking: boolean;
}

export function MessageItem({ message, isLastAssistant, isSpeaking }: MessageItemProps) {
  const isUser = message.role === 'user';
  const showCursor = isLastAssistant && isSpeaking && !isUser;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`flex items-end gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar dot for assistant */}
      {!isUser && (
        <div className="shrink-0 w-7 h-7 rounded-full bg-brand flex items-center justify-center text-[10px] font-bold text-white mb-1">
          B
        </div>
      )}

      <div
        className={`
          max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
          ${isUser
            ? 'bg-brand text-white rounded-br-sm'
            : 'bg-card text-content rounded-bl-sm border border-divider'
          }
        `}
      >
        {message.content}
        {showCursor && (
          <motion.span
            className="inline-block w-[2px] h-[14px] ml-0.5 bg-brand-light align-middle rounded-full"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
          />
        )}
      </div>
    </motion.div>
  );
}

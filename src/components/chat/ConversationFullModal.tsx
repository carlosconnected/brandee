'use client';

import { useEffect } from 'react';

interface ConversationFullModalProps {
  open: boolean;
  onClose: () => void;
  /** Wipes the entire chat and resets to a clean conversation. */
  onClearAll: () => void;
  /**
   * Drops the older half of messages and keeps the most recent half. Lets
   * the user preserve recent context while bringing the chat back under
   * the limit.
   */
  onTrimHalf: () => void;
}

export function ConversationFullModal({
  open,
  onClose,
  onClearAll,
  onTrimHalf,
}: ConversationFullModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md bg-panel border border-divider rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-content">Conversation is full</h2>
        <p className="text-sm text-muted leading-relaxed mt-2 mb-6">
          You&apos;ve reached the message limit with Brandee. To keep chatting,
          you can either trim just the older half of the conversation (so your
          recent context stays intact) or clear the whole thing for a fresh
          start.
        </p>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              onTrimHalf();
              onClose();
            }}
            className="bg-brand hover:bg-brand-dark text-white font-semibold rounded-xl px-4 py-3 cursor-pointer transition-colors"
          >
            Trim older half, keep recent
          </button>
          <button
            type="button"
            onClick={() => {
              onClearAll();
              onClose();
            }}
            className="bg-card hover:bg-card/70 text-content border border-divider rounded-xl px-4 py-3 cursor-pointer transition-colors"
          >
            Clear entire conversation
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted hover:text-content cursor-pointer transition-colors py-2 mt-1"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

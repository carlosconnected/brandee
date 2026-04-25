'use client';

import { useChat } from '@/hooks/useChat';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { Avatar } from '@/components/avatar/Avatar';

export default function Home() {
  const {
    messages,
    inputValue,
    setInputValue,
    agentState,
    isThinking,
    isSpeaking,
    sendMessage,
    clearChat,
  } = useChat();

  return (
    <div className="flex h-full bg-base overflow-hidden">
      {/*
        Mobile layout:  avatar panel stacked on top (compact), chat below
        Desktop layout: chat on left, avatar panel on right
      */}

      {/* ── AVATAR PANEL ── */}
      <aside className="flex shrink-0 items-center justify-center bg-panel border-b border-divider h-52 w-full lg:h-auto lg:w-[400px] lg:border-b-0 lg:border-l lg:border-divider order-1 lg:order-2 relative overflow-hidden">
        {/* Radial glow in background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 55%, rgba(124,58,237,0.18) 0%, transparent 100%)',
          }}
        />
        <Avatar state={agentState} />
      </aside>

      {/* ── CHAT PANEL ── */}
      <main className="flex flex-col flex-1 min-w-0 min-h-0 order-2 lg:order-1">
        <ChatPanel
          messages={messages}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSend={sendMessage}
          onClear={clearChat}
          isThinking={isThinking}
          isSpeaking={isSpeaking}
        />
      </main>
    </div>
  );
}

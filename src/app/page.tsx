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
    <div className="flex h-full bg-base p-3 gap-3 lg:p-5 lg:gap-4 overflow-hidden">

      {/* ── AVATAR CARD ── */}
      <aside className="flex shrink-0 items-center justify-center order-1 lg:order-2 h-52 w-full lg:h-auto lg:w-[380px] bg-panel border border-divider rounded-2xl relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 55%, rgba(124,58,237,0.18) 0%, transparent 100%)',
          }}
        />
        <Avatar state={agentState} />
      </aside>

      {/* ── CHAT CARD ── */}
      <main className="flex flex-col flex-1 min-w-0 min-h-0 order-2 lg:order-1 bg-panel border border-divider rounded-2xl overflow-hidden">
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

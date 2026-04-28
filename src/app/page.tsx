'use client';

import { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { useUser } from '@/hooks/useUser';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { Avatar } from '@/components/avatar/Avatar';
import { Sidebar } from '@/components/layout/Sidebar';
import { LoginScreen } from '@/components/auth/LoginScreen';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, hydrated, signIn, signOut } = useUser();
  const {
    messages,
    inputValue,
    setInputValue,
    agentState,
    isThinking,
    isSpeaking,
    sendMessage,
    clearChat,
  } = useChat({ userName: user?.name });

  // Wait for localStorage hydration before deciding which screen to render —
  // avoids a flash of the login form when the user is already signed in.
  if (!hydrated) return null;

  if (!user) {
    return <LoginScreen onSignIn={signIn} />;
  }

  function handleSignOut() {
    clearChat();
    setSidebarOpen(false);
    signOut();
  }

  return (
    <div className="flex flex-col h-full bg-base p-2 gap-2 lg:flex-row lg:p-0 lg:gap-4 overflow-hidden">

      {/* ── SIDEBAR ── drawer on mobile, fixed left column on desktop (hosts the desktop avatar) */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        agentState={agentState}
        userName={user.name}
        onSignOut={handleSignOut}
      />

      {/* ── HAMBURGER ── mobile only */}
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
        className="lg:hidden fixed top-3 left-3 z-30 w-9 h-9 rounded-lg bg-base/80 backdrop-blur-sm border border-divider flex items-center justify-center text-content cursor-pointer"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <line x1="3" y1="6"  x2="21" y2="6"  />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* ── AVATAR CARD ── mobile only top strip (desktop avatar lives inside the sidebar) */}
      <aside className="lg:hidden shrink-0 order-1 h-[20vh] w-full bg-panel border border-divider rounded-2xl relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 55%, rgba(124,58,237,0.18) 0%, transparent 100%)',
          }}
        />
        <Avatar state={agentState} />
      </aside>

      {/* ── CHAT CARD ── fills remaining space (chat is now the only main panel on desktop) */}
      <main className="flex flex-col flex-1 min-w-0 min-h-0 order-2 lg:order-2 bg-panel border border-divider rounded-2xl overflow-hidden lg:my-5 lg:mr-5">
        <ChatPanel
          messages={messages}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSend={sendMessage}
          onClear={clearChat}
          isThinking={isThinking}
          isSpeaking={isSpeaking}
          userName={user.name}
        />
      </main>

    </div>
  );
}

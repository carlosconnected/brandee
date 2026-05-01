'use client';

import { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { useUser } from '@/hooks/useUser';
import { useGreetingSpeech } from '@/hooks/useGreetingSpeech';
import { useBrandeeState } from '@/components/brandee/useBrandeeState';
import { clearGreetingHistory } from '@/components/brandee/greetingHistory';
import { cancelSpeech } from '@/lib/speech';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { BrandeeWithDesk } from '@/components/brandee/BrandeeWithDesk';
import { Sidebar } from '@/components/layout/Sidebar';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { MenuIcon } from '@/components/icons';

export default function Home() {
  const { user, hydrated, signIn, signOut } = useUser();

  if (!hydrated) return null;
  if (!user) return <LoginScreen onSignIn={signIn} />;

  // Keyed by user.name so signing back in remounts the entire app subtree
  // and replays the greeting animation. Also resets in-flight chat state.
  return <SignedInApp key={user.name} userName={user.name} onSignOut={signOut} />;
}

function SignedInApp({ userName, onSignOut }: { userName: string; onSignOut: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    state: brandeeState,
    transitionFrame: brandeeTransitionFrame,
    setState: setBrandeeState,
    reportActivity,
  } = useBrandeeState();

  const {
    messages,
    inputValue,
    setInputValue,
    isThinking,
    isSpeaking,
    sendMessage,
    clearChat,
    trimOldestHalf,
    conversationError,
  } = useChat({ userName, setBrandeeState });

  // Speak the greeting out loud on the first sign-in of the day. The visible
  // greeting wave is owned by the state machine — this hook only adds audio.
  useGreetingSpeech({ state: brandeeState, userName });

  function handleSignOut() {
    cancelSpeech();
    clearChat();
    clearGreetingHistory();
    setSidebarOpen(false);
    onSignOut();
  }

  return (
    <div
      className="flex flex-col h-full bg-base p-2 gap-2 lg:flex-row lg:p-0 lg:gap-4 overflow-hidden"
      onClick={reportActivity}
    >
      {/* ── SIDEBAR ── drawer on mobile, fixed left column on desktop (hosts the desktop avatar) */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        brandeeState={brandeeState}
        brandeeTransitionFrame={brandeeTransitionFrame}
        userName={userName}
        onSignOut={handleSignOut}
      />

      {/* ── HAMBURGER ── mobile only */}
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
        className="lg:hidden fixed top-3 left-3 z-30 w-9 h-9 rounded-lg bg-base/80 backdrop-blur-sm border border-divider flex items-center justify-center text-content cursor-pointer"
      >
        <MenuIcon className="w-5 h-5" />
      </button>

      {/* ── AVATAR CARD ── mobile only top strip (desktop avatar lives inside the sidebar) */}
      <aside className="lg:hidden shrink-0 order-1 h-[28vh] w-full bg-panel border border-divider rounded-2xl relative overflow-hidden flex items-center justify-center">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 55%, rgba(124,58,237,0.18) 0%, transparent 100%)',
          }}
        />
        <BrandeeWithDesk
          state={brandeeState}
          transitionFrame={brandeeTransitionFrame}
          size={130}
        />
      </aside>

      {/* ── CHAT CARD ── fills remaining space (chat is now the only main panel on desktop) */}
      <main className="flex flex-col flex-1 min-w-0 min-h-0 order-2 lg:order-2 bg-panel border border-divider rounded-2xl overflow-hidden lg:my-5 lg:mr-5">
        <ChatPanel
          messages={messages}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSend={sendMessage}
          onClear={clearChat}
          onTrimHalf={trimOldestHalf}
          isThinking={isThinking}
          isSpeaking={isSpeaking}
          userName={userName}
          onActivity={reportActivity}
          setBrandeeState={setBrandeeState}
          conversationError={conversationError}
        />
      </main>
    </div>
  );
}

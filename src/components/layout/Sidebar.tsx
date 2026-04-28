'use client';

import { useEffect } from 'react';
import type { AgentState } from '@/types';
import { Avatar } from '@/components/avatar/Avatar';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  agentState: AgentState;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Courses',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M4 19V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13" />
        <path d="M4 19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2" />
        <path d="M8 4v17" />
      </svg>
    ),
  },
  {
    label: 'Chats',
    badge: '19',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: 'Services',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
  },
  {
    label: 'Consultations',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M3 11a9 9 0 0 1 18 0v5a3 3 0 0 1-3 3h-1v-7h4" />
        <path d="M21 11h-4v7h1a3 3 0 0 0 3-3" />
        <path d="M3 11h4v7H6a3 3 0 0 1-3-3z" />
      </svg>
    ),
  },
  {
    label: 'Resources',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </svg>
    ),
  },
  {
    label: 'My Certificates',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="9" r="6" />
        <path d="M8.5 13.5 7 22l5-3 5 3-1.5-8.5" />
      </svg>
    ),
  },
  {
    label: 'My Team',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Discover',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <path d="m16 8-4 8-4-8 8 0z" transform="rotate(45 12 12)" />
      </svg>
    ),
  },
  {
    label: 'Pricing',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <circle cx="7" cy="7" r="1" fill="currentColor" />
      </svg>
    ),
  },
];

const ACTIVE_LABEL = 'Dashboard';

export function Sidebar({ isOpen, onClose, agentState }: SidebarProps) {
  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  return (
    <>
      {/* Backdrop — mobile only, when drawer is open */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          w-[260px] lg:w-[275px] shrink-0
          bg-panel border-r border-divider
          flex flex-col
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:rounded-2xl lg:border lg:my-5 lg:ml-5
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 shrink-0">
          <Butterfly />
          <span className="text-xl font-bold tracking-wider text-content">BRANDEE</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto lg:flex-none lg:overflow-visible px-3 pb-4">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = item.label === ACTIVE_LABEL;
              return (
                <li key={item.label}>
                  <button
                    type="button"
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                      text-sm font-medium transition-colors cursor-pointer
                      ${active
                        ? 'bg-brand/15 text-brand-light'
                        : 'text-muted hover:text-content hover:bg-card/60'
                      }
                    `}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className="shrink-0 text-[10px] font-semibold bg-brand text-white rounded-full px-2 py-0.5 leading-none">
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Brandee avatar — desktop only, fills remaining vertical space */}
        <div className="hidden lg:flex flex-1 min-h-0 relative overflow-hidden mx-3 mb-3 rounded-xl bg-base/30">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 70% 60% at 50% 55%, rgba(124,58,237,0.18) 0%, transparent 100%)',
            }}
          />
          <Avatar state={agentState} compact />
        </div>

        {/* User profile + sign out */}
        <div className="shrink-0 border-t border-divider p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="shrink-0 w-9 h-9 rounded-full bg-brand flex items-center justify-center text-xs font-bold text-white">
              C
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-content leading-tight truncate">Chris</p>
              <p className="text-[11px] text-muted leading-tight truncate">chris@brandeepro.com</p>
            </div>
            <button
              type="button"
              aria-label="Settings"
              className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-muted hover:text-content hover:bg-card/60 cursor-pointer transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
          <button
            type="button"
            className="w-full text-sm font-medium text-muted border border-divider rounded-lg px-3 py-2 hover:border-divider-strong hover:text-content cursor-pointer transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

function Butterfly() {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
      <defs>
        <linearGradient id="butterflyGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      {/* Wings */}
      <path
        d="M16 16 C 12 6, 4 6, 3 12 C 2 18, 8 22, 16 16 Z"
        fill="url(#butterflyGrad)"
      />
      <path
        d="M16 16 C 12 22, 4 26, 6 28 C 9 30, 14 24, 16 18 Z"
        fill="url(#butterflyGrad)"
        opacity="0.85"
      />
      <path
        d="M16 16 C 20 6, 28 6, 29 12 C 30 18, 24 22, 16 16 Z"
        fill="url(#butterflyGrad)"
      />
      <path
        d="M16 16 C 20 22, 28 26, 26 28 C 23 30, 18 24, 16 18 Z"
        fill="url(#butterflyGrad)"
        opacity="0.85"
      />
      {/* Body */}
      <line x1="16" y1="6" x2="16" y2="26" stroke="#1e0d40" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

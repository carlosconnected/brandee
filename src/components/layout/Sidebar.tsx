'use client';

import { useEffect } from 'react';
import type { BrandeeState } from '@/types';
import { Brandee } from '@/components/brandee/Brandee';
import {
  ButterflyIcon,
  CertificatesIcon,
  ChatsIcon,
  ConsultationsIcon,
  CoursesIcon,
  DashboardIcon,
  ResourcesIcon,
  ServicesIcon,
  SettingsIcon,
  TeamIcon,
} from '@/components/icons';

interface NavItem {
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  brandeeState: BrandeeState;
  brandeeTransitionFrame: string | null;
  userName: string;
  onSignOut: () => void;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',       Icon: DashboardIcon },
  { label: 'Courses',         Icon: CoursesIcon },
  { label: 'Chats',           Icon: ChatsIcon, badge: '19' },
  { label: 'Services',        Icon: ServicesIcon },
  { label: 'Consultations',   Icon: ConsultationsIcon },
  { label: 'Resources',       Icon: ResourcesIcon },
  { label: 'My Certificates', Icon: CertificatesIcon },
  { label: 'My Team',         Icon: TeamIcon },
];

const ACTIVE_LABEL = 'Dashboard';

export function Sidebar({
  isOpen,
  onClose,
  brandeeState,
  brandeeTransitionFrame,
  userName,
  onSignOut,
}: SidebarProps) {
  const initial = userName.trim().charAt(0).toUpperCase() || '?';

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
          w-[280px] lg:w-[344px] shrink-0
          bg-panel border-r border-divider
          flex flex-col
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:rounded-2xl lg:border lg:my-5 lg:ml-5
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 shrink-0">
          <ButterflyIcon className="w-7 h-7" />
          <span className="text-xl font-bold tracking-wider text-content">BRANDEE</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto lg:flex-none lg:overflow-visible px-3 pb-4">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ label, Icon, badge }) => {
              const active = label === ACTIVE_LABEL;
              return (
                <li key={label}>
                  <button
                    type="button"
                    className={`
                      w-full flex items-center gap-3.5 px-4 py-[9px] rounded-lg
                      text-[18px] font-medium transition-colors cursor-pointer
                      ${active
                        ? 'bg-brand/15 text-brand-light'
                        : 'text-muted hover:text-content hover:bg-card/60'
                      }
                    `}
                  >
                    <Icon className="w-7 h-7 shrink-0" />
                    <span className="flex-1 text-left">{label}</span>
                    {badge && (
                      <span className="shrink-0 text-xs font-semibold bg-brand text-white rounded-full px-2.5 py-0.5 leading-none">
                        {badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Brandee avatar — desktop only, fills remaining vertical space */}
        <div className="hidden lg:flex flex-1 min-h-0 relative overflow-hidden mx-3 mb-3 rounded-xl bg-base/30 items-center justify-center">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 70% 60% at 50% 55%, rgba(124,58,237,0.18) 0%, transparent 100%)',
            }}
          />
          <Brandee state={brandeeState} transitionFrame={brandeeTransitionFrame} size={390} />
        </div>

        {/* User profile + sign out */}
        <div className="shrink-0 border-t border-divider p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="shrink-0 w-9 h-9 rounded-full bg-brand flex items-center justify-center text-xs font-bold text-white">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[28px] font-semibold text-content leading-tight truncate">{userName}</p>
            </div>
            <button
              type="button"
              aria-label="Settings"
              className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-muted hover:text-content hover:bg-card/60 cursor-pointer transition-colors"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="w-full text-[17px] font-medium text-muted border border-divider rounded-lg px-3 py-2.5 hover:border-divider-strong hover:text-content cursor-pointer transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

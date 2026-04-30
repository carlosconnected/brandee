'use client';

import { useEffect } from 'react';
import type { BrandeeState } from '@/types';
import { BrandeeImage } from './BrandeeImage';
import { frameUrl, getAllImagePaths } from './constants';

interface BrandeeProps {
  state: BrandeeState;
  size?: number;
  showStateLabel?: boolean;
  /** Transition frame currently overlaying the primary state image. */
  transitionFrame?: string | null;
}

const STATE_LABELS: Record<BrandeeState, string> = {
  greeting:    'Hi there',
  idle:        'Idle',
  bored:       'Bored',
  sleeping:    'Sleeping',
  listening:   'Listening',
  thinking:    'Thinking',
  speaking:    'Speaking',
  celebrating: 'Celebrating',
  confused:    'Confused',
};

/**
 * Root Brandee avatar component. Reads `state` from props (the source of
 * truth lives in `useBrandeeState`, called once at the page level so all
 * Brandee instances on the page stay in sync).
 *
 * Preloads all 10 frame images on mount to prevent flash on state change.
 */
export function Brandee({
  state,
  size = 180,
  showStateLabel = false,
  transitionFrame = null,
}: BrandeeProps) {
  useEffect(() => {
    // Imperatively warm the browser cache. Cheap, runs once.
    for (const frame of getAllImagePaths()) {
      const img = new window.Image();
      img.src = frameUrl(frame);
    }
  }, []);

  return (
    <div className="relative inline-flex flex-col items-center justify-center">
      <BrandeeImage state={state} size={size} transitionFrame={transitionFrame} />
      {showStateLabel && (
        <span className="absolute bottom-2 left-2 text-[10px] font-medium text-muted bg-base/80 backdrop-blur-sm border border-divider rounded-full px-2.5 py-1 leading-none select-none">
          {STATE_LABELS[state]}
        </span>
      )}
    </div>
  );
}

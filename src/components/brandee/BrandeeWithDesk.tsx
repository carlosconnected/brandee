'use client';

import Image from 'next/image';
import type { BrandeeState } from '@/types';
import { Brandee } from './Brandee';
import { frameUrl } from './constants';
import { LAYOUT_REFERENCE_WIDTH, STAGE_TABLE_OVERLAP, resolveLayout } from './layouts';

interface BrandeeWithDeskProps {
  state: BrandeeState;
  transitionFrame?: string | null;
  /** Width of the rendered Brandee box, in pixels. Layouts are scaled to fit. */
  size?: number;
  className?: string;
}

// table.png native aspect ratio (855 × 636).
const TABLE_RATIO = 636 / 855;

/**
 * Brandee composed with the table beneath her, with positioning driven by
 * `STATE_LAYOUTS` / `FRAME_LAYOUTS` in `layouts.ts`. Use this anywhere in
 * the app where you want the avatar sitting at the desk — the sidebar,
 * mobile top strip, etc.
 *
 * Layout values are tuned in the playground at a 420px reference width and
 * scaled proportionally for any other render size.
 */
// CSS transition duration for the body's Y/X morph as layout values change
// between states and transition frames. Tuned to roughly match the image
// cross-fade in BrandeeImage so the position glides while the pose dissolves.
const POSITION_MORPH_MS = 500;

export function BrandeeWithDesk({
  state,
  transitionFrame = null,
  size = LAYOUT_REFERENCE_WIDTH,
  className,
}: BrandeeWithDeskProps) {
  const layout = resolveLayout(state, transitionFrame);
  const scale  = size / LAYOUT_REFERENCE_WIDTH;

  // Scale layout coords from the reference 420 stage to the actual render size.
  const bodyBottomY = layout.bodyBottomY * scale;
  const bodyX       = layout.bodyX       * scale;

  // Stage height is FIXED for a given `size` — independent of the active
  // layout's bodyBottomY. This prevents the container from resizing during
  // transitions (which would cause layout shift in the parent). Matches the
  // playground stage proportions: width + table height − the shared overlap.
  const tableHeight = Math.round(size * TABLE_RATIO);
  const stageHeight = size + tableHeight - STAGE_TABLE_OVERLAP * scale;

  return (
    <div
      className={`relative ${className ?? ''}`}
      style={{ width: size, height: stageHeight }}
    >
      <Image
        src={frameUrl('table.png')}
        alt=""
        width={size}
        height={tableHeight}
        priority
        draggable={false}
        className={`absolute bottom-0 left-0 right-0 pointer-events-none select-none ${
          layout.behindBase ? 'z-20' : 'z-0'
        }`}
      />
      <div
        className="absolute z-10"
        style={{
          top: bodyBottomY - size,
          left: '50%',
          transform: `translateX(calc(-50% + ${bodyX}px))`,
          // Smoothly morph the body position when the active layout changes
          // (e.g. mid-transition between a state and a transition frame).
          transition: `top ${POSITION_MORPH_MS}ms linear, transform ${POSITION_MORPH_MS}ms linear`,
        }}
      >
        <Brandee state={state} transitionFrame={transitionFrame} size={size} />
      </div>
    </div>
  );
}

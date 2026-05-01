'use client';

import Image from 'next/image';
import type { BrandeeState } from '@/types';
import { Brandee } from './Brandee';
import { frameUrl } from './constants';
import { LAYOUT_REFERENCE_WIDTH, resolveLayout } from './layouts';

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
export function BrandeeWithDesk({
  state,
  transitionFrame = null,
  size = LAYOUT_REFERENCE_WIDTH,
  className,
}: BrandeeWithDeskProps) {
  const layout = resolveLayout(state, transitionFrame);
  const scale  = size / LAYOUT_REFERENCE_WIDTH;

  // Table is bottom-anchored, full width, natural aspect.
  const tableHeight = Math.round(size * TABLE_RATIO);
  // Scale layout coords from the reference 420 stage to the actual render size.
  const bodyBottomY = layout.bodyBottomY * scale;
  const bodyX       = layout.bodyX       * scale;
  // Stage height = enough room for Brandee box + the table beneath, with the
  // table overlapping the bottom of Brandee per the layout.
  const stageHeight = Math.max(bodyBottomY, size) + tableHeight - 30 * scale;

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
        }}
      >
        <Brandee state={state} transitionFrame={transitionFrame} size={size} />
      </div>
    </div>
  );
}

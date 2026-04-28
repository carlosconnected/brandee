'use client';

import { useId, type SVGProps } from 'react';

export function ButterflyIcon(props: SVGProps<SVGSVGElement>) {
  // Unique gradient ID per instance — avoids `<defs>` collisions when the
  // butterfly is rendered in multiple places on the same page.
  const uid      = useId().replace(/:/g, '-');
  const gradId   = `butterfly-${uid}`;
  const gradFill = `url(#${gradId})`;

  return (
    <svg viewBox="0 0 32 32" fill="none" {...props}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <path d="M16 16 C 12 6, 4 6, 3 12 C 2 18, 8 22, 16 16 Z"   fill={gradFill} />
      <path d="M16 16 C 12 22, 4 26, 6 28 C 9 30, 14 24, 16 18 Z" fill={gradFill} opacity="0.85" />
      <path d="M16 16 C 20 6, 28 6, 29 12 C 30 18, 24 22, 16 16 Z" fill={gradFill} />
      <path d="M16 16 C 20 22, 28 26, 26 28 C 23 30, 18 24, 16 18 Z" fill={gradFill} opacity="0.85" />
      <line x1="16" y1="6" x2="16" y2="26" stroke="#1e0d40" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

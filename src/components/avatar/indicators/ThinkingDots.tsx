'use client';

import { motion } from 'framer-motion';

// Speech bubble positioned upper-right of the bun (~200,60 in 280×420 viewbox)
const BUBBLE_CX = 210;
const BUBBLE_CY = 62;
const BUBBLE_RX = 36;
const BUBBLE_RY = 24;

// Connector circles (tail) pointing toward the head
const TAIL = [
  { cx: 188, cy: 82, r: 5 },
  { cx: 178, cy: 96, r: 3.5 },
] as const;

// Dots inside the bubble
const DOTS = [
  { cx: BUBBLE_CX - 14, cy: BUBBLE_CY + 2 },
  { cx: BUBBLE_CX, cy: BUBBLE_CY + 2 },
  { cx: BUBBLE_CX + 14, cy: BUBBLE_CY + 2 },
] as const;

export function ThinkingDots() {
  return (
    <svg viewBox="0 0 280 420" className="absolute inset-0 w-full h-full pointer-events-none">
      {/* Bubble body */}
      <ellipse cx={BUBBLE_CX} cy={BUBBLE_CY} rx={BUBBLE_RX} ry={BUBBLE_RY} fill="#1e1b40" stroke="#a78bfa" strokeWidth="1.8" />
      {/* Tail */}
      {TAIL.map(({ cx, cy, r }, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="#1e1b40" stroke="#a78bfa" strokeWidth="1.4" />
      ))}
      {/* Bouncing dots */}
      {DOTS.map(({ cx, cy }, i) => (
        <motion.circle
          key={i}
          cx={cx}
          cy={cy}
          r={4.5}
          fill="#a78bfa"
          animate={{ y: [0, -7, 0] }}
          transition={{
            duration: 0.65,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.18,
          }}
        />
      ))}
    </svg>
  );
}

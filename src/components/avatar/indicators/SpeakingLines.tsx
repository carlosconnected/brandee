'use client';

import { motion } from 'framer-motion';

// 3 lines fanning out from each corner of the mouth
// Mouth corners: left ≈ (128, 228), right ≈ (152, 228)
const LINES = [
  // left side — fan upward, horizontal, downward
  { x1: 124, y1: 225, x2: 108, y2: 216, delay: 0.00 },
  { x1: 122, y1: 232, x2: 104, y2: 232, delay: 0.14 },
  { x1: 124, y1: 238, x2: 108, y2: 248, delay: 0.28 },
  // right side — mirror
  { x1: 156, y1: 225, x2: 172, y2: 216, delay: 0.07 },
  { x1: 158, y1: 232, x2: 176, y2: 232, delay: 0.21 },
  { x1: 156, y1: 238, x2: 172, y2: 248, delay: 0.35 },
] as const;

export function SpeakingLines() {
  return (
    <svg viewBox="0 0 280 420" className="absolute inset-0 w-full h-full pointer-events-none">
      {LINES.map(({ x1, y1, x2, y2, delay }, i) => (
        <motion.line
          key={i}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#7c3aed"
          strokeWidth="5.2"
          strokeLinecap="round"
          animate={{ opacity: [0.15, 1, 0.15] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut', delay }}
        />
      ))}
    </svg>
  );
}

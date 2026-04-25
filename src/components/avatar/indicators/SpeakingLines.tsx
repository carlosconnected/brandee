'use client';

import { motion } from 'framer-motion';

// Short radiating lines around the head
// All anchored near the face boundary and extending outward
const LINES = [
  // top-right
  { x1: 190, y1: 118, x2: 206, y2: 102, delay: 0 },
  { x1: 205, y1: 140, x2: 224, y2: 130, delay: 0.12 },
  // right
  { x1: 216, y1: 168, x2: 238, y2: 162, delay: 0.06 },
  { x1: 214, y1: 195, x2: 236, y2: 195, delay: 0.18 },
  // bottom-right
  { x1: 205, y1: 218, x2: 222, y2: 230, delay: 0.09 },
  // top-left
  { x1: 90, y1: 118, x2: 74, y2: 102, delay: 0.15 },
  { x1: 75, y1: 140, x2: 56, y2: 130, delay: 0.03 },
  // left
  { x1: 64, y1: 168, x2: 42, y2: 162, delay: 0.21 },
  { x1: 66, y1: 195, x2: 44, y2: 195, delay: 0.09 },
  // bottom-left
  { x1: 75, y1: 218, x2: 58, y2: 230, delay: 0.15 },
] as const;

export function SpeakingLines() {
  return (
    <svg viewBox="0 0 280 420" className="absolute inset-0 w-full h-full pointer-events-none">
      {LINES.map(({ x1, y1, x2, y2, delay }, i) => (
        <motion.line
          key={i}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#f472b6"
          strokeWidth="2.6"
          strokeLinecap="round"
          animate={{ opacity: [0, 1, 0], scale: [0.7, 1.2, 0.7] }}
          style={{ originX: `${x1}px`, originY: `${y1}px` }}
          transition={{
            duration: 0.7,
            repeat: Infinity,
            ease: 'easeOut',
            delay,
          }}
        />
      ))}
    </svg>
  );
}

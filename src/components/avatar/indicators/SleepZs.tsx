'use client';

import { motion } from 'framer-motion';

const ZS = [
  { x: 175, y: 88, size: 16, delay: 0 },
  { x: 190, y: 66, size: 21, delay: 0.85 },
  { x: 202, y: 44, size: 26, delay: 1.7 },
] as const;

export function SleepZs() {
  return (
    <svg viewBox="0 0 280 420" className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
      {ZS.map(({ x, y, size, delay }, i) => (
        <motion.text
          key={i}
          x={x}
          y={y}
          fontSize={size}
          fontWeight="700"
          fill="#a78bfa"
          textAnchor="middle"
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 0.9, 0], y: -32 }}
          transition={{
            duration: 2.6,
            repeat: Infinity,
            ease: 'easeOut',
            delay,
          }}
        >
          Z
        </motion.text>
      ))}
    </svg>
  );
}

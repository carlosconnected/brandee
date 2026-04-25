'use client';

import { motion } from 'framer-motion';

// Each arc is a quadratic bezier creating a ( or ) shape
// Centred at ear-level: roughly y=188 in the 280×420 viewbox
const LEFT_ARCS = [
  { d: 'M 70 173 Q 58 188 70 203', delay: 0 },
  { d: 'M 58 166 Q 42 188 58 210', delay: 0.2 },
  { d: 'M 46 159 Q 26 188 46 217', delay: 0.4 },
] as const;

const RIGHT_ARCS = [
  { d: 'M 210 173 Q 222 188 210 203', delay: 0 },
  { d: 'M 222 166 Q 238 188 222 210', delay: 0.2 },
  { d: 'M 234 159 Q 254 188 234 217', delay: 0.4 },
] as const;

function Arc({ d, delay }: { d: string; delay: number }) {
  return (
    <motion.path
      d={d}
      stroke="#a78bfa"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
      animate={{ opacity: [0.2, 0.85, 0.2], strokeWidth: [1.5, 3, 1.5] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  );
}

export function ListeningWaves() {
  return (
    <svg viewBox="0 0 280 420" className="absolute inset-0 w-full h-full pointer-events-none">
      {LEFT_ARCS.map((a, i) => (
        <Arc key={`l${i}`} {...a} />
      ))}
      {RIGHT_ARCS.map((a, i) => (
        <Arc key={`r${i}`} {...a} />
      ))}
    </svg>
  );
}

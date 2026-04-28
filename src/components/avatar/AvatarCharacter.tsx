'use client';

import { useId } from 'react';

export function AvatarCharacter() {
  // Unique gradient IDs per instance — prevents collisions when multiple
  // AvatarCharacter components render on the same page (e.g. mobile top
  // strip + sidebar). Strip colons since they're not always safe in `url(#…)`.
  const uid       = useId().replace(/:/g, '-');
  const skinId    = `skin-${uid}`;
  const hairId    = `hair-${uid}`;
  const hoodieId  = `hoodie-${uid}`;
  const bgGlowId  = `bg-${uid}`;

  const skinFill   = `url(#${skinId})`;
  const hairFill   = `url(#${hairId})`;
  const hoodieFill = `url(#${hoodieId})`;
  const bgGlowFill = `url(#${bgGlowId})`;

  return (
    <svg
      viewBox="0 0 280 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Brandee avatar"
      className="w-full h-full drop-shadow-2xl"
    >
      <defs>
        <radialGradient id={skinId} cx="48%" cy="38%" r="58%">
          <stop offset="0%" stopColor="#f2c09e" />
          <stop offset="100%" stopColor="#cf7f4e" />
        </radialGradient>
        <radialGradient id={hairId} cx="38%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#3b1f0e" />
          <stop offset="100%" stopColor="#130804" />
        </radialGradient>
        <linearGradient id={hoodieId} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="50%" stopColor="#6d28d9" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
        <radialGradient id={bgGlowId} cx="50%" cy="56%" r="50%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient glow behind character */}
      <ellipse cx="140" cy="265" rx="130" ry="150" fill={bgGlowFill} />

      {/* ── BODY / HOODIE ── */}
      <path
        d="M 0 420 L 0 328 Q 8 298 52 280 Q 88 268 122 263 L 140 260 L 158 263 Q 192 268 228 280 Q 272 298 280 328 L 280 420 Z"
        fill={hoodieFill}
      />
      {/* Hood shoulder curve behind neck */}
      <path
        d="M 108 265 Q 140 257 172 265 Q 176 273 176 282 Q 158 273 140 271 Q 122 273 104 282 Q 104 273 108 265 Z"
        fill="#5b21b6"
        opacity="0.75"
      />
      {/* Center seam */}
      <line x1="140" y1="295" x2="140" y2="410" stroke="#5b21b6" strokeWidth="1.5" opacity="0.55" />
      {/* Kangaroo pocket */}
      <rect x="112" y="348" width="56" height="30" rx="8" fill="#4c1d95" opacity="0.65" />
      {/* brandee wordmark */}
      <text
        x="140"
        y="400"
        textAnchor="middle"
        fontSize="40.5"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontStyle="italic"
        fill="white"
        opacity="0.88"
        letterSpacing="0.5"
      >
        Brandee
      </text>

      {/* ── NECK ── */}
      <rect x="124" y="255" width="32" height="30" rx="7" fill={skinFill} />

      {/* ── HAIR BASE (behind head) ── */}
      <ellipse cx="140" cy="180" rx="80" ry="88" fill={hairFill} />

      {/* ── FACE ── */}
      <ellipse cx="140" cy="190" rx="64" ry="72" fill={skinFill} />

      {/* ── HAIR SIDES overlapping face edges ── */}
      <path
        d="M 62 155 Q 68 240 82 263 Q 73 232 76 172 Q 78 132 92 105 Q 80 130 62 155 Z"
        fill={hairFill}
      />
      <path
        d="M 218 155 Q 212 240 198 263 Q 207 232 204 172 Q 202 132 188 105 Q 200 130 218 155 Z"
        fill={hairFill}
      />

      {/* ── HAIR TOP flowing to bun ── */}
      <path
        d="M 78 140 Q 96 104 128 95 Q 140 91 152 95 Q 184 104 202 140 Q 188 108 168 100 Q 152 93 140 92 Q 128 93 112 100 Q 92 108 78 140 Z"
        fill={hairFill}
      />

      {/* ── HAIR BUN ── */}
      <circle cx="140" cy="96" r="44" fill={hairFill} />
      {/* Bun highlight sheen */}
      <ellipse cx="126" cy="83" rx="19" ry="11" fill="#3b1f0e" opacity="0.38" />
      {/* Bun wrap lines */}
      <path d="M 98 96 Q 140 78 182 96" stroke="#0c0402" strokeWidth="2.2" opacity="0.55" />
      <path d="M 101 107 Q 140 92 179 107" stroke="#0c0402" strokeWidth="1.6" opacity="0.38" />

      {/* ── EARRINGS ── */}
      <circle cx="78" cy="196" r="7.5" stroke="#d4a820" strokeWidth="2.6" />
      <circle cx="202" cy="196" r="7.5" stroke="#d4a820" strokeWidth="2.6" />

      {/* ── EYEBROWS ── */}
      <path
        d="M 99 168 Q 113 159 129 163"
        stroke="#1e0d06"
        strokeWidth="3.8"
        strokeLinecap="round"
      />
      <path
        d="M 151 163 Q 167 159 181 168"
        stroke="#1e0d06"
        strokeWidth="3.8"
        strokeLinecap="round"
      />

      {/* ── LEFT EYE ── */}
      <ellipse cx="113" cy="185" rx="17.5" ry="18.5" fill="white" />
      <ellipse cx="113" cy="186" rx="11.5" ry="12.5" fill="#5c3317" />
      <ellipse cx="113" cy="186" rx="7" ry="8" fill="#110603" />
      <circle cx="117.5" cy="182" r="3.8" fill="white" />
      <circle cx="109.5" cy="190" r="1.6" fill="white" opacity="0.55" />

      {/* Left eyelashes */}
      <line x1="97" y1="178" x2="100" y2="169" stroke="#110603" strokeWidth="1.9" strokeLinecap="round" />
      <line x1="105" y1="173" x2="106" y2="164" stroke="#110603" strokeWidth="1.9" strokeLinecap="round" />
      <line x1="113" y1="171" x2="113" y2="162" stroke="#110603" strokeWidth="1.9" strokeLinecap="round" />
      <line x1="121" y1="172" x2="123" y2="164" stroke="#110603" strokeWidth="1.9" strokeLinecap="round" />
      <line x1="128" y1="177" x2="131" y2="169" stroke="#110603" strokeWidth="1.9" strokeLinecap="round" />

      {/* ── RIGHT EYE ── */}
      <ellipse cx="167" cy="185" rx="17.5" ry="18.5" fill="white" />
      <ellipse cx="167" cy="186" rx="11.5" ry="12.5" fill="#5c3317" />
      <ellipse cx="167" cy="186" rx="7" ry="8" fill="#110603" />
      <circle cx="171.5" cy="182" r="3.8" fill="white" />
      <circle cx="163.5" cy="190" r="1.6" fill="white" opacity="0.55" />

      {/* Right eyelashes */}
      <line x1="152" y1="177" x2="149" y2="169" stroke="#110603" strokeWidth="1.9" strokeLinecap="round" />
      <line x1="159" y1="172" x2="157" y2="164" stroke="#110603" strokeWidth="1.9" strokeLinecap="round" />
      <line x1="167" y1="171" x2="167" y2="162" stroke="#110603" strokeWidth="1.9" strokeLinecap="round" />
      <line x1="175" y1="172" x2="177" y2="164" stroke="#110603" strokeWidth="1.9" strokeLinecap="round" />
      <line x1="183" y1="177" x2="186" y2="169" stroke="#110603" strokeWidth="1.9" strokeLinecap="round" />

      {/* ── NOSE ── */}
      <path d="M 135 212 Q 140 219 145 212" stroke="#b86f3f" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="135.5" cy="211" r="2" fill="#b86f3f" opacity="0.65" />
      <circle cx="144.5" cy="211" r="2" fill="#b86f3f" opacity="0.65" />

      {/* ── MOUTH ── */}
      <path d="M 128 228 Q 134 224 140 225 Q 146 224 152 228" stroke="#a85e35" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M 128 228 Q 140 241 152 228" stroke="#a85e35" strokeWidth="2.2" strokeLinecap="round" />

      {/* ── CHEEKS ── */}
      <ellipse cx="94" cy="218" rx="17" ry="10" fill="#f08070" opacity="0.28" />
      <ellipse cx="186" cy="218" rx="17" ry="10" fill="#f08070" opacity="0.28" />
    </svg>
  );
}

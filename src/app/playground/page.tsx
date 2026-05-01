'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { BrandeeState } from '@/types';
import { Brandee } from '@/components/brandee/Brandee';
import { useBrandeeState } from '@/components/brandee/useBrandeeState';
import {
  frameUrl,
  TIMINGS,
  TRANSITIONS,
  TRANSITION_SEQUENCES,
  transitionKey,
} from '@/components/brandee/constants';

const ALL_STATES: BrandeeState[] = [
  'greeting',
  'idle',
  'bored',
  'sleeping',
  'listening',
  'thinking',
  'speaking',
  'celebrating',
  'confused',
];

// Stage geometry — table.png is 855×636, state PNGs are square (1024×1024).
// Stage height is sized so a 420×420 Brandee box can sit fully above the
// table, with the table pinned at the bottom and its surface meeting
// Brandee's body-bottom around the default Y.
const STAGE_WIDTH  = 420;

const TABLE_RATIO     = 636 / 855;
const TABLE_DISPLAY_H = Math.round(STAGE_WIDTH * TABLE_RATIO); // ~312
const STAGE_HEIGHT    = STAGE_WIDTH + TABLE_DISPLAY_H - 30;     // ~702

// Default Y (stage pixels) where Brandee's body bottom should sit — aligned
// to the desk surface inside table.png so her torso meets the desk top.
const DEFAULT_BODY_BOTTOM_Y = STAGE_WIDTH; // = 420 → Brandee box top at 0

// Default X offset (stage pixels) from the horizontal center of the stage.
// 0 = perfectly centered. Positive moves Brandee right, negative moves left.
const DEFAULT_BODY_X = 0;
const BODY_X_RANGE   = 200; // slider goes from −200 to +200

interface LogEntry {
  id: number;
  at: string;
  from: BrandeeState;
  to: BrandeeState;
  via: 'sequence' | 'single' | 'cross-fade';
  detail: string;
}

interface StateLayout {
  bodyBottomY: number;
  bodyX: number;
  behindBase: boolean;
}

const DEFAULT_LAYOUT: StateLayout = {
  bodyBottomY: DEFAULT_BODY_BOTTOM_Y,
  bodyX:       DEFAULT_BODY_X,
  behindBase:  false,
};

export default function BrandeePlayground() {
  const { state, transitionFrame, setState, reportActivity } = useBrandeeState();
  const [log, setLog] = useState<LogEntry[]>([]);
  const [logCounter, setLogCounter] = useState(0);

  // Per-state layout: where Brandee's body bottom sits + whether she renders
  // behind the desk surface. All states default to the same values; user
  // tunes each state until it composites cleanly with table.png.
  const [layoutByState, setLayoutByState] = useState<Record<BrandeeState, StateLayout>>(
    () =>
      Object.fromEntries(
        ALL_STATES.map((s) => [s, { ...DEFAULT_LAYOUT }])
      ) as Record<BrandeeState, StateLayout>
  );
  const layout = layoutByState[state];

  function updateLayout(patch: Partial<StateLayout>) {
    setLayoutByState((prev) => ({ ...prev, [state]: { ...prev[state], ...patch } }));
  }

  // Track transitions for the debug log
  const [prevState, setPrevState] = useState<BrandeeState>(state);
  useEffect(() => {
    if (state === prevState) return;
    const key = transitionKey(prevState, state);
    const seq = TRANSITION_SEQUENCES[key];
    const single = TRANSITIONS[key];

    let via: LogEntry['via'] = 'cross-fade';
    let detail = 'no transition frame defined — direct cross-fade';
    if (seq) {
      via = 'sequence';
      detail = seq.map((s) => `${s.frame} (${s.hold}ms)`).join(' → ');
    } else if (single) {
      via = 'single';
      detail = `${single} (${TIMINGS.singleTransitionHold}ms hold)`;
    }

    setLog((prev) =>
      [
        {
          id: logCounter,
          at: new Date().toLocaleTimeString(),
          from: prevState,
          to: state,
          via,
          detail,
        },
        ...prev,
      ].slice(0, 12)
    );
    setLogCounter((n) => n + 1);
    setPrevState(state);
  }, [state, prevState, logCounter]);

  // Brandee box is square at STAGE_WIDTH; her body bottom sits at bodyBottomY,
  // which means the box top sits at (bodyBottomY - STAGE_WIDTH).
  const brandeeBoxTop = layout.bodyBottomY - STAGE_WIDTH;

  return (
    <div className="min-h-screen bg-base text-content p-6 lg:p-10">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <header className="flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Brandee Lab</h1>
            <p className="text-muted text-sm mt-1">
              Manually drive the state machine + tune per-state layout. Each
              state stores its own body Y and front/back layer.
            </p>
          </div>
          <a
            href="/"
            className="text-sm text-muted hover:text-content underline underline-offset-4 cursor-pointer"
          >
            ← back to chat
          </a>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
          {/* Avatar stage */}
          <section className="bg-panel border border-divider rounded-2xl p-8 flex flex-col items-center gap-6 relative overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse 70% 50% at 50% 75%, rgba(124,58,237,0.18) 0%, transparent 100%)',
              }}
            />

            <div className="relative z-10 flex flex-col items-center gap-4">
              {/*
                Tall stage so Brandee (square upper body, 1024×1024) and
                table.png (855×636, just the desk surface) can stack with
                proper overlap at the desk-top line.
              */}
              <div
                className="relative"
                style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT }}
              >
                {/* table.png — pinned to bottom, natural aspect ratio */}
                <Image
                  src={frameUrl('table.png')}
                  alt="Desk"
                  width={STAGE_WIDTH}
                  height={TABLE_DISPLAY_H}
                  priority
                  draggable={false}
                  className={`absolute bottom-0 left-0 right-0 pointer-events-none select-none ${
                    layout.behindBase ? 'z-20' : 'z-0'
                  }`}
                />

                {/* Brandee — positioned so her body bottom sits at bodyBottomY,
                    centered horizontally with optional bodyX offset. */}
                <div
                  className="absolute z-10"
                  style={{
                    top: brandeeBoxTop,
                    left: '50%',
                    transform: `translateX(calc(-50% + ${layout.bodyX}px))`,
                  }}
                >
                  <Brandee
                    state={state}
                    transitionFrame={transitionFrame}
                    size={STAGE_WIDTH}
                  />
                </div>

                {/* Reference line at body-bottom Y */}
                <div
                  className="absolute z-30 left-0 right-0 border-t border-dashed border-brand-light/30 pointer-events-none"
                  style={{ top: layout.bodyBottomY }}
                />
              </div>

              <div className="flex flex-col items-center gap-1">
                <p className="text-xs uppercase tracking-wider text-muted">Current state</p>
                <p className="text-2xl font-bold text-content">{state}</p>
                {transitionFrame && (
                  <p className="text-xs text-brand-light font-mono mt-1">
                    transitioning · {transitionFrame}
                  </p>
                )}
              </div>
            </div>
          </section>

          <aside className="flex flex-col gap-6">
            {/* Layer toggle */}
            <section>
              <h2 className="text-xs uppercase tracking-wider text-muted mb-3">
                Brandee layer · <span className="text-content normal-case capitalize">{state}</span>
              </h2>
              <div className="flex bg-card rounded-lg p-1 border border-divider">
                <button
                  type="button"
                  onClick={() => updateLayout({ behindBase: false })}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                    !layout.behindBase ? 'bg-brand text-white' : 'text-muted hover:text-content'
                  }`}
                >
                  In front of desk
                </button>
                <button
                  type="button"
                  onClick={() => updateLayout({ behindBase: true })}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                    layout.behindBase ? 'bg-brand text-white' : 'text-muted hover:text-content'
                  }`}
                >
                  Behind desk
                </button>
              </div>
            </section>

            {/* Body Y position slider */}
            <section>
              <div className="flex items-baseline justify-between mb-2">
                <h2 className="text-xs uppercase tracking-wider text-muted">
                  Body bottom Y
                </h2>
                <span className="text-xs font-mono text-content">
                  {layout.bodyBottomY}px
                </span>
              </div>
              <input
                type="range"
                min={STAGE_WIDTH}
                max={STAGE_HEIGHT}
                step={1}
                value={layout.bodyBottomY}
                onChange={(e) => updateLayout({ bodyBottomY: Number(e.target.value) })}
                className="w-full accent-brand cursor-pointer"
              />
              <p className="text-[11px] text-dim mt-2 leading-relaxed">
                Where Brandee&apos;s body-bottom edge sits in the stage. Tune
                until her torso/arms meet the desk top cleanly. Dashed line
                in the stage shows the current Y.
              </p>
              <button
                type="button"
                onClick={() => updateLayout({ bodyBottomY: DEFAULT_BODY_BOTTOM_Y })}
                className="text-[11px] text-muted hover:text-content underline underline-offset-2 mt-1 cursor-pointer"
              >
                reset to default ({DEFAULT_BODY_BOTTOM_Y})
              </button>
            </section>

            {/* Body X position slider */}
            <section>
              <div className="flex items-baseline justify-between mb-2">
                <h2 className="text-xs uppercase tracking-wider text-muted">
                  Body X offset
                </h2>
                <span className="text-xs font-mono text-content">
                  {layout.bodyX > 0 ? `+${layout.bodyX}` : layout.bodyX}px
                </span>
              </div>
              <input
                type="range"
                min={-BODY_X_RANGE}
                max={BODY_X_RANGE}
                step={1}
                value={layout.bodyX}
                onChange={(e) => updateLayout({ bodyX: Number(e.target.value) })}
                className="w-full accent-brand cursor-pointer"
              />
              <p className="text-[11px] text-dim mt-2 leading-relaxed">
                Horizontal offset from the stage center. Negative = left,
                positive = right. Useful when a pose&apos;s asymmetric body
                weight needs to nudge sideways to sit cleanly on the desk.
              </p>
              <button
                type="button"
                onClick={() => updateLayout({ bodyX: DEFAULT_BODY_X })}
                className="text-[11px] text-muted hover:text-content underline underline-offset-2 mt-1 cursor-pointer"
              >
                reset to center (0)
              </button>
            </section>

            {/* States grid */}
            <section>
              <h2 className="text-xs uppercase tracking-wider text-muted mb-3">States</h2>
              <div className="grid grid-cols-2 gap-2">
                {ALL_STATES.map((s) => {
                  const active = state === s;
                  const key = transitionKey(state, s);
                  const hasTransition = !!TRANSITIONS[key] || !!TRANSITION_SEQUENCES[key];
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setState(s)}
                      className={`
                        relative px-3 py-3 rounded-lg text-sm font-medium
                        border transition-colors cursor-pointer text-left
                        ${active
                          ? 'bg-brand text-white border-brand'
                          : 'bg-card text-content border-divider hover:border-divider-strong'
                        }
                      `}
                    >
                      <span className="capitalize">{s}</span>
                      {layoutByState[s].behindBase && (
                        <span
                          title="This state renders behind the desk"
                          className="absolute bottom-2 right-2 text-[9px] uppercase tracking-wider text-brand-light font-mono"
                        >
                          behind
                        </span>
                      )}
                      {hasTransition && !active && (
                        <span
                          title="A transition frame is defined for this hop"
                          className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-brand-light"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-dim mt-2 leading-relaxed">
                Top-right dot = a transition frame is defined for going from
                the current state to this one. Bottom-right &ldquo;behind&rdquo;
                = that state renders behind the desk.
              </p>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-wider text-muted mb-3">Actions</h2>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={reportActivity}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium border border-divider bg-card text-content hover:border-divider-strong cursor-pointer text-left"
                >
                  reportActivity()
                  <span className="block text-[11px] text-muted font-normal mt-0.5">
                    Wakes from sleeping/bored, resets idle escalation timer
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cfg = ALL_STATES
                      .map((s) => {
                        const l = layoutByState[s];
                        return `  ${s}: { bodyBottomY: ${l.bodyBottomY}, bodyX: ${l.bodyX}, behindBase: ${l.behindBase} },`;
                      })
                      .join('\n');
                    navigator.clipboard.writeText(`{\n${cfg}\n}`);
                  }}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium border border-divider bg-card text-content hover:border-divider-strong cursor-pointer text-left"
                >
                  Copy layout config
                  <span className="block text-[11px] text-muted font-normal mt-0.5">
                    Copies a record of all 9 states&apos; layout to clipboard
                  </span>
                </button>
              </div>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-wider text-muted mb-3">
                Recent transitions
              </h2>
              <div className="bg-card border border-divider rounded-lg max-h-72 overflow-y-auto">
                {log.length === 0 ? (
                  <p className="text-xs text-muted p-3">
                    Click a state button to see the transition log.
                  </p>
                ) : (
                  <ul className="divide-y divide-divider">
                    {log.map((entry) => (
                      <li key={entry.id} className="p-3 text-xs flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-content">
                            {entry.from} → {entry.to}
                          </span>
                          <span className="text-dim">{entry.at}</span>
                        </div>
                        <span
                          className={`text-[11px] ${
                            entry.via === 'sequence'
                              ? 'text-brand-light'
                              : entry.via === 'single'
                                ? 'text-content'
                                : 'text-muted'
                          }`}
                        >
                          {entry.via}: {entry.detail}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

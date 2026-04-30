'use client';

import { useEffect, useState } from 'react';
import type { BrandeeState } from '@/types';
import { Brandee } from '@/components/brandee/Brandee';
import { useBrandeeState } from '@/components/brandee/useBrandeeState';
import {
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

interface LogEntry {
  id: number;
  at: string;
  from: BrandeeState;
  to: BrandeeState;
  via: 'sequence' | 'single' | 'cross-fade';
  detail: string;
}

export default function BrandeePlayground() {
  const { state, transitionFrame, setState, reportActivity } = useBrandeeState();
  const [log, setLog] = useState<LogEntry[]>([]);
  const [logCounter, setLogCounter] = useState(0);

  // Track transitions whenever the state changes for the debug log.
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
      detail = `${single} (200ms hold)`;
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

  return (
    <div className="min-h-screen bg-base text-content p-6 lg:p-10">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <header className="flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Brandee Lab</h1>
            <p className="text-muted text-sm mt-1">
              Manually drive the state machine. Click a state to trigger any
              defined transition; everything else falls back to cross-fade.
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
                  'radial-gradient(ellipse 70% 60% at 50% 55%, rgba(124,58,237,0.18) 0%, transparent 100%)',
              }}
            />
            <div className="relative z-10 flex flex-col items-center gap-4">
              <Brandee state={state} transitionFrame={transitionFrame} size={420} />

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

          {/* Controls */}
          <aside className="flex flex-col gap-6">
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
                Dot = a transition frame is defined for going from the current
                state to this one. No dot = direct cross-fade.
              </p>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-wider text-muted mb-3">Actions</h2>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={reportActivity}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium border border-divider bg-card text-content hover:border-divider-strong cursor-pointer"
                >
                  reportActivity()
                  <span className="block text-[11px] text-muted font-normal mt-0.5">
                    Wakes from sleeping/bored, resets idle escalation timer
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

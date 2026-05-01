"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { BrandeeState } from "@/types";
import { Brandee } from "@/components/brandee/Brandee";
import { useBrandeeState } from "@/components/brandee/useBrandeeState";
import {
  frameUrl,
  TIMINGS,
  TRANSITIONS,
  TRANSITION_SEQUENCES,
  transitionKey,
} from "@/components/brandee/constants";
import {
  DEFAULT_LAYOUT as DEFAULT_LAYOUT_FROM_FILE,
  FRAME_LAYOUTS,
  STATE_LAYOUTS,
  type AssetLayout as PersistedAssetLayout,
} from "@/components/brandee/layouts";

const ALL_STATES: BrandeeState[] = [
  "greeting",
  "idle",
  "bored",
  "sleeping",
  "listening",
  "thinking",
  "speaking",
  "celebrating",
  "confused",
];

// Stage geometry — table.png is 855×636, state PNGs are square (1024×1024).
const STAGE_WIDTH = 420;

const TABLE_RATIO = 636 / 855;
const TABLE_DISPLAY_H = Math.round(STAGE_WIDTH * TABLE_RATIO); // ~312
const STAGE_HEIGHT = STAGE_WIDTH + TABLE_DISPLAY_H - 10; // ~702

const DEFAULT_BODY_BOTTOM_Y = STAGE_WIDTH; // 420 → Brandee box top at 0
const DEFAULT_BODY_X = 0;
const BODY_X_RANGE = 200;

interface LogEntry {
  id: number;
  at: string;
  from: BrandeeState;
  to: BrandeeState;
  via: "sequence" | "single" | "cross-fade";
  detail: string;
}

type AssetLayout = PersistedAssetLayout;
const DEFAULT_LAYOUT: AssetLayout = DEFAULT_LAYOUT_FROM_FILE;

export default function BrandeePlayground() {
  const { state, transitionFrame, setState, reportActivity } =
    useBrandeeState({ disableAutoTransitions: true });
  const [log, setLog] = useState<LogEntry[]>([]);
  const [logCounter, setLogCounter] = useState(0);

  // All unique transition asset filenames — single-frame transitions plus
  // every frame referenced inside a multi-frame sequence, deduped + sorted.
  const ALL_TRANSITION_FRAMES = useMemo(() => {
    const single = Object.values(TRANSITIONS);
    const seq = Object.values(TRANSITION_SEQUENCES)
      .flat()
      .map((s) => s.frame);
    return Array.from(new Set([...single, ...seq])).sort();
  }, []);

  // Per-state layouts (the 9 main states). Pre-populated from the committed
  // values in `layouts.ts` so the playground reflects what the app currently
  // ships — tune here, copy back to the file.
  const [layoutByState, setLayoutByState] = useState<
    Record<BrandeeState, AssetLayout>
  >(
    () =>
      Object.fromEntries(
        ALL_STATES.map((s) => [
          s,
          { ...(STATE_LAYOUTS[s] ?? DEFAULT_LAYOUT) },
        ]),
      ) as Record<BrandeeState, AssetLayout>,
  );

  // Per-transition-frame layouts (keyed by filename). Also seeded from the
  // committed values in `layouts.ts`.
  const [layoutByFrame, setLayoutByFrame] = useState<
    Record<string, AssetLayout>
  >(() =>
    Object.fromEntries(
      ALL_TRANSITION_FRAMES.map((f) => [
        f,
        { ...(FRAME_LAYOUTS[f] ?? DEFAULT_LAYOUT) },
      ]),
    ),
  );

  // When a transition frame is "pinned", the playground freezes on that frame
  // for tuning. Sliders edit the frame's layout instead of the state's.
  const [pinnedFrame, setPinnedFrame] = useState<string | null>(null);

  // The active layout follows priority:
  //   1. pinned transition frame (manual inspect mode)
  //   2. live transition frame from the state machine (auto-transition in flight)
  //   3. current state
  // The first two read from layoutByFrame; the third reads from layoutByState.
  const liveFrame = pinnedFrame ?? transitionFrame;
  const layout: AssetLayout = liveFrame
    ? (layoutByFrame[liveFrame] ?? DEFAULT_LAYOUT)
    : layoutByState[state];

  // Slider edits target either a frame or a state, depending on what's active.
  function updateLayout(patch: Partial<AssetLayout>) {
    if (pinnedFrame) {
      setLayoutByFrame((prev) => ({
        ...prev,
        [pinnedFrame]: { ...(prev[pinnedFrame] ?? DEFAULT_LAYOUT), ...patch },
      }));
    } else {
      setLayoutByState((prev) => ({
        ...prev,
        [state]: { ...prev[state], ...patch },
      }));
    }
  }

  // Track transitions for the debug log
  const [prevState, setPrevState] = useState<BrandeeState>(state);
  useEffect(() => {
    if (state === prevState) return;
    const key = transitionKey(prevState, state);
    const seq = TRANSITION_SEQUENCES[key];
    const single = TRANSITIONS[key];

    let via: LogEntry["via"] = "cross-fade";
    let detail = "no transition frame defined — direct cross-fade";
    if (seq) {
      via = "sequence";
      detail = seq.map((s) => `${s.frame} (${s.hold}ms)`).join(" → ");
    } else if (single) {
      via = "single";
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
      ].slice(0, 12),
    );
    setLogCounter((n) => n + 1);
    setPrevState(state);
  }, [state, prevState, logCounter]);

  const brandeeBoxTop = layout.bodyBottomY - STAGE_WIDTH;

  const isPinned = pinnedFrame !== null;
  const editingLabel = pinnedFrame ?? state;

  return (
    <div className="min-h-screen bg-base text-content p-6 lg:p-10">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <header className="flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Brandee Lab</h1>
            <p className="text-muted text-sm mt-1">
              Drive the state machine, pin transition frames, and tune per-asset
              layout (Y, X, front/behind desk) for each state and every
              transition image.
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
                  "radial-gradient(ellipse 70% 50% at 50% 75%, rgba(124,58,237,0.18) 0%, transparent 100%)",
              }}
            />

            <div className="relative z-10 flex flex-col items-center gap-4">
              <div
                className="relative"
                style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT }}
              >
                {/* table.png — pinned to bottom, natural aspect ratio */}
                <Image
                  src={frameUrl("table.png")}
                  alt="Desk"
                  width={STAGE_WIDTH}
                  height={TABLE_DISPLAY_H}
                  priority
                  draggable={false}
                  className={`absolute bottom-0 left-0 right-0 pointer-events-none select-none ${
                    layout.behindBase ? "z-20" : "z-0"
                  }`}
                />

                {/* Brandee — positioned by the active layout */}
                <div
                  className="absolute z-10"
                  style={{
                    top: brandeeBoxTop,
                    left: "50%",
                    transform: `translateX(calc(-50% + ${layout.bodyX}px))`,
                  }}
                >
                  <Brandee
                    state={state}
                    transitionFrame={liveFrame}
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
                <p className="text-xs uppercase tracking-wider text-muted">
                  {isPinned ? "Pinned frame" : "Current state"}
                </p>
                <p className="text-2xl font-bold text-content">
                  {editingLabel}
                </p>
                {!isPinned && transitionFrame && (
                  <p className="text-xs text-brand-light font-mono mt-1">
                    transitioning · {transitionFrame}
                  </p>
                )}
              </div>
            </div>
          </section>

          <aside className="flex flex-col gap-6">
            {/* What's being edited */}
            <section className="bg-card border border-divider rounded-lg p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted">
                Editing
              </p>
              <p className="text-sm font-mono text-content mt-0.5 truncate">
                {isPinned ? editingLabel : `state: ${editingLabel}`}
              </p>
              {isPinned && (
                <button
                  type="button"
                  onClick={() => setPinnedFrame(null)}
                  className="text-[11px] text-brand-light hover:text-content underline underline-offset-2 mt-2 cursor-pointer"
                >
                  ← unpin and return to state machine
                </button>
              )}
            </section>

            {/* Layer toggle */}
            <section>
              <h2 className="text-xs uppercase tracking-wider text-muted mb-3">
                Layer
              </h2>
              <div className="flex bg-card rounded-lg p-1 border border-divider">
                <button
                  type="button"
                  onClick={() => updateLayout({ behindBase: false })}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                    !layout.behindBase
                      ? "bg-brand text-white"
                      : "text-muted hover:text-content"
                  }`}
                >
                  In front of desk
                </button>
                <button
                  type="button"
                  onClick={() => updateLayout({ behindBase: true })}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                    layout.behindBase
                      ? "bg-brand text-white"
                      : "text-muted hover:text-content"
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
                onChange={(e) =>
                  updateLayout({ bodyBottomY: Number(e.target.value) })
                }
                className="w-full accent-brand cursor-pointer"
              />
              <button
                type="button"
                onClick={() =>
                  updateLayout({ bodyBottomY: DEFAULT_BODY_BOTTOM_Y })
                }
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
                onChange={(e) =>
                  updateLayout({ bodyX: Number(e.target.value) })
                }
                className="w-full accent-brand cursor-pointer"
              />
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
              <h2 className="text-xs uppercase tracking-wider text-muted mb-3">
                States
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {ALL_STATES.map((s) => {
                  const active = state === s && !isPinned;
                  const key = transitionKey(state, s);
                  const hasTransition =
                    !!TRANSITIONS[key] || !!TRANSITION_SEQUENCES[key];
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setPinnedFrame(null);
                        setState(s);
                      }}
                      className={`
                        relative px-3 py-3 rounded-lg text-sm font-medium
                        border transition-colors cursor-pointer text-left
                        ${
                          active
                            ? "bg-brand text-white border-brand"
                            : "bg-card text-content border-divider hover:border-divider-strong"
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
            </section>

            {/* Transition frames — pin to inspect/tune */}
            <section>
              <h2 className="text-xs uppercase tracking-wider text-muted mb-3">
                Transition frames
              </h2>
              <p className="text-[11px] text-dim mb-2 leading-relaxed">
                Pin a frame to freeze the avatar on that pose so you can tune
                its Y, X and layer. Click again (or any state button) to unpin.
              </p>
              <div className="flex flex-col gap-1">
                {ALL_TRANSITION_FRAMES.map((f) => {
                  const active = pinnedFrame === f;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setPinnedFrame(active ? null : f)}
                      className={`
                        relative px-3 py-2 rounded-lg text-xs font-mono
                        border transition-colors cursor-pointer text-left
                        ${
                          active
                            ? "bg-brand text-white border-brand"
                            : "bg-card text-content border-divider hover:border-divider-strong"
                        }
                      `}
                    >
                      {f}
                      {layoutByFrame[f]?.behindBase && (
                        <span
                          title="Configured to render behind the desk"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] uppercase tracking-wider text-brand-light"
                        >
                          behind
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <h2 className="text-xs uppercase tracking-wider text-muted mb-3">
                Actions
              </h2>
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
                    const fmt = (l: AssetLayout) =>
                      `{ bodyBottomY: ${l.bodyBottomY}, bodyX: ${l.bodyX}, behindBase: ${l.behindBase} }`;

                    const stateKeyW = Math.max(...ALL_STATES.map((s) => s.length));
                    const frameKeyW = Math.max(
                      ...ALL_TRANSITION_FRAMES.map((f) => f.length + 2),
                    );

                    const stateLines = ALL_STATES.map((s) => {
                      const key = `${s}:`.padEnd(stateKeyW + 1);
                      return `  ${key} ${fmt(layoutByState[s])},`;
                    }).join("\n");

                    const frameLines = ALL_TRANSITION_FRAMES.map((f) => {
                      const key = `'${f}':`.padEnd(frameKeyW + 1);
                      const l = layoutByFrame[f] ?? DEFAULT_LAYOUT;
                      return `  ${key} ${fmt(l)},`;
                    }).join("\n");

                    const out =
                      `export const STATE_LAYOUTS: Record<BrandeeState, AssetLayout> = {\n${stateLines}\n};\n\n` +
                      `export const FRAME_LAYOUTS: Record<string, AssetLayout> = {\n${frameLines}\n};\n`;

                    navigator.clipboard.writeText(out);
                  }}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium border border-divider bg-card text-content hover:border-divider-strong cursor-pointer text-left"
                >
                  Copy layouts.ts blocks
                  <span className="block text-[11px] text-muted font-normal mt-0.5">
                    Paste-ready TS to replace STATE_LAYOUTS + FRAME_LAYOUTS in
                    src/components/brandee/layouts.ts
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
                      <li
                        key={entry.id}
                        className="p-3 text-xs flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-content">
                            {entry.from} → {entry.to}
                          </span>
                          <span className="text-dim">{entry.at}</span>
                        </div>
                        <span
                          className={`text-[11px] ${
                            entry.via === "sequence"
                              ? "text-brand-light"
                              : entry.via === "single"
                                ? "text-content"
                                : "text-muted"
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

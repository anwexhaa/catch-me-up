"use client";

import { useMemo, useState } from "react";
import { History, ListOrdered, Radio, SlidersHorizontal, X } from "lucide-react";
import { MATCH, TEAMS, stateAt } from "@/lib/match";
import { useReplayClock } from "./useReplayClock";
import { DemoControls, JUMP_POINTS } from "./DemoControls";
import { ScoreHeader } from "./ScoreHeader";
import { MomentumChart } from "./MomentumChart";
import { BallFeed } from "./BallFeed";
import { Scorecard } from "./Scorecard";
import { TeamBadge } from "./ui";

type Tab = "live" | "scorecard";

const DEFAULT_JOIN = JUMP_POINTS[3];

export function CatchMeUpApp() {
  const clock = useReplayClock(DEFAULT_JOIN.n);
  const s = useMemo(() => stateAt(clock.ball), [clock.ball]);
  const [joined, setJoined] = useState(false);
  const [tab, setTab] = useState<Tab>("live");
  const [demoOpen, setDemoOpen] = useState(false);

  const join = () => {
    setJoined(true);
    clock.seek(DEFAULT_JOIN.n, { play: true });
  };

  const controls = (
    <DemoControls
      ball={clock.ball}
      playing={clock.playing}
      speed={clock.speed}
      onPlay={clock.play}
      onPause={clock.pause}
      onSpeed={clock.setSpeed}
      onSeek={(n) => clock.seek(n)}
    />
  );

  return (
    <main className="min-h-dvh lg:flex lg:items-start lg:justify-center lg:gap-8 lg:px-6 lg:py-6">
      <section className="relative flex h-dvh w-full flex-col overflow-hidden bg-bg lg:h-[min(880px,calc(100dvh-48px))] lg:w-[420px] lg:rounded-[28px] lg:border lg:border-line lg:shadow-2xl lg:shadow-black/50">
        <header className="flex items-center gap-2 border-b border-line bg-bg/95 px-4 py-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-black">
            <History size={16} strokeWidth={2.5} />
          </span>
          <span className="font-semibold tracking-tight">Catch Me Up</span>
          {joined && (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-accent">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent" /> LIVE
            </span>
          )}
          <button
            type="button"
            onClick={() => setDemoOpen(true)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-muted hover:text-text lg:hidden"
          >
            <SlidersHorizontal size={13} /> Demo
          </button>
        </header>

        {!joined ? (
          <JoinScreen onJoin={join} />
        ) : (
          <>
            <div className="scroll-thin flex-1 space-y-3 overflow-y-auto p-3">
              {tab === "live" && (
                <>
                  <ScoreHeader s={s} />
                  <MomentumChart n={s.n} />
                  <BallFeed n={s.n} />
                </>
              )}
              {tab === "scorecard" && <Scorecard s={s} />}
              <p className="px-2 pb-2 pt-1 text-center text-[10px] text-muted/70">Ball-by-ball data: {MATCH.source}</p>
            </div>

            <nav className="grid grid-cols-2 border-t border-line bg-bg">
              {(
                [
                  ["live", "Live", Radio],
                  ["scorecard", "Scorecard", ListOrdered],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] ${tab === id ? "text-text" : "text-muted"}`}
                  aria-current={tab === id ? "page" : undefined}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </nav>
          </>
        )}

        {demoOpen && (
          <div className="absolute inset-0 z-20 flex flex-col justify-end bg-black/60 lg:hidden" onClick={() => setDemoOpen(false)}>
            <div className="rise-in rounded-t-3xl border-t border-line bg-surface p-5" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => setDemoOpen(false)} className="float-right text-muted" aria-label="Close demo controls">
                <X size={18} />
              </button>
              {controls}
            </div>
          </div>
        )}
      </section>

      <aside className="hidden w-[340px] shrink-0 space-y-4 lg:block">
        <div className="rounded-2xl border border-line bg-surface p-5">{controls}</div>
      </aside>
    </main>
  );
}

function JoinScreen({ onJoin }: { onJoin: () => void }) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold leading-tight tracking-tight">Can&apos;t watch every ball? We&apos;ve got you.</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Follow the match in bursts. When you come back, get a short, personal recap of what you missed, in your language.
        </p>
      </div>
      <div className="rounded-2xl border border-line bg-surface p-4">
        <p className="text-[11px] uppercase tracking-wider text-muted">{MATCH.event}</p>
        <div className="mt-3 flex items-center gap-3">
          <TeamBadge team={TEAMS[0]} />
          <span className="text-sm">{TEAMS[0]}</span>
          <span className="mx-auto text-xs text-muted">vs</span>
          <span className="text-sm">{TEAMS[1]}</span>
          <TeamBadge team={TEAMS[1]} />
        </div>
        <p className="mt-3 text-xs text-muted">You&apos;re joining during {DEFAULT_JOIN.joinText}.</p>
      </div>
      <button type="button" onClick={onJoin} className="rounded-xl bg-accent py-3 font-semibold text-black hover:opacity-90">
        Join the live match
      </button>
    </div>
  );
}

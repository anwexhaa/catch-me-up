"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Coffee, History, ListOrdered, Radio, SlidersHorizontal, X } from "lucide-react";
import { MATCH, OVERS, overIndexAt, skipOvers, stateAt } from "@/lib/match";
import { languageOf, type Profile } from "@/lib/profile";
import { useReplayClock } from "./useReplayClock";
import { useSavedProfile } from "./browser";
import { DemoControls, JUMP_POINTS } from "./DemoControls";
import { Onboarding } from "./Onboarding";
import { CatchUpPanel, type Gap } from "./CatchUpPanel";
import { ScoreHeader } from "./ScoreHeader";
import { MomentumChart } from "./MomentumChart";
import { BallFeed } from "./BallFeed";
import { Scorecard } from "./Scorecard";
import { TeamBadge } from "./ui";

type Tab = "live" | "scorecard";

const DEFAULT_JOIN = JUMP_POINTS[3];
const MIN_AWAY_BALLS = 6; // roughly an over; anything shorter isn't worth a recap
const STEP_AWAY_MS = 1600;

export function CatchMeUpApp() {
  const clock = useReplayClock(DEFAULT_JOIN.n);
  const s = useMemo(() => stateAt(clock.ball), [clock.ball]);
  const [savedProfile, saveProfile] = useSavedProfile();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [tab, setTab] = useState<Tab>("live");
  const [demoOpen, setDemoOpen] = useState(false);
  const [gap, setGap] = useState<Gap | null>(null);
  const [stepping, setStepping] = useState<number | null>(null);
  const awayFrom = useRef<number | null>(null);
  const gapIds = useRef(0);

  const openGap = (from: number, to: number, via: Gap["via"]) => {
    gapIds.current += 1;
    setGap({ from, to, via, id: gapIds.current });
    setTab("live");
  };

  // Notice when the fan leaves the tab and comes back, like a real second screen would.
  const { currentBall } = clock;
  useEffect(() => {
    if (!profile) return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        awayFrom.current = currentBall();
        return;
      }
      const from = awayFrom.current;
      awayFrom.current = null;
      const to = currentBall();
      if (from !== null && to - from >= MIN_AWAY_BALLS) {
        gapIds.current += 1;
        setGap({ from, to, via: "away", id: gapIds.current });
        setTab("live");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [profile, currentBall]);

  const join = (p: Profile) => {
    saveProfile(p);
    setProfile(p);
    if (editingProfile) {
      setEditingProfile(false);
      return;
    }
    clock.seek(DEFAULT_JOIN.n, { play: true });
    if (DEFAULT_JOIN.n > 0) openGap(0, DEFAULT_JOIN.n, "joined-late");
  };

  const stepAway = (overs: number) => {
    const from = clock.currentBall();
    const to = skipOvers(from, overs);
    if (to <= from || stepping !== null) return;
    setDemoOpen(false);
    setStepping(overs);
    setTimeout(() => {
      clock.seek(to);
      setStepping(null);
      openGap(from, to, "away");
    }, STEP_AWAY_MS);
  };

  const recapLast = (overs: number) => {
    const to = clock.currentBall();
    const k = overIndexAt(to);
    const from = OVERS[Math.max(0, k - overs + (to >= OVERS[k].endN ? 1 : 0))].startN;
    if (to > from) openGap(from, to, "manual");
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
    >
      {profile && (
        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">Simulate stepping away</p>
          <div className="grid grid-cols-3 gap-1.5">
            {[2, 3, 5].map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => stepAway(k)}
                disabled={clock.ball >= MATCH.deliveries.length}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-accent/40 bg-accent/10 py-2 text-xs font-medium text-accent hover:bg-accent/20 disabled:opacity-40"
              >
                <Coffee size={13} /> {k} overs
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted">
            The match keeps going while you&apos;re gone. You can also switch to another browser tab for a while: the app
            notices when you come back.
          </p>
        </div>
      )}
    </DemoControls>
  );

  const showOnboarding = !profile || editingProfile;

  return (
    <main className="min-h-dvh lg:flex lg:items-start lg:justify-center lg:gap-8 lg:px-6 lg:py-6">
      <section className="relative flex h-dvh w-full flex-col overflow-hidden bg-bg lg:h-[min(880px,calc(100dvh-48px))] lg:w-[420px] lg:rounded-[28px] lg:border lg:border-line lg:shadow-2xl lg:shadow-black/50">
        <header className="flex items-center gap-2 border-b border-line bg-bg/95 px-4 py-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-black">
            <History size={16} strokeWidth={2.5} />
          </span>
          <span className="font-semibold tracking-tight">Catch Me Up</span>
          {profile && (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-accent">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent" /> LIVE
            </span>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            {profile && !editingProfile && (
              <button
                type="button"
                onClick={() => setEditingProfile(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-line py-0.5 pl-0.5 pr-2.5 text-xs text-muted hover:text-text"
                aria-label="Edit your preferences"
              >
                {profile.team ? <TeamBadge team={profile.team} size="sm" /> : <span className="px-1.5">Neutral</span>}
                {languageOf(profile.language).native}
              </button>
            )}
            <button
              type="button"
              onClick={() => setDemoOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-muted hover:text-text lg:hidden"
            >
              <SlidersHorizontal size={13} /> Demo
            </button>
          </div>
        </header>

        {showOnboarding || !profile ? (
          <Onboarding
            key={savedProfile ? JSON.stringify(savedProfile) : "new"}
            initial={profile ?? savedProfile}
            joinText={profile ? undefined : DEFAULT_JOIN.joinText}
            submitLabel={profile ? "Save preferences" : "Join the live match"}
            onDone={join}
          />
        ) : (
          <>
            <div className="scroll-thin flex-1 space-y-3 overflow-y-auto p-3">
              {tab === "live" && (
                <>
                  {gap && <CatchUpPanel key={gap.id} gap={gap} profile={profile} onDismiss={() => setGap(null)} />}
                  <ScoreHeader s={s} />
                  {!gap && s.n > 0 && (
                    <div className="flex items-center gap-2 px-1 text-xs text-muted">
                      <span>Missed something? Recap the last</span>
                      {[1, 3, 5].map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => recapLast(k)}
                          className="rounded-full border border-line px-2 py-0.5 hover:border-text/40 hover:text-text"
                        >
                          {k} over{k > 1 ? "s" : ""}
                        </button>
                      ))}
                    </div>
                  )}
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

        {stepping !== null && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-bg/95 p-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Coffee size={26} />
            </span>
            <div>
              <p className="text-lg font-semibold">You stepped away…</p>
              <p className="mt-1 text-sm text-muted">
                {stepping} overs later (about {stepping * 4} minutes of real match time)
              </p>
            </div>
            <div className="h-1 w-48 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full bg-accent" style={{ animation: `grow ${STEP_AWAY_MS}ms linear forwards` }} />
            </div>
            <style>{`@keyframes grow { from { width: 0 } to { width: 100% } }`}</style>
          </div>
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

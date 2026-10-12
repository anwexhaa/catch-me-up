"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Coffee, History, ListOrdered, MessageCircle, Radio, SlidersHorizontal, X } from "lucide-react";
import { MATCH, OVERS, TEAMS, overIndexAt, skipOvers, stateAt } from "@/lib/match";
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
import { AskPanel, type ChatMessage } from "./AskPanel";
import { TeamBadge } from "./ui";
import { AboutCard } from "./AboutCard";

type Tab = "live" | "ask" | "scorecard";

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [asking, setAsking] = useState(false);
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

  const ask = async (text: string) => {
    if (!profile || asking) return;
    const at = clock.currentBall();
    const thread: ChatMessage[] = [...messages, { role: "user", text, at }];
    setMessages(thread);
    setAsking(true);
    setTab("ask");
    let reply: ChatMessage = { role: "model", text: "Sorry, I couldn't answer that just now. Please try again.", at, source: "fallback" };
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ at, profile, messages: thread.map(({ role, text }) => ({ role, text })) }),
      });
      if (res.ok) {
        const data = await res.json();
        reply = { role: "model", text: data.answer, at, source: data.source };
      }
    } catch {
      // keep the apology reply
    }
    setMessages((m) => [...m, reply]);
    setAsking(false);
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
    <main className="min-h-dvh lg:flex lg:h-dvh lg:items-start lg:justify-center lg:gap-8 lg:overflow-hidden lg:px-6 lg:py-6">
      <section className="relative flex h-dvh w-full flex-col overflow-hidden bg-bg lg:h-[min(880px,calc(100dvh-48px))] lg:w-[420px] lg:rounded-[28px] lg:border lg:border-line lg:shadow-[0_30px_60px_-30px_rgba(29,39,51,0.45)]">
        <header className="relative flex items-center gap-2 bg-surface px-4 py-3 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-accent-2/60 after:to-transparent">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-2 shadow-sm ring-1 ring-inset ring-accent-2/40">
            <History size={16} strokeWidth={2.5} />
          </span>
          <span className="whitespace-nowrap font-display text-[17px] font-bold tracking-tight">Catch Me Up</span>
          {profile && (
            <span className="fade-in ml-1 inline-flex items-center gap-1.5 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold tracking-wider text-on-accent">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-2 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-2" />
              </span>
              LIVE
            </span>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            {profile && !editingProfile && (
              <button
                type="button"
                onClick={() => setEditingProfile(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface p-0.5 text-xs text-muted hover:border-text/30 hover:text-text min-[400px]:pr-2.5"
                aria-label="Edit your preferences"
              >
                {profile.team ? <TeamBadge team={profile.team} size="sm" /> : <span className="px-1.5">Neutral</span>}
                <span className="hidden min-[400px]:inline">{languageOf(profile.language).native}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setDemoOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2 py-1 text-xs text-muted hover:border-text/30 hover:text-text sm:px-2.5 lg:hidden"
              aria-label="Demo controls"
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
            <div key={tab} className="fade-in scroll-thin flex-1 space-y-3 overflow-y-auto p-3">
              {tab === "live" && (
                <>
                  {gap && <CatchUpPanel key={gap.id} gap={gap} profile={profile} onDismiss={() => setGap(null)} onAsk={ask} />}
                  <ScoreHeader s={s} />
                  {!gap && s.n > 0 && (
                    <div className="flex items-center gap-2 px-1 text-xs text-muted">
                      <span>Missed something? Recap the last</span>
                      {[1, 3, 5].map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => recapLast(k)}
                          className="rounded-full border border-line bg-surface px-2 py-0.5 hover:border-accent hover:text-accent"
                        >
                          {k} over{k > 1 ? "s" : ""}
                        </button>
                      ))}
                    </div>
                  )}
                  <MomentumChart
                    n={s.n}
                    onExplain={(tp) => ask(`Why was over ${tp.over.o + 1} of the ${TEAMS[tp.over.i]} innings (${tp.over.bowler} bowling) such a big moment?`)}
                  />
                  <BallFeed n={s.n} />
                </>
              )}
              {tab === "ask" && <AskPanel s={s} profile={profile} messages={messages} pending={asking} onSend={ask} />}
              {tab === "scorecard" && <Scorecard s={s} />}
              {tab !== "ask" && <p className="px-2 pb-2 pt-1 text-center text-[10px] text-muted/70">Ball-by-ball data: {MATCH.source}</p>}
            </div>

            <nav className="relative grid grid-cols-3 border-t border-line bg-surface">
              <span
                className="absolute top-0 h-0.5 w-1/3 bg-accent transition-transform duration-300 ease-out"
                style={{ transform: `translateX(${["live", "ask", "scorecard"].indexOf(tab) * 100}%)` }}
                aria-hidden
              />
              {(
                [
                  ["live", "Live", Radio],
                  ["ask", "Ask", MessageCircle],
                  ["scorecard", "Scorecard", ListOrdered],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] ${tab === id ? "font-semibold text-accent" : "text-muted hover:text-text"}`}
                  aria-current={tab === id ? "page" : undefined}
                >
                  <Icon size={18} className={`transition-transform duration-300 ${tab === id ? "-translate-y-0.5 scale-110" : ""}`} />
                  {label}
                </button>
              ))}
            </nav>
          </>
        )}

        {stepping !== null && (
          <div className="fade-in absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-bg/95 p-8 text-center backdrop-blur-sm">
            <span className="bob flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-2 shadow-lg ring-4 ring-accent/15">
              <Coffee size={28} />
            </span>
            <div className="rise-in">
              <p className="font-display text-2xl font-bold">You stepped away…</p>
              <p className="mt-1 text-sm text-muted">
                {stepping} overs later (about {stepping * 4} minutes of real match time)
              </p>
            </div>
            <div className="h-1.5 w-52 overflow-hidden rounded-full bg-surface-2 ring-1 ring-inset ring-line">
              <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2" style={{ animation: `grow ${STEP_AWAY_MS}ms ease-in-out forwards` }} />
            </div>
          </div>
        )}

        {demoOpen && (
          <div className="fade-in absolute inset-0 z-20 flex flex-col justify-end bg-text/40 backdrop-blur-[2px] lg:hidden" onClick={() => setDemoOpen(false)}>
            <div
              className="rise-in scroll-thin max-h-[88%] overflow-y-auto rounded-t-3xl border-t border-line bg-surface p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <button type="button" onClick={() => setDemoOpen(false)} className="float-right text-muted" aria-label="Close demo controls">
                <X size={18} />
              </button>
              {controls}
              <div className="mt-6 border-t border-line pt-5">
                <AboutCard />
              </div>
            </div>
          </div>
        )}
      </section>

      <aside className="scroll-thin hidden max-h-full w-[340px] shrink-0 space-y-4 overflow-y-auto lg:block">
        <div className="rise-in rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(29,39,51,0.05)]">{controls}</div>
        <div className="rise-in rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(29,39,51,0.05)]" style={{ animationDelay: "0.1s" }}>
          <AboutCard />
        </div>
      </aside>
    </main>
  );
}

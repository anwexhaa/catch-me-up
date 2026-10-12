"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Sparkles, Square, Volume2, X, Zap } from "lucide-react";
import { TEAMS, oversText, short } from "@/lib/match";
import { languageOf, profileKey, type Profile } from "@/lib/profile";
import { gapStats, type Mood, type RecapResponse } from "@/lib/recap";
import { speak, stopSpeaking } from "./browser";
import { TEAM_COLOR } from "./ui";

export type Gap = { from: number; to: number; via: "joined-late" | "away" | "manual"; id: number };

const responses = new Map<string, Promise<RecapResponse>>();
const recapKey = (gap: Gap, profile: Profile) => `${gap.from}-${gap.to}-${profileKey(profile)}`;

function requestRecap(gap: Gap, profile: Profile): Promise<RecapResponse> {
  const key = recapKey(gap, profile);
  if (!responses.has(key)) {
    const req = fetch("/api/recap", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ from: gap.from, to: gap.to, profile }),
    }).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<RecapResponse>;
    });
    req.catch(() => responses.delete(key));
    responses.set(key, req);
  }
  return responses.get(key)!;
}

const MOOD_COLOR: Record<Mood, string> = {
  great: "var(--sa)",
  good: "var(--sa)",
  tense: "var(--accent-2)",
  bad: "var(--wicket)",
  awful: "var(--wicket)",
  neutral: "var(--accent-2)",
};

export function CatchUpPanel({
  gap,
  profile,
  onDismiss,
  onAsk,
}: {
  gap: Gap;
  profile: Profile;
  onDismiss: () => void;
  onAsk?: (question: string) => void;
}) {
  // Already requested (e.g. before switching tabs)? Show it again straight away.
  const [started, setStarted] = useState(() => gap.via === "manual" || responses.has(recapKey(gap, profile)));
  const [result, setResult] = useState<RecapResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [noVoice, setNoVoice] = useState(false);

  useEffect(() => {
    if (!started) return;
    let live = true;
    requestRecap(gap, profile)
      .then((r) => live && setResult(r))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [started, gap, profile]);

  useEffect(() => stopSpeaking, []);

  const stats = gapStats(gap.from, gap.to, profile);
  const fanTeam = profile.team ?? TEAMS[0];
  const lang = languageOf(profile.language);
  const overs = oversText(stats.legalBalls);

  const toggleSpeech = () => {
    if (!result) return;
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    const { headline, bullets, watchNext } = result.recap;
    const ok = speak([headline, ...bullets, watchNext].join(". "), lang.speech, () => setSpeaking(false));
    setSpeaking(ok);
    setNoVoice(!ok);
  };

  const title = gap.via === "joined-late" ? "Joined late?" : gap.via === "away" ? "Welcome back!" : "Your recap";
  const subtitle =
    gap.via === "joined-late"
      ? `${overs} overs have already been bowled. Get the story so far.`
      : gap.via === "away"
        ? `You missed ${overs} over${overs === "1" ? "" : "s"}.`
        : `The last ${overs} over${overs === "1" ? "" : "s"}.`;

  return (
    <section
      className="rise-in overflow-hidden rounded-2xl border-2 bg-surface shadow-[0_10px_30px_-18px_rgba(123,30,47,0.45)] transition-colors duration-500"
      style={{ borderColor: result ? MOOD_COLOR[result.mood] : "var(--accent)" }}
      aria-live="polite"
    >
      <div className="flex items-start gap-3 p-4 pb-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
          <Sparkles size={16} className={started && !result && !failed ? "animate-spin [animation-duration:2.5s]" : ""} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold leading-tight">{title}</h2>
          <p className="text-[13px] text-muted">{subtitle}</p>
        </div>
        <button type="button" onClick={onDismiss} className="text-muted hover:text-text" aria-label="Dismiss recap">
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 text-[12px] text-muted">
        {TEAMS.filter((t) => stats.runs[t] > 0 || stats.wickets[t] > 0).map((t) => (
          <span key={t}>
            <span className="font-semibold" style={{ color: TEAM_COLOR[t] }}>
              {short(t)}
            </span>{" "}
            +{stats.runs[t]} runs, {stats.wickets[t]} wkt{stats.wickets[t] === 1 ? "" : "s"}
          </span>
        ))}
        <span>
          {short(fanTeam)} win chance {Math.round(stats.winBefore * 100)}% →{" "}
          <span className="font-semibold text-text">{Math.round(stats.winAfter * 100)}%</span>
        </span>
      </div>

      {!started && (
        <div className="p-4">
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 font-semibold text-on-accent shadow-[0_6px_16px_-8px_rgba(123,30,47,0.7)] hover:bg-[#8f2538]"
          >
            <Zap size={16} /> Catch me up
          </button>
        </div>
      )}

      {started && !result && !failed && (
        <div className="space-y-2.5 p-4" aria-label="Writing your recap">
          <div className="skeleton h-5 w-3/4" />
          <div className="skeleton h-3.5 w-full" />
          <div className="skeleton h-3.5 w-11/12" />
          <div className="skeleton h-3.5 w-4/5" />
          <p className="pt-1 text-[11px] text-muted">
            Reading {overs} overs of action and writing your recap in {lang.label}…
          </p>
        </div>
      )}

      {failed && <p className="p-4 text-sm text-wicket">Couldn&apos;t load a recap. Check your connection and try again.</p>}

      {result && (
        <div className="p-4 pt-3">
          <p className="rise-in font-display text-xl font-bold leading-snug">{result.recap.headline}</p>
          <ul className="mt-2.5 space-y-2">
            {result.recap.bullets.map((b, k) => (
              <li key={k} className="rise-in flex gap-2.5 text-[14px] leading-relaxed text-text/90" style={{ animationDelay: `${0.12 + k * 0.12}s` }}>
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: MOOD_COLOR[result.mood] }} />
                {b}
              </li>
            ))}
          </ul>
          {result.recap.watchNext && (
            <p className="rise-in mt-3 rounded-xl border-l-4 border-accent-2 bg-surface-2 px-3 py-2 text-[13px] leading-relaxed" style={{ animationDelay: "0.5s" }}>
              <span className="font-semibold text-accent-2">Watch next · </span>
              {result.recap.watchNext}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleSpeech}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs hover:border-text/40"
            >
              {speaking ? <Square size={12} /> : <Volume2 size={14} />} {speaking ? "Stop" : "Listen"}
            </button>
            {onAsk && (
              <button
                type="button"
                onClick={() => onAsk("What should I watch out for now?")}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs hover:border-text/40"
              >
                <MessageCircle size={14} /> Ask a follow-up
              </button>
            )}
            <span className="ml-auto text-[10px] text-muted">
              {result.source === "ai" ? `AI recap · ${lang.label}` : "Quick summary · AI unavailable"}
            </span>
          </div>
          {noVoice && <p className="mt-2 text-[11px] text-muted">This device has no {lang.label} voice installed for read-aloud.</p>}
        </div>
      )}
    </section>
  );
}

"use client";

import { useState, type ReactNode } from "react";
import { MATCH, PLAYERS_BY_TEAM, TEAMS } from "@/lib/match";
import { DEFAULT_PROFILE, LANGUAGES, LEVELS, type Profile } from "@/lib/profile";
import { TEAM_COLOR, TeamBadge } from "./ui";

function Question({ title, hint, children, delay = 0 }: { title: string; hint?: string; children: ReactNode; delay?: number }) {
  return (
    <fieldset className="rise-in" style={{ animationDelay: `${delay}s` }}>
      <legend className="mb-2 text-sm font-semibold">
        {title} {hint && <span className="font-normal text-muted">· {hint}</span>}
      </legend>
      {children}
    </fieldset>
  );
}

const pill = (on: boolean) =>
  `rounded-full border px-3 py-1.5 text-[13px] ${on ? "border-text bg-text text-surface shadow-sm" : "border-line bg-surface text-text/85 hover:border-text/40"}`;

export function Onboarding({
  initial,
  joinText,
  submitLabel,
  onDone,
}: {
  initial: Profile | null;
  joinText?: string;
  submitLabel: string;
  onDone: (p: Profile) => void;
}) {
  const [p, setP] = useState<Profile>(initial ?? DEFAULT_PROFILE);
  const set = (patch: Partial<Profile>) => setP((cur) => ({ ...cur, ...patch }));
  const squad = p.team ? PLAYERS_BY_TEAM[TEAMS.indexOf(p.team)] : PLAYERS_BY_TEAM.flat();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="scroll-thin flex-1 space-y-6 overflow-y-auto p-5">
        <div className="rise-in">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Your live match companion</p>
          <h1 className="font-display text-[28px] font-bold leading-[1.15]">Can&apos;t watch every ball? We&apos;ve got you.</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Follow the match in bursts. Whenever you come back, get a short recap of what you missed, made for you and in your
            language.
          </p>
        </div>

        <div className="rise-in rounded-2xl bg-board p-4 text-on-board ring-1 ring-inset ring-white/10" style={{ animationDelay: "0.08s" }}>
          <p className="text-[10px] uppercase tracking-[0.16em] text-on-board-muted">{MATCH.event}</p>
          <div className="mt-3 flex items-center gap-3">
            <TeamBadge team={TEAMS[0]} />
            <span className="text-sm">{TEAMS[0]}</span>
            <span className="mx-auto font-display text-sm italic text-accent-2">vs</span>
            <span className="text-sm">{TEAMS[1]}</span>
            <TeamBadge team={TEAMS[1]} />
          </div>
        </div>

        <Question title="Who are you rooting for?" delay={0.16}>
          <div className="grid grid-cols-3 gap-2">
            {[...TEAMS, null].map((team) => {
              const on = p.team === team;
              return (
                <button
                  key={team ?? "neutral"}
                  type="button"
                  onClick={() => set({ team, favourite: team && p.favourite && MATCH.players[p.favourite].team !== team ? null : p.favourite })}
                  className={`rounded-xl border px-2 py-3 text-[13px] font-medium ${on ? "text-white shadow-md" : "border-line bg-surface text-text/85 hover:border-text/40"}`}
                  style={on ? { background: team ? TEAM_COLOR[team] : "var(--text)", borderColor: team ? TEAM_COLOR[team] : "var(--text)" } : undefined}
                  aria-pressed={on}
                >
                  {team ?? "Just here for the cricket"}
                </button>
              );
            })}
          </div>
        </Question>

        <Question title="Favourite player" hint="optional" delay={0.24}>
          <div className="flex flex-wrap gap-1.5">
            {squad.map((id) => (
              <button key={id} type="button" onClick={() => set({ favourite: p.favourite === id ? null : id })} className={pill(p.favourite === id)} aria-pressed={p.favourite === id}>
                {MATCH.players[id].name}
              </button>
            ))}
          </div>
        </Question>

        <Question title="Recaps in" delay={0.32}>
          <div className="flex flex-wrap gap-1.5">
            {LANGUAGES.map((l) => (
              <button key={l.id} type="button" onClick={() => set({ language: l.id })} className={pill(p.language === l.id)} aria-pressed={p.language === l.id}>
                {l.native}
              </button>
            ))}
          </div>
        </Question>

        <Question title="How well do you know cricket?" delay={0.4}>
          <div className="grid grid-cols-3 gap-2">
            {LEVELS.map((l) => {
              const on = p.level === l.id;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => set({ level: l.id })}
                  className={`rounded-xl border px-2 py-2.5 text-left ${on ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-line bg-surface hover:border-text/40"}`}
                  aria-pressed={on}
                >
                  <span className="block text-[13px] font-medium">{l.label}</span>
                  <span className="block text-[11px] text-muted">{l.hint}</span>
                </button>
              );
            })}
          </div>
        </Question>
      </div>

      <div className="border-t border-line bg-surface p-4">
        <button
          type="button"
          onClick={() => onDone(p)}
          className="w-full rounded-xl bg-accent py-3 font-semibold text-on-accent shadow-[0_8px_20px_-10px_rgba(123,30,47,0.8)] hover:bg-[#8f2538]"
        >
          {submitLabel}
        </button>
        {joinText && <p className="mt-2 text-center text-[11px] text-muted">You&apos;ll join during {joinText}.</p>}
      </div>
    </div>
  );
}

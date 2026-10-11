"use client";

import { useState, type ReactNode } from "react";
import { MATCH, PLAYERS_BY_TEAM, TEAMS } from "@/lib/match";
import { DEFAULT_PROFILE, LANGUAGES, LEVELS, type Profile } from "@/lib/profile";
import { TEAM_COLOR, TeamBadge } from "./ui";

function Question({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">
        {title} {hint && <span className="font-normal text-muted">· {hint}</span>}
      </legend>
      {children}
    </fieldset>
  );
}

const pill = (on: boolean) =>
  `rounded-full border px-3 py-1.5 text-[13px] transition-colors ${on ? "border-text bg-text text-bg" : "border-line text-text/85 hover:border-text/40"}`;

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
        <div>
          <h1 className="text-2xl font-bold leading-tight tracking-tight">Can&apos;t watch every ball? We&apos;ve got you.</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Follow the match in bursts. Whenever you come back, get a short recap of what you missed, made for you and in your
            language.
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
        </div>

        <Question title="Who are you rooting for?">
          <div className="grid grid-cols-3 gap-2">
            {[...TEAMS, null].map((team) => {
              const on = p.team === team;
              return (
                <button
                  key={team ?? "neutral"}
                  type="button"
                  onClick={() => set({ team, favourite: team && p.favourite && MATCH.players[p.favourite].team !== team ? null : p.favourite })}
                  className={`rounded-xl border px-2 py-3 text-[13px] font-medium transition-colors ${on ? "text-white" : "border-line text-text/85 hover:border-text/40"}`}
                  style={on ? { background: team ? TEAM_COLOR[team] : "var(--surface-2)", borderColor: team ? TEAM_COLOR[team] : "var(--text)" } : undefined}
                  aria-pressed={on}
                >
                  {team ?? "Just here for the cricket"}
                </button>
              );
            })}
          </div>
        </Question>

        <Question title="Favourite player" hint="optional">
          <div className="flex flex-wrap gap-1.5">
            {squad.map((id) => (
              <button key={id} type="button" onClick={() => set({ favourite: p.favourite === id ? null : id })} className={pill(p.favourite === id)} aria-pressed={p.favourite === id}>
                {MATCH.players[id].name}
              </button>
            ))}
          </div>
        </Question>

        <Question title="Recaps in">
          <div className="flex flex-wrap gap-1.5">
            {LANGUAGES.map((l) => (
              <button key={l.id} type="button" onClick={() => set({ language: l.id })} className={pill(p.language === l.id)} aria-pressed={p.language === l.id}>
                {l.native}
              </button>
            ))}
          </div>
        </Question>

        <Question title="How well do you know cricket?">
          <div className="grid grid-cols-3 gap-2">
            {LEVELS.map((l) => {
              const on = p.level === l.id;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => set({ level: l.id })}
                  className={`rounded-xl border px-2 py-2.5 text-left transition-colors ${on ? "border-text bg-surface-2" : "border-line hover:border-text/40"}`}
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

      <div className="border-t border-line bg-bg p-4">
        <button type="button" onClick={() => onDone(p)} className="w-full rounded-xl bg-accent py-3 font-semibold text-black hover:opacity-90">
          {submitLabel}
        </button>
        {joinText && <p className="mt-2 text-center text-[11px] text-muted">You&apos;ll join during {joinText}.</p>}
      </div>
    </div>
  );
}

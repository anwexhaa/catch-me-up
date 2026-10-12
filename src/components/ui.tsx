import type { ReactNode } from "react";
import { ballOutcome, short, type Delivery } from "@/lib/match";

export const TEAM_COLOR: Record<string, string> = {
  India: "var(--ind)",
  "South Africa": "var(--sa)",
};

export function Card({ title, action, children, className = "" }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(29,39,51,0.05)] ${className}`}>
      {(title || action) && (
        <header className="mb-3 flex items-center gap-3">
          {title && <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{title}</h2>}
          <span className="h-px flex-1 bg-line" aria-hidden />
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function TeamBadge({ team, size = "md" }: { team: string; size?: "sm" | "md" }) {
  const dims = size === "sm" ? "h-5 min-w-8 text-[10px]" : "h-7 min-w-11 text-xs";
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md px-1.5 font-bold tracking-wide text-white ring-1 ring-inset ring-white/25 ${dims}`}
      style={{ background: TEAM_COLOR[team] }}
    >
      {short(team)}
    </span>
  );
}

const CHIP_STYLE: Record<string, string> = {
  wicket: "bg-wicket text-white border-wicket",
  six: "bg-six text-white border-six",
  four: "bg-four text-text border-four",
  dot: "bg-surface-2 text-muted border-line",
  run: "bg-surface text-text border-line",
  extra: "bg-surface/60 text-muted border-line border-dashed",
};

export function BallChip({ d, size = "md", animate = false }: { d: Delivery; size?: "sm" | "md"; animate?: boolean }) {
  const o = ballOutcome(d);
  const dims = size === "sm" ? "h-6 min-w-6 text-[11px]" : "h-7 min-w-7 text-xs";
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border px-1 font-semibold ${dims} ${CHIP_STYLE[o.tone]} ${animate ? "chip-in" : ""}`}
    >
      {o.chip}
    </span>
  );
}

/** Two-team win-chance bar. Text inherits the surrounding colour so it works on any background. */
export function WinBar({ p, teams }: { p: number; teams: [string, string] }) {
  const a = Math.round(p * 100);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <span className="h-2 w-2 rounded-full" style={{ background: TEAM_COLOR[teams[0]] }} />
          {short(teams[0])} <span key={a} className="score-pop tabular-nums">{a}%</span>
        </span>
        <span className="opacity-70">Win chance</span>
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <span key={100 - a} className="score-pop tabular-nums">{100 - a}%</span> {short(teams[1])}
          <span className="h-2 w-2 rounded-full" style={{ background: TEAM_COLOR[teams[1]] }} />
        </span>
      </div>
      <div
        className="flex h-2 overflow-hidden rounded-full bg-black/10 ring-1 ring-inset ring-white/10"
        role="img"
        aria-label={`Win chance: ${teams[0]} ${a}%, ${teams[1]} ${100 - a}%`}
      >
        <div className="transition-[width] duration-700 ease-out" style={{ width: `${a}%`, background: TEAM_COLOR[teams[0]] }} />
        <div className="w-0.5 bg-white/70" />
        <div className="flex-1" style={{ background: TEAM_COLOR[teams[1]] }} />
      </div>
    </div>
  );
}

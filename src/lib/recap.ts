// Recap types, gap statistics and the rule-based fallback used when the AI is unavailable.

import { DELIVERIES, SECOND_INNINGS_START, TEAMS, eventsBetween, oversText, scoreText, short, stateAt } from "./match";
import { fanWinChance } from "./prompts";
import type { Profile } from "./profile";

export type Recap = { headline: string; bullets: string[]; watchNext: string };
export type Mood = "great" | "good" | "tense" | "bad" | "awful" | "neutral";
export type RecapResponse = { recap: Recap; mood: Mood; source: "ai" | "fallback"; model?: string };

export type GapStats = {
  legalBalls: number;
  runs: Record<string, number>;
  wickets: Record<string, number>;
  winBefore: number;
  winAfter: number;
};

export function gapStats(from: number, to: number, p: Profile): GapStats {
  const runs: Record<string, number> = { [TEAMS[0]]: 0, [TEAMS[1]]: 0 };
  const wickets: Record<string, number> = { [TEAMS[0]]: 0, [TEAMS[1]]: 0 };
  let legalBalls = 0;
  for (const d of DELIVERIES.slice(from, to)) {
    runs[TEAMS[d.i]] += d.t;
    if (d.w) wickets[TEAMS[d.i]] += 1;
    if (!d.il) legalBalls += 1;
  }
  return { legalBalls, runs, wickets, winBefore: fanWinChance(from, p), winAfter: fanWinChance(to, p) };
}

export function moodFor(from: number, to: number, p: Profile): Mood {
  if (!p.team) return "neutral";
  const swing = fanWinChance(to, p) - fanWinChance(from, p);
  if (swing >= 0.1) return "great";
  if (swing >= 0.03) return "good";
  if (swing <= -0.1) return "awful";
  if (swing <= -0.03) return "bad";
  return "tense";
}

const stripPrefix = (text: string) => text.replace(/^\d+\.\d+\s+/, "").replace(/^[A-Z ]+:\s*/, (m) => m.charAt(0) + m.slice(1).toLowerCase());

/** Plain-English recap built from the event log, with no AI involved. */
export function fallbackRecap(from: number, to: number): Recap {
  const s = stateAt(to);
  const events = eventsBetween(from, to).filter((e) => e.kind !== "swing");
  const top = [...events]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .sort((a, b) => a.n - b.n);
  const wkts = events.filter((e) => e.kind === "wicket").length;
  const overs = oversText(DELIVERIES.slice(from, to).filter((d) => !d.il).length);

  const [first, second] = s.innings;
  const headline =
    from < SECOND_INNINGS_START && to > SECOND_INNINGS_START
      ? `${short(first.team)} made ${scoreText(first)}; ${short(second.team)} are ${scoreText(second)} chasing ${s.target}`
      : wkts
        ? `${wkts} wicket${wkts > 1 ? "s" : ""} fell in the ${overs} overs you missed`
        : `${overs} overs, no wickets while you were away`;

  const bullets = top.map((e) => stripPrefix(e.text));
  if (bullets.length < 3) bullets.push(`${short(s.active.team)} are ${scoreText(s.active)} after ${oversText(s.active.balls)} overs.`);

  let watchNext = "";
  if (s.phase === "inn2") watchNext = `${s.active.team} need ${s.need} from ${s.ballsLeft} balls.`;
  else if (s.phase === "inn1") watchNext = `${s.active.team} have ${120 - s.active.balls} balls left to build a total.`;
  else if (s.phase === "break") watchNext = `${TEAMS[1]} need ${s.target} to win.`;
  else if (s.phase === "done") watchNext = s.result ?? "";

  return { headline, bullets: bullets.slice(0, 3), watchNext };
}

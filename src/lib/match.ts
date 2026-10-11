// Replay engine: everything about the match is derived from "n", the number of
// deliveries bowled so far. Nothing here looks past n, so the UI and the AI only
// ever know what a fan watching live would know.

import raw from "@/data/match.json";
import { chaseWinProb, firstInningsWinProb } from "./winprob";

export type Wicket = { out: string; kind: string; by?: string[] };
export type Delivery = {
  i: number; // innings index
  o: number; // over index, 0-based
  b: number; // legal balls bowled in this over, including this one
  bat: string;
  bowl: string;
  ns: string;
  r: number; // runs off the bat
  x: number; // extras
  t: number; // total runs
  xt?: "wides" | "noballs" | "legbyes" | "byes" | "penalty";
  il?: 1; // illegal delivery (wide / no-ball)
  w?: Wicket;
};
export type Player = { name: string; team: string; role?: "captain" | "wicketkeeper" };
type MatchData = {
  id: string;
  event: string;
  venue: string;
  date: string;
  format: string;
  oversPerInnings: number;
  teams: string[];
  toss: string;
  players: Record<string, Player>;
  deliveries: Delivery[];
  source: string;
};

export const MATCH = raw as MatchData;
export const DELIVERIES = MATCH.deliveries;
export const TOTAL = DELIVERIES.length;
export const TEAMS = MATCH.teams as [string, string]; // [batting first, chasing]
export const MAX_BALLS = MATCH.oversPerInnings * 6;
export const SECOND_INNINGS_START = DELIVERIES.findIndex((d) => d.i === 1);
const INNINGS_RANGE: [number, number][] = [
  [0, SECOND_INNINGS_START],
  [SECOND_INNINGS_START, TOTAL],
];

export const TEAM_SHORT: Record<string, string> = { India: "IND", "South Africa": "SA" };
export const short = (team: string) => TEAM_SHORT[team] ?? team.slice(0, 3).toUpperCase();
export const teamOf = (player: string) => MATCH.players[player]?.team;
export const fullName = (player: string) => MATCH.players[player]?.name ?? player;
export const PLAYERS_BY_TEAM = TEAMS.map((team) =>
  Object.entries(MATCH.players)
    .filter(([, p]) => p.team === team)
    .map(([id]) => id),
);

// ---------- formatting ----------

export const oversText = (balls: number) =>
  balls % 6 === 0 ? String(balls / 6) : `${Math.floor(balls / 6)}.${balls % 6}`;

export const ballLabel = (d: Delivery) => `${d.o}.${d.il ? d.b + 1 : d.b}`;

const BOWLER_CREDITED = new Set(["bowled", "caught", "lbw", "stumped", "caught and bowled", "hit wicket"]);

export function dismissalText(d: Delivery): string {
  const w = d.w!;
  const by = w.by?.[0];
  switch (w.kind) {
    case "caught":
      return `c ${by} b ${d.bowl}`;
    case "caught and bowled":
      return `c & b ${d.bowl}`;
    case "bowled":
      return `b ${d.bowl}`;
    case "lbw":
      return `lbw b ${d.bowl}`;
    case "stumped":
      return `st ${by} b ${d.bowl}`;
    case "run out":
      return `run out (${w.by?.join("/") ?? ""})`;
    default:
      return w.kind;
  }
}

export type Outcome = { chip: string; tone: "wicket" | "six" | "four" | "dot" | "run" | "extra" };

export function ballOutcome(d: Delivery): Outcome {
  if (d.w) return { chip: "W", tone: "wicket" };
  if (d.xt === "wides") return { chip: d.x > 1 ? `${d.x}wd` : "wd", tone: "extra" };
  if (d.xt === "noballs") return { chip: d.r ? `nb+${d.r}` : "nb", tone: "extra" };
  if (d.xt === "legbyes") return { chip: `${d.x}lb`, tone: "extra" };
  if (d.xt === "byes") return { chip: `${d.x}b`, tone: "extra" };
  if (d.r === 6) return { chip: "6", tone: "six" };
  if (d.r === 4) return { chip: "4", tone: "four" };
  if (d.t === 0) return { chip: "•", tone: "dot" };
  return { chip: String(d.t), tone: "run" };
}

export function describeBall(d: Delivery): string {
  const who = `${d.bowl} to ${d.bat}`;
  if (d.w) return `${who}, OUT! ${d.w.out} ${dismissalText(d)}`;
  if (d.xt === "wides") return `${who}, ${d.x > 1 ? `${d.x} wides` : "wide"}`;
  if (d.xt === "noballs") return `${who}, no-ball${d.r ? ` and ${d.r} off the bat` : ""}`;
  if (d.xt === "legbyes") return `${who}, ${d.x} leg bye${d.x > 1 ? "s" : ""}`;
  if (d.xt === "byes") return `${who}, ${d.x} bye${d.x > 1 ? "s" : ""}`;
  if (d.r === 6) return `${who}, SIX`;
  if (d.r === 4) return `${who}, FOUR`;
  if (d.t === 0) return `${who}, no run`;
  return `${who}, ${d.t} run${d.t > 1 ? "s" : ""}`;
}

// ---------- innings state ----------

export type BatterLine = { id: string; runs: number; balls: number; fours: number; sixes: number; out?: string };
export type BowlerLine = { id: string; balls: number; runs: number; wkts: number; maidens: number; dots: number };
export type Innings = {
  index: number;
  team: string;
  bowlingTeam: string;
  runs: number;
  wkts: number;
  balls: number;
  extras: number;
  batters: BatterLine[];
  bowlers: BowlerLine[];
  fow: { score: number; wkt: number; player: string; over: string }[];
  partnership: { runs: number; balls: number };
  atCrease: string[];
  bowler?: string;
  thisOver: Delivery[];
  started: boolean;
  complete: boolean;
};

const bowlerRuns = (d: Delivery) => (d.xt === "legbyes" || d.xt === "byes" || d.xt === "penalty" ? d.r : d.t);

function inningsAt(index: number, n: number): Innings {
  const [start, end] = INNINGS_RANGE[index];
  const upto = Math.min(Math.max(n, start), end);
  const batters = new Map<string, BatterLine>();
  const bowlers = new Map<string, BowlerLine>();
  const bat = (id: string) => {
    if (!batters.has(id)) batters.set(id, { id, runs: 0, balls: 0, fours: 0, sixes: 0 });
    return batters.get(id)!;
  };
  const inn: Innings = {
    index,
    team: TEAMS[index],
    bowlingTeam: TEAMS[1 - index],
    runs: 0,
    wkts: 0,
    balls: 0,
    extras: 0,
    batters: [],
    bowlers: [],
    fow: [],
    partnership: { runs: 0, balls: 0 },
    atCrease: [],
    thisOver: [],
    started: upto > start,
    complete: upto >= end,
  };
  let overConceded = 0;
  for (let k = start; k < upto; k++) {
    const d = DELIVERIES[k];
    const striker = bat(d.bat);
    bat(d.ns);
    if (!bowlers.has(d.bowl)) bowlers.set(d.bowl, { id: d.bowl, balls: 0, runs: 0, wkts: 0, maidens: 0, dots: 0 });
    const bw = bowlers.get(d.bowl)!;

    inn.runs += d.t;
    inn.extras += d.x;
    inn.partnership.runs += d.t;
    striker.runs += d.r;
    if (d.xt !== "wides") striker.balls += 1;
    if (d.r === 4) striker.fours += 1;
    if (d.r === 6) striker.sixes += 1;
    const conceded = bowlerRuns(d);
    bw.runs += conceded;
    overConceded += conceded;
    if (!d.il) {
      inn.balls += 1;
      inn.partnership.balls += 1;
      bw.balls += 1;
      if (conceded === 0) bw.dots += 1;
    }
    if (d.w) {
      inn.wkts += 1;
      bat(d.w.out).out = dismissalText(d);
      if (BOWLER_CREDITED.has(d.w.kind)) bw.wkts += 1;
      inn.fow.push({ score: inn.runs, wkt: inn.wkts, player: d.w.out, over: ballLabel(d) });
      inn.partnership = { runs: 0, balls: 0 };
    }
    if (!d.il && d.b === 6) {
      if (overConceded === 0) bw.maidens += 1;
      overConceded = 0;
    }
  }
  inn.batters = [...batters.values()];
  inn.bowlers = [...bowlers.values()];
  if (upto > start) {
    const last = DELIVERIES[upto - 1];
    inn.bowler = last.bowl;
    inn.atCrease = [last.bat, last.ns].filter((p) => p !== last.w?.out);
    const overStart = DELIVERIES.findIndex((d, k) => k >= start && d.o === last.o && d.i === index);
    inn.thisOver = !last.il && last.b === 6 ? [] : DELIVERIES.slice(overStart, upto);
  }
  return inn;
}

// ---------- match state ----------

export type Phase = "pre" | "inn1" | "break" | "inn2" | "done";
export type MatchState = {
  n: number;
  phase: Phase;
  innings: [Innings, Innings];
  active: Innings;
  last?: Delivery;
  target: number | null;
  need: number | null;
  ballsLeft: number | null;
  crr: number;
  rrr: number | null;
  winProb: number; // chance that TEAMS[0] wins
  result: string | null;
};

const cache = new Map<number, MatchState>();

export function stateAt(nIn: number): MatchState {
  const n = Math.max(0, Math.min(TOTAL, Math.floor(nIn)));
  const hit = cache.get(n);
  if (hit) return hit;

  const innings: [Innings, Innings] = [inningsAt(0, n), inningsAt(1, n)];
  const [first, second] = innings;
  const phase: Phase =
    n === 0 ? "pre" : n < SECOND_INNINGS_START ? "inn1" : n === SECOND_INNINGS_START ? "break" : n < TOTAL ? "inn2" : "done";
  const active = second.started ? second : first;
  const target = first.complete ? first.runs + 1 : null;
  const need = target !== null ? Math.max(0, target - second.runs) : null;
  const ballsLeft = target !== null ? MAX_BALLS - second.balls : null;

  let result: string | null = null;
  let winProb: number;
  if (phase === "done") {
    if (second.runs >= target!) {
      result = `${TEAMS[1]} won by ${10 - second.wkts} wickets`;
      winProb = 0;
    } else if (second.runs === target! - 1) {
      result = "Match tied";
      winProb = 0.5;
    } else {
      result = `${TEAMS[0]} won by ${target! - 1 - second.runs} runs`;
      winProb = 1;
    }
  } else if (target === null) {
    winProb = firstInningsWinProb(first.runs, MAX_BALLS - first.balls, first.wkts);
  } else {
    winProb = 1 - chaseWinProb(need!, ballsLeft!, second.wkts);
  }

  const state: MatchState = {
    n,
    phase,
    innings,
    active,
    last: n > 0 ? DELIVERIES[n - 1] : undefined,
    target,
    need,
    ballsLeft,
    crr: active.balls ? (active.runs * 6) / active.balls : 0,
    rrr: need !== null && ballsLeft ? (need * 6) / ballsLeft : null,
    winProb,
    result,
  };
  cache.set(n, state);
  return state;
}

export const scoreText = (inn: Innings) => `${inn.runs}/${inn.wkts}`;

/** Chance TEAMS[0] wins after each delivery: index n = after n deliveries. */
export const WIN_SERIES: number[] = Array.from({ length: TOTAL + 1 }, (_, n) => stateAt(n).winProb);

// ---------- overs & events (used for the feed, recaps and turning points) ----------

export type OverSummary = {
  i: number;
  o: number;
  bowler: string;
  runs: number;
  wkts: number;
  startN: number; // deliveries bowled before this over
  endN: number; // deliveries bowled after this over
  score: string;
};

export const OVERS: OverSummary[] = (() => {
  const out: OverSummary[] = [];
  DELIVERIES.forEach((d, k) => {
    let cur = out[out.length - 1];
    if (!cur || cur.i !== d.i || cur.o !== d.o) {
      cur = { i: d.i, o: d.o, bowler: d.bowl, runs: 0, wkts: 0, startN: k, endN: k, score: "" };
      out.push(cur);
    }
    cur.runs += d.t;
    if (d.w) cur.wkts += 1;
    cur.endN = k + 1;
  });
  for (const ov of out) ov.score = scoreText(stateAt(ov.endN).innings[ov.i]);
  return out;
})();

/** Index into OVERS of the over in progress (or just finished) after n deliveries. */
export function overIndexAt(n: number): number {
  const k = OVERS.findIndex((ov) => n > ov.startN && n <= ov.endN);
  return k === -1 ? 0 : k;
}

export type EventKind = "wicket" | "six" | "four" | "fifty" | "big-over" | "tight-over" | "innings-end" | "swing";
export type MatchEvent = { n: number; kind: EventKind; text: string; weight: number; team: string };

export const EVENTS: MatchEvent[] = (() => {
  const events: MatchEvent[] = [];
  DELIVERIES.forEach((d, k) => {
    const n = k + 1;
    const after = stateAt(n);
    const inn = after.innings[d.i];
    const team = TEAMS[d.i];
    const at = `${short(team)} ${scoreText(inn)} (${oversText(inn.balls)} ov)`;
    if (d.w) {
      const line = inn.batters.find((b) => b.id === d.w!.out)!;
      events.push({
        n,
        kind: "wicket",
        team,
        weight: 10 + Math.min(line.runs, 60) / 10,
        text: `${ballLabel(d)} WICKET: ${d.w.out} ${dismissalText(d)} for ${line.runs} (${line.balls}). ${at}`,
      });
    } else if (d.r === 6 || d.r === 4) {
      events.push({
        n,
        kind: d.r === 6 ? "six" : "four",
        team,
        weight: d.r === 6 ? 3 : 2,
        text: `${ballLabel(d)} ${d.r === 6 ? "SIX" : "FOUR"}: ${d.bat} off ${d.bowl}. ${at}`,
      });
    }
    const before = stateAt(k).innings[d.i].batters.find((b) => b.id === d.bat)?.runs ?? 0;
    const now = inn.batters.find((b) => b.id === d.bat)!;
    if (before < 50 && now.runs >= 50) {
      events.push({ n, kind: "fifty", team, weight: 8, text: `${ballLabel(d)} FIFTY: ${d.bat} reaches ${now.runs} off ${now.balls} balls. ${at}` });
    }
    if (n === SECOND_INNINGS_START) {
      events.push({
        n,
        kind: "innings-end",
        team,
        weight: 9,
        text: `INNINGS BREAK: ${team} finish on ${scoreText(inn)}. ${TEAMS[1]} need ${inn.runs + 1} to win.`,
      });
    }
  });
  for (const ov of OVERS) {
    const team = TEAMS[ov.i];
    const label = `over ${ov.o + 1} (${ov.bowler})`;
    if (ov.runs >= 15) {
      events.push({ n: ov.endN, kind: "big-over", team, weight: 6 + (ov.runs - 15) / 3, text: `BIG OVER: ${ov.runs} runs off ${label}. ${short(team)} ${ov.score}` });
    } else if (ov.o >= 14 && ov.runs <= 5) {
      events.push({ n: ov.endN, kind: "tight-over", team, weight: 6, text: `TIGHT OVER: only ${ov.runs} runs${ov.wkts ? ` and ${ov.wkts} wicket${ov.wkts > 1 ? "s" : ""}` : ""} off ${label}. ${short(team)} ${ov.score}` });
    }
    const swing = WIN_SERIES[ov.endN] - WIN_SERIES[ov.startN];
    if (Math.abs(swing) >= 0.1) {
      const toward = swing > 0 ? TEAMS[0] : TEAMS[1];
      events.push({
        n: ov.endN,
        kind: "swing",
        team: toward,
        weight: 5 + Math.abs(swing) * 10,
        text: `MOMENTUM: ${label} swung the win chance ${Math.round(Math.abs(swing) * 100)} points toward ${toward}.`,
      });
    }
  }
  return events.sort((a, b) => a.n - b.n || b.weight - a.weight);
})();

export const eventsBetween = (from: number, to: number) => EVENTS.filter((e) => e.n > from && e.n <= to);

export type TurningPoint = { n: number; over: OverSummary; swing: number };

/** Overs with the biggest win-chance swings, up to n deliveries. */
export function turningPoints(n: number, limit = 4): TurningPoint[] {
  return OVERS.filter((ov) => ov.endN <= n)
    .map((over) => ({ n: over.endN, over, swing: WIN_SERIES[over.endN] - WIN_SERIES[over.startN] }))
    .filter((tp) => Math.abs(tp.swing) >= 0.1)
    .sort((a, b) => Math.abs(b.swing) - Math.abs(a.swing))
    .slice(0, limit)
    .sort((a, b) => a.n - b.n);
}

/** Delivery count at the end of the over that is k overs after the one in progress at n. */
export function skipOvers(n: number, k: number): number {
  const ov = OVERS[overIndexAt(n)];
  const base = n >= ov.endN ? overIndexAt(n) + 1 : overIndexAt(n);
  const target = OVERS[Math.min(OVERS.length - 1, base + k - 1)];
  return Math.max(n, target.endN);
}

/** Delivery count at the end of over `over` (1-based) of innings `inningsIndex`. */
export function endOfOver(inningsIndex: number, over: number): number {
  if (over <= 0) return INNINGS_RANGE[inningsIndex][0];
  return OVERS.find((ov) => ov.i === inningsIndex && ov.o === over - 1)?.endN ?? INNINGS_RANGE[inningsIndex][1];
}

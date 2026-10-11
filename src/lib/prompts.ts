// Turns match state into compact text for the model. Everything is built from
// deliveries bowled up to a point, so the model is never shown the future.

import {
  DELIVERIES,
  MATCH,
  OVERS,
  TEAMS,
  ballOutcome,
  dismissalText,
  eventsBetween,
  fullName,
  oversText,
  scoreText,
  stateAt,
  teamOf,
  type Innings,
} from "./match";
import { languageOf, type Profile } from "./profile";

const pct = (p: number) => `${Math.round(p * 100)}%`;

/** Win chance for the fan's team (or the side batting first, for neutral fans). */
export const fanWinChance = (n: number, p: Profile) => {
  const first = stateAt(n).winProb;
  return p.team === TEAMS[1] ? 1 - first : first;
};

function creaseText(inn: Innings): string {
  const batters = inn.atCrease
    .map((id) => {
      const b = inn.batters.find((x) => x.id === id)!;
      return `${fullName(id)} ${b.runs}* (${b.balls} balls)`;
    })
    .join(", ");
  const bw = inn.bowlers.find((x) => x.id === inn.bowler);
  const bowler = bw ? `${fullName(bw.id)} ${oversText(bw.balls)}-${bw.maidens}-${bw.runs}-${bw.wkts}` : "";
  return `At the crease: ${batters || "a new batter is walking in"}${bowler ? `. Last bowler: ${bowler}` : ""}.`;
}

export function situationText(n: number): string {
  const s = stateAt(n);
  const [first, second] = s.innings;
  switch (s.phase) {
    case "pre":
      return `The match is about to start. ${MATCH.toss}.`;
    case "inn1":
      return `${first.team} ${scoreText(first)} after ${oversText(first.balls)} overs (run rate ${s.crr.toFixed(2)}), batting first. ${creaseText(first)}`;
    case "break":
      return `Innings break. ${first.team} made ${scoreText(first)} in 20 overs. ${second.team} need ${s.target} to win.`;
    case "inn2":
      return `${second.team} ${scoreText(second)} after ${oversText(second.balls)} overs, chasing ${s.target}: need ${s.need} from ${s.ballsLeft} balls (required rate ${s.rrr?.toFixed(2)}, current rate ${s.crr.toFixed(2)}). ${creaseText(second)}`;
    case "done":
      return `The match has finished: ${s.result}. ${first.team} ${scoreText(first)}, ${second.team} ${scoreText(second)}.`;
  }
}

export function playerStatus(id: string, n: number): string {
  const s = stateAt(n);
  const parts: string[] = [];
  for (const inn of s.innings) {
    const bat = inn.batters.find((b) => b.id === id);
    if (bat && (bat.balls > 0 || bat.out)) {
      parts.push(bat.out ? `was out for ${bat.runs} (${bat.balls} balls), ${bat.out}` : `is batting on ${bat.runs}* (${bat.balls} balls)`);
    } else if (bat) {
      parts.push("is at the crease, yet to face a ball");
    }
    const bowl = inn.bowlers.find((b) => b.id === id);
    if (bowl) parts.push(`has bowling figures of ${oversText(bowl.balls)}-${bowl.maidens}-${bowl.runs}-${bowl.wkts} (overs-maidens-runs-wickets)`);
  }
  return parts.length ? parts.join("; and ") : "has not batted or bowled yet";
}

function profileText(p: Profile, n: number): string {
  const lang = languageOf(p.language);
  const lines = [
    `- Supports: ${p.team ?? "no team (neutral fan who just loves good cricket)"}`,
    `- Favourite player: ${p.favourite ? `${fullName(p.favourite)} (${teamOf(p.favourite)}), who ${playerStatus(p.favourite, n)}` : "none"}`,
    `- Cricket knowledge: ${p.level === "diehard" ? "die-hard fan" : p.level === "casual" ? "casual fan" : "new to cricket"}`,
    `- Language: ${lang.label}`,
  ];
  return lines.join("\n");
}

function deliveryText(k: number): string {
  const d = DELIVERIES[k];
  const o = ballOutcome(d);
  if (d.w) return `W (${d.w.out} ${dismissalText(d)})`;
  if (o.tone === "six" || o.tone === "four") return `${o.chip} ${d.bat}`;
  return o.chip === "•" ? "0" : o.chip;
}

/** Ball-by-ball log for deliveries (from, to], grouped by over. */
export function ballLogText(from: number, to: number): string {
  const lines: string[] = [];
  for (const ov of OVERS) {
    const a = Math.max(ov.startN, from);
    const b = Math.min(ov.endN, to);
    if (a >= b) continue;
    const balls = [];
    for (let k = a; k < b; k++) balls.push(deliveryText(k));
    const after = stateAt(b).innings[ov.i];
    const partial = a > ov.startN || b < ov.endN ? " (part)" : "";
    lines.push(`${TEAMS[ov.i]} over ${ov.o + 1}${partial}, ${fullName(ov.bowler)} bowling: ${balls.join(", ")} -> ${scoreText(after)}`);
  }
  return lines.join("\n");
}

const LANGUAGE_RULES: Record<string, string> = {
  en: "Write in natural, friendly English.",
  hi: "Write in natural conversational Hindi in Devanagari script, the way TV commentators speak. Cricket words like over, wicket, run rate can stay as Devanagari transliterations (ओवर, विकेट).",
  hinglish:
    "Write in Hinglish: a natural Hindi-English mix in Roman script, the way Indian fans text each other (for example: 'Klaasen ne Axar ke over mein 24 runs thok diye!'). Use Roman script only, never Devanagari.",
  bn: "Write in natural conversational Bengali in Bengali script.",
  ta: "Write in natural conversational Tamil in Tamil script.",
  te: "Write in natural conversational Telugu in Telugu script.",
  mr: "Write in natural conversational Marathi in Devanagari script.",
};

const LEVEL_RULES: Record<string, string> = {
  diehard: "They know the game deeply: be crisp, use cricket shorthand freely and include the telling numbers.",
  casual: "Keep it plain and friendly; use only the one or two numbers that matter.",
  new: "They are new to cricket: avoid jargon, or explain a term in a few words in brackets the first time you use it (e.g. 'wicket (a batter is out)'). Say why moments matter.",
};

const SPOILER_RULE =
  "The fan is following this match LIVE. You may recognise the real match and know how it ended: never reveal, hint at or predict the result or anything that happens after the 'NOW' point. Use only the data given. Talk about what could happen next only as possibilities.";

export function recapPrompt(from: number, to: number, p: Profile) {
  const before = fanWinChance(from, p);
  const after = fanWinChance(to, p);
  const fanSide = p.team ?? TEAMS[0];
  const keyMoments = eventsBetween(from, to)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 8)
    .sort((a, b) => a.n - b.n)
    .map((e) => `- ${e.text}`)
    .join("\n");

  const system = [
    "You are Catch Me Up, a live cricket companion inside a sports app.",
    "A fan stepped away from a live match and has just come back. Tell them what they missed, personalised to them.",
    SPOILER_RULE,
    "Lead with what matters most to THIS fan: their team's situation and their favourite player if involved. Be honest about how things stand, with a little warmth and energy, like a friend who kept watching for them.",
    "Do not invent details that are not in the data (no crowd reactions, no 'stunning' catches, no quotes).",
    LEVEL_RULES[p.level],
    LANGUAGE_RULES[p.language],
    "Format: headline of at most 10 words; exactly 3 bullets of at most 22 words each, most important first; watchNext is one sentence of at most 22 words saying what to look out for in the next few overs, based on the current situation. All fields in the fan's language.",
    "If the gap is long (many overs or a whole innings), summarise the story at a higher level instead of listing every boundary.",
  ].join("\n\n");

  const user = [
    `FAN\n${profileText(p, to)}`,
    `MATCH\n${MATCH.event}: ${TEAMS[0]} vs ${TEAMS[1]} at ${MATCH.venue}. ${MATCH.toss}.`,
    `WHEN THE FAN LEFT\n${situationText(from)}`,
    `NOW\n${situationText(to)}`,
    `${p.team ? `${fanSide}'s` : `${fanSide}'s (shown for reference)`} win chance, simple model: ${pct(before)} when they left, ${pct(after)} now.`,
    `BALL BY BALL WHILE THEY WERE AWAY\n${ballLogText(from, to)}`,
    keyMoments ? `KEY MOMENTS\n${keyMoments}` : "",
    "Write the recap now.",
  ]
    .filter(Boolean)
    .join("\n\n");

  return { system, user };
}

function scorecardText(n: number): string {
  return stateAt(n)
    .innings.filter((inn) => inn.started)
    .map((inn) => {
      const batting = inn.batters
        .filter((b) => b.balls > 0 || b.out)
        .map((b) => `${fullName(b.id)} ${b.runs}${b.out ? "" : "*"} (${b.balls}b, ${b.fours}x4, ${b.sixes}x6)${b.out ? ` ${b.out}` : ""}`)
        .join("; ");
      const bowling = inn.bowlers.map((b) => `${fullName(b.id)} ${oversText(b.balls)}-${b.maidens}-${b.runs}-${b.wkts}`).join("; ");
      return `${inn.team} ${scoreText(inn)} (${oversText(inn.balls)} overs${inn.complete ? ", innings complete" : ", in progress"})\n  Batting: ${batting}\n  ${inn.bowlingTeam} bowling (overs-maidens-runs-wickets): ${bowling}`;
    })
    .join("\n");
}

export function askSystemPrompt(n: number, p: Profile): string {
  const recentFrom = OVERS[Math.max(0, OVERS.findIndex((ov) => n > ov.startN && n <= ov.endN) - 2)]?.startN ?? 0;
  const turning = OVERS.filter((ov) => ov.endN <= n)
    .map((ov) => ({ ov, swing: stateAt(ov.endN).winProb - stateAt(ov.startN).winProb }))
    .filter((t) => Math.abs(t.swing) >= 0.1)
    .map((t) => `- ${TEAMS[t.ov.i]} innings, over ${t.ov.o + 1} (${fullName(t.ov.bowler)}): ${t.ov.runs} runs, ${t.ov.wkts} wkts, win chance moved ${Math.round(Math.abs(t.swing) * 100)} points toward ${t.swing > 0 ? TEAMS[0] : TEAMS[1]}`)
    .join("\n");

  return [
    "You are Catch Me Up, a friendly live cricket companion inside a sports app, chatting with a fan during a match.",
    SPOILER_RULE,
    "When you mention a player's background, only use things from before this match. Never mention anything later in their careers.",
    "Answer from the match data below. For questions about rules or cricket terms, explain simply from general knowledge. If asked who will win, use the win-chance numbers and what each side needs; frame it as chances, never as a prediction. If the question is not about cricket or this match, steer back to the match politely in one line.",
    "Keep answers short: 2 to 4 sentences, under 70 words, conversational. No markdown headings or bullet lists unless the fan asks for a list.",
    LEVEL_RULES[p.level],
    LANGUAGE_RULES[p.language],
    `FAN\n${profileText(p, n)}`,
    `MATCH\n${MATCH.event}: ${TEAMS[0]} vs ${TEAMS[1]} at ${MATCH.venue}. ${MATCH.toss}.`,
    `NOW\n${situationText(n)}\n${TEAMS[0]} win chance (simple model): ${pct(stateAt(n).winProb)}, ${TEAMS[1]}: ${pct(1 - stateAt(n).winProb)}.`,
    `SCORECARD SO FAR\n${scorecardText(n)}`,
    n > 0 ? `LAST FEW OVERS, BALL BY BALL\n${ballLogText(recentFrom, n)}` : "",
    turning ? `TURNING POINTS SO FAR\n${turning}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export const RECAP_SCHEMA = {
  type: "OBJECT",
  properties: {
    headline: { type: "STRING" },
    bullets: { type: "ARRAY", items: { type: "STRING" }, minItems: 3, maxItems: 3 },
    watchNext: { type: "STRING" },
  },
  required: ["headline", "bullets", "watchNext"],
  propertyOrdering: ["headline", "bullets", "watchNext"],
};

export type AskResponse = { answer: string; source: "ai" | "fallback"; model?: string };

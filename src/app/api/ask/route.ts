import { TEAMS, TOTAL, stateAt } from "@/lib/match";
import { parseProfile } from "@/lib/profile";
import { askSystemPrompt, situationText, type AskResponse } from "@/lib/prompts";
import { generate, type Turn } from "@/lib/gemini";
import { isBall, rateLimited, readJson } from "@/lib/server-utils";

// Two models x 20s timeout, plus headroom.
export const maxDuration = 60;

const MAX_TURNS = 8;
const MAX_CHARS = 600;

function parseTurns(x: unknown): Turn[] | null {
  if (!Array.isArray(x) || x.length === 0 || x.length > 40) return null;
  const turns: Turn[] = [];
  for (const t of x) {
    if (!t || (t.role !== "user" && t.role !== "model") || typeof t.text !== "string" || !t.text.trim()) return null;
    turns.push({ role: t.role, text: t.text.slice(0, MAX_CHARS) });
  }
  const recent = turns.slice(-MAX_TURNS);
  while (recent.length && recent[0].role !== "user") recent.shift();
  return recent.length && recent[recent.length - 1].role === "user" ? recent : null;
}

function fallback(n: number): AskResponse {
  const p = stateAt(n).winProb;
  return {
    answer: `I can't reach the AI right now, but here's where things stand: ${situationText(n)} Win chance: ${TEAMS[0]} ${Math.round(p * 100)}%, ${TEAMS[1]} ${Math.round((1 - p) * 100)}%.`,
    source: "fallback",
  };
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await readJson(request, 32_000)) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const profile = parseProfile(body.profile);
  const turns = parseTurns(body.messages);
  if (!isBall(body.at, TOTAL) || !profile || !turns) {
    return Response.json({ error: "Expected { at, profile, messages } ending with a user message" }, { status: 400 });
  }
  const at = body.at;

  if (rateLimited(request)) return Response.json(fallback(at));

  try {
    const { text, model } = await generate({ system: askSystemPrompt(at, profile), turns, maxTokens: 400, temperature: 0.6 });
    return Response.json({ answer: text.trim(), source: "ai", model } satisfies AskResponse);
  } catch (err) {
    console.warn("[ask] falling back:", err instanceof Error ? err.message : err);
    return Response.json(fallback(at));
  }
}

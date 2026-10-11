import { TOTAL } from "@/lib/match";
import { parseProfile, profileKey } from "@/lib/profile";
import { RECAP_SCHEMA, recapPrompt } from "@/lib/prompts";
import { fallbackRecap, moodFor, type Recap, type RecapResponse } from "@/lib/recap";
import { AIUnavailableError, generateJSON } from "@/lib/gemini";
import { LRU, isBall, rateLimited, readJson } from "@/lib/server-utils";

const cache = new LRU<RecapResponse>();

const clean = (r: Recap): Recap | null => {
  if (typeof r?.headline !== "string" || !Array.isArray(r.bullets) || typeof r.watchNext !== "string") return null;
  const bullets = r.bullets.filter((b): b is string => typeof b === "string" && b.trim().length > 0).slice(0, 3);
  if (bullets.length === 0) return null;
  return { headline: r.headline.trim(), bullets: bullets.map((b) => b.trim()), watchNext: r.watchNext.trim() };
};

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await readJson(request)) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { from, to } = body;
  const profile = parseProfile(body.profile);
  if (!isBall(from, TOTAL) || !isBall(to, TOTAL) || from >= to || !profile) {
    return Response.json({ error: "Expected { from, to, profile } with 0 <= from < to" }, { status: 400 });
  }

  const key = `${from}-${to}-${profileKey(profile)}`;
  const cached = cache.get(key);
  if (cached) return Response.json(cached);

  const mood = moodFor(from, to, profile);
  const fallback = (): RecapResponse => ({ recap: fallbackRecap(from, to), mood, source: "fallback" });

  if (rateLimited(request)) return Response.json(fallback());

  try {
    const { system, user } = recapPrompt(from, to, profile);
    const { data, model } = await generateJSON<Recap>({
      system,
      turns: [{ role: "user", text: user }],
      schema: RECAP_SCHEMA,
      maxTokens: 900,
    });
    const recap = clean(data);
    if (!recap) throw new AIUnavailableError(`${model}: malformed recap`);
    const result: RecapResponse = { recap, mood, source: "ai", model };
    cache.set(key, result);
    return Response.json(result);
  } catch (err) {
    console.warn("[recap] falling back:", err instanceof Error ? err.message : err);
    return Response.json(fallback());
  }
}

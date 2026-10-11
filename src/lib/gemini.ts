// Minimal Gemini REST client (server only: it reads GEMINI_API_KEY).
// Models are tried in order, so a free-tier rate limit on one falls through to the next.

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

const models = () =>
  (process.env.GEMINI_MODEL || "gemini-2.5-flash,gemini-2.5-flash-lite")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

export class AIUnavailableError extends Error {}

export type Turn = { role: "user" | "model"; text: string };

type GenerateOptions = {
  system: string;
  turns: Turn[];
  schema?: object;
  maxTokens?: number;
  temperature?: number;
};

function thinkingConfig(model: string) {
  // Keep latency low: these are short, factual answers.
  if (model.startsWith("gemini-2.5")) return { thinkingBudget: 0 };
  if (model.startsWith("gemini-3")) return { thinkingLevel: "low" };
  return undefined;
}

export async function generate({ system, turns, schema, maxTokens = 700, temperature = 0.7 }: GenerateOptions) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new AIUnavailableError("GEMINI_API_KEY is not set");

  let lastError = "no models configured";
  for (const model of models()) {
    try {
      const res = await fetch(`${ENDPOINT}/${model}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
            ...(schema ? { responseMimeType: "application/json", responseSchema: schema } : {}),
            ...(thinkingConfig(model) ? { thinkingConfig: thinkingConfig(model) } : {}),
          },
        }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) {
        lastError = `${model}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`;
        continue;
      }
      const data = await res.json();
      const text: string = (data.candidates?.[0]?.content?.parts ?? []).map((part: { text?: string }) => part.text ?? "").join("");
      if (!text.trim()) {
        lastError = `${model}: empty response (${data.candidates?.[0]?.finishReason ?? data.promptFeedback?.blockReason ?? "unknown"})`;
        continue;
      }
      return { text, model };
    } catch (err) {
      lastError = `${model}: ${err instanceof Error ? err.message : String(err)}`;
    }
  }
  throw new AIUnavailableError(lastError);
}

export async function generateJSON<T>(opts: GenerateOptions & { schema: object }): Promise<{ data: T; model: string }> {
  const { text, model } = await generate(opts);
  try {
    return { data: JSON.parse(text) as T, model };
  } catch {
    throw new AIUnavailableError(`${model}: response was not valid JSON`);
  }
}

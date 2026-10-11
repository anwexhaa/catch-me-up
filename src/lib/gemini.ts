// Minimal Gemini REST client (server only: it reads GEMINI_API_KEY).
// Models are tried in order, so a free-tier rate limit or an overloaded model falls
// through to the next one.

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

const models = () =>
  (process.env.GEMINI_MODEL || "gemini-3.5-flash,gemini-3.5-flash-lite")
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

// Keep latency low: these are short answers grounded in data we supply.
const thinkingConfig = (model: string) =>
  model.startsWith("gemini-2.5") ? { thinkingBudget: 0 } : { thinkingLevel: "low" };

async function callModel(model: string, key: string, opts: GenerateOptions, withThinking: boolean): Promise<string> {
  const { system, turns, schema, maxTokens = 1024, temperature = 0.7 } = opts;
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
        ...(withThinking ? { thinkingConfig: thinkingConfig(model) } : {}),
      },
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const body = await res.text();
    // Some models reject a given thinking setting; retry once with the model's default.
    if (res.status === 400 && withThinking && /thinking/i.test(body)) return callModel(model, key, opts, false);
    throw new Error(`HTTP ${res.status} ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const text: string = (data.candidates?.[0]?.content?.parts ?? [])
    .filter((part: { thought?: boolean }) => !part.thought)
    .map((part: { text?: string }) => part.text ?? "")
    .join("");
  if (!text.trim()) {
    throw new Error(`empty response (${data.candidates?.[0]?.finishReason ?? data.promptFeedback?.blockReason ?? "unknown"})`);
  }
  return text;
}

async function run<T>(opts: GenerateOptions, accept: (text: string) => T): Promise<{ result: T; model: string }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new AIUnavailableError("GEMINI_API_KEY is not set");
  let lastError = "no models configured";
  for (const model of models()) {
    try {
      return { result: accept(await callModel(model, key, opts, true)), model };
    } catch (err) {
      lastError = `${model}: ${err instanceof Error ? err.message : String(err)}`;
    }
  }
  throw new AIUnavailableError(lastError);
}

export async function generate(opts: GenerateOptions): Promise<{ text: string; model: string }> {
  const { result, model } = await run(opts, (text) => text);
  return { text: result, model };
}

/** Like generate, but parses JSON; a malformed reply falls through to the next model. */
export async function generateJSON<T>(opts: GenerateOptions & { schema: object }): Promise<{ data: T; model: string }> {
  const { result, model } = await run(opts, (text) => JSON.parse(text) as T);
  return { data: result, model };
}

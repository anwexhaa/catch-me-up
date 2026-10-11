// Small helpers for the API routes: best-effort per-IP rate limiting and an in-memory LRU.
// Both live in the serverless instance's memory, which is enough to protect a free-tier
// API key from accidental hammering during a demo.

const hits = new Map<string, number[]>();

export function rateLimited(request: Request, limit = 20, windowMs = 60_000): boolean {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > limit;
}

export class LRU<V> {
  private map = new Map<string, V>();
  constructor(private max = 300) {}
  get(key: string): V | undefined {
    const v = this.map.get(key);
    if (v !== undefined) {
      this.map.delete(key);
      this.map.set(key, v);
    }
    return v;
  }
  set(key: string, value: V) {
    this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.max) this.map.delete(this.map.keys().next().value!);
  }
}

export async function readJson(request: Request, maxBytes = 16_000): Promise<unknown> {
  const text = await request.text();
  if (text.length > maxBytes) throw new Error("Request body too large");
  return JSON.parse(text);
}

export const isBall = (x: unknown, total: number): x is number => Number.isInteger(x) && (x as number) >= 0 && (x as number) <= total;

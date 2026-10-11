// Fan profile: shared by the browser (onboarding, storage) and the API routes (validation, prompts).

import { MATCH, TEAMS } from "./match";

export const LANGUAGES = [
  { id: "en", label: "English", native: "English", speech: "en-IN" },
  { id: "hi", label: "Hindi", native: "हिन्दी", speech: "hi-IN" },
  { id: "hinglish", label: "Hinglish", native: "Hinglish", speech: "en-IN" },
  { id: "bn", label: "Bengali", native: "বাংলা", speech: "bn-IN" },
  { id: "ta", label: "Tamil", native: "தமிழ்", speech: "ta-IN" },
  { id: "te", label: "Telugu", native: "తెలుగు", speech: "te-IN" },
  { id: "mr", label: "Marathi", native: "मराठी", speech: "mr-IN" },
] as const;

export type LanguageId = (typeof LANGUAGES)[number]["id"];

export const LEVELS = [
  { id: "diehard", label: "Die-hard", hint: "Give me the numbers" },
  { id: "casual", label: "Casual", hint: "Keep it simple" },
  { id: "new", label: "New to cricket", hint: "Explain as you go" },
] as const;

export type LevelId = (typeof LEVELS)[number]["id"];

export type Profile = {
  team: string | null; // null = neutral
  favourite: string | null; // player id
  language: LanguageId;
  level: LevelId;
};

export const DEFAULT_PROFILE: Profile = { team: null, favourite: null, language: "en", level: "casual" };

export const languageOf = (id: LanguageId) => LANGUAGES.find((l) => l.id === id)!;

/** Validates untrusted input (request bodies, localStorage) into a Profile, or null. */
export function parseProfile(x: unknown): Profile | null {
  if (!x || typeof x !== "object") return null;
  const p = x as Record<string, unknown>;
  const team = p.team === null || (typeof p.team === "string" && TEAMS.includes(p.team)) ? (p.team as string | null) : undefined;
  const favourite =
    p.favourite === null || (typeof p.favourite === "string" && p.favourite in MATCH.players) ? (p.favourite as string | null) : undefined;
  const language = LANGUAGES.find((l) => l.id === p.language)?.id;
  const level = LEVELS.find((l) => l.id === p.level)?.id;
  if (team === undefined || favourite === undefined || !language || !level) return null;
  return { team, favourite, language, level };
}

export const profileKey = (p: Profile) => `${p.team ?? "neutral"}|${p.favourite ?? "-"}|${p.language}|${p.level}`;

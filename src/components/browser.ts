"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { parseProfile, type Profile } from "@/lib/profile";

// ---------- saved profile (prefills onboarding on return visits) ----------

const KEY = "catch-me-up:profile:v1";
const EVENT = "catch-me-up:profile";

const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
};
const getSnapshot = () => {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export function useSavedProfile(): [Profile | null, (p: Profile) => void] {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const profile = useMemo(() => {
    try {
      return raw ? parseProfile(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  }, [raw]);
  const save = useCallback((p: Profile) => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(p));
      window.dispatchEvent(new Event(EVENT));
    } catch {
      // Storage can be unavailable (private mode); the app keeps the profile in memory anyway.
    }
  }, []);
  return [profile, save];
}

// ---------- read aloud ----------

/** Speaks text with the browser's built-in voices. Returns false if no voice fits the language. */
export function speak(text: string, lang: string, onEnd?: () => void): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  const voices = synth.getVoices();
  const base = lang.split("-")[0].toLowerCase();
  const voice =
    voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase()) ??
    voices.find((v) => v.lang.toLowerCase().replace("_", "-").startsWith(base));
  if (voices.length > 0 && !voice) return false;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  if (voice) u.voice = voice;
  u.rate = 1.02;
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  synth.speak(u);
  return true;
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

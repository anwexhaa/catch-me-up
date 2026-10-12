"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, Square, Volume2 } from "lucide-react";
import { DELIVERIES, MATCH, TEAMS, ballLabel, type MatchState } from "@/lib/match";
import { languageOf, type Profile } from "@/lib/profile";
import { speak, stopSpeaking } from "./browser";

export type ChatMessage = { role: "user" | "model"; text: string; at: number; source?: "ai" | "fallback" };

export function suggestionsFor(s: MatchState, p: Profile): string[] {
  const out: string[] = [];
  const fav = p.favourite ? MATCH.players[p.favourite] : null;
  if (s.phase === "pre") out.push("What should I know before this match?", "Who are the players to watch?");
  if (s.phase === "inn1") out.push(`Is ${s.active.team} on track for a good score?`, "Who's bowling well so far?");
  if (s.phase === "break") out.push(`Is ${s.target! - 1} a good score to defend here?`, `What does ${TEAMS[1]} need to do?`);
  if (s.phase === "inn2") out.push(`Can ${TEAMS[1]} still win this?`, "Who's the danger man right now?");
  if (fav && s.n > 0) out.push(`How has ${fav.name.split(" ").pop()} done today?`);
  if (s.n > 0) out.push("What's been the turning point so far?");
  if (p.level === "new") out.push(s.phase === "inn2" ? "What does 'required run rate' mean?" : "How does T20 cricket work?");
  return out.slice(0, 4);
}

export function AskPanel({
  s,
  profile,
  messages,
  pending,
  onSend,
}: {
  s: MatchState;
  profile: Profile;
  messages: ChatMessage[];
  pending: boolean;
  onSend: (text: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const lang = languageOf(profile.language);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, pending]);

  useEffect(() => stopSpeaking, []);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || pending) return;
    onSend(t);
    setDraft("");
  };

  const toggleSpeak = (k: number, text: string) => {
    if (speakingIdx === k) {
      stopSpeaking();
      setSpeakingIdx(null);
      return;
    }
    if (speak(text, lang.speech, () => setSpeakingIdx(null))) setSpeakingIdx(k);
  };

  return (
    <div className="flex min-h-full flex-col gap-3">
      <section className="rise-in rounded-2xl border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(29,39,51,0.05)]">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <MessageCircle size={16} className="text-accent" /> Ask the match
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          Anything about the game so far, in {lang.label}. Answers only use what has happened up to now, so no spoilers.
        </p>
      </section>

      <div className="flex-1 space-y-3">
        {messages.map((m, k) =>
          m.role === "user" ? (
            <div key={k} className="rise-in ml-10 rounded-2xl rounded-br-md bg-accent px-3.5 py-2.5 text-[14px] text-on-accent shadow-sm">
              {m.text}
            </div>
          ) : (
            <div key={k} className="rise-in mr-6 rounded-2xl rounded-bl-md border border-line border-l-4 border-l-accent-2 bg-surface px-3.5 py-2.5 shadow-sm">
              <p className="whitespace-pre-line text-[14px] leading-relaxed">{m.text}</p>
              <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted">
                <span>
                  {m.at > 0 ? `at ${ballLabel(DELIVERIES[m.at - 1])} ov` : "before the match"}
                  {m.source === "fallback" && " · AI unavailable"}
                </span>
                <button type="button" onClick={() => toggleSpeak(k, m.text)} className="ml-auto hover:text-text" aria-label="Read answer aloud">
                  {speakingIdx === k ? <Square size={11} /> : <Volume2 size={13} />}
                </button>
              </div>
            </div>
          ),
        )}
        {pending && (
          <div className="fade-in mr-6 flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-line bg-surface px-4 py-3.5" aria-label="Thinking">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent-2" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-0 -mx-3 -mb-3 space-y-2 border-t border-line bg-surface/95 p-3 backdrop-blur">
        <div className="scroll-thin -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
          {suggestionsFor(s, profile).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              disabled={pending}
              className="shrink-0 rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-text/85 hover:border-accent hover:text-accent disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
          className="flex items-center gap-2"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={300}
            placeholder="Ask about the match…"
            className="h-11 flex-1 rounded-xl border border-line bg-bg px-3.5 text-[14px] outline-none transition-shadow placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/15"
            aria-label="Your question"
          />
          <button
            type="submit"
            disabled={pending || !draft.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-on-accent shadow-sm hover:bg-[#8f2538] disabled:opacity-40"
            aria-label="Send question"
          >
            <Send size={17} />
          </button>
        </form>
      </div>
    </div>
  );
}

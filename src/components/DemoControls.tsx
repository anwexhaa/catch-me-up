"use client";

import { Pause, Play } from "lucide-react";
import { TOTAL, endOfOver, oversText, scoreText, short, stateAt } from "@/lib/match";
import { SPEEDS, type Speed } from "./useReplayClock";

export const JUMP_POINTS = [
  { label: "First ball", n: 0, joinText: "before the first ball" },
  { label: "IND · over 10", n: endOfOver(0, 10), joinText: "India's innings, after 10 overs" },
  { label: "Innings break", n: endOfOver(0, 20), joinText: "the innings break" },
  { label: "SA chase · over 10", n: endOfOver(1, 10), joinText: "South Africa's chase, after 10 overs" },
  { label: "SA chase · over 15", n: endOfOver(1, 15), joinText: "South Africa's chase, after 15 overs" },
];

export type DemoControlsProps = {
  ball: number;
  playing: boolean;
  speed: Speed;
  onPlay: () => void;
  onPause: () => void;
  onSpeed: (s: Speed) => void;
  onSeek: (n: number) => void;
  children?: React.ReactNode;
};

export function DemoControls({ ball, playing, speed, onPlay, onPause, onSpeed, onSeek, children }: DemoControlsProps) {
  const s = stateAt(ball);
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold">Demo controls</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          The app replays the real ICC Men&apos;s T20 World Cup 2024 final ball by ball, as if it were live. In production this would
          read a live scores feed.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={playing ? onPause : onPlay}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-on-accent shadow-sm hover:bg-[#8f2538]"
          aria-label={playing ? "Pause replay" : "Play replay"}
        >
          {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold tabular-nums">
            {s.active.started ? `${short(s.active.team)} ${scoreText(s.active)} · ${oversText(s.active.balls)} ov` : "Before the first ball"}
          </div>
          <input
            type="range"
            min={0}
            max={TOTAL}
            value={ball}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="mt-1 w-full accent-[var(--accent)]"
            aria-label="Match position"
          />
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">Replay speed</p>
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-surface-2 p-1">
          {SPEEDS.map((sp) => (
            <button
              key={sp.id}
              type="button"
              onClick={() => onSpeed(sp)}
              className={`rounded-lg px-1 py-1.5 text-[11px] ${sp.id === speed.id ? "bg-surface text-text shadow" : "text-muted hover:text-text"}`}
            >
              {sp.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">Jump to</p>
        <div className="flex flex-wrap gap-1.5">
          {JUMP_POINTS.map((j) => (
            <button
              key={j.label}
              type="button"
              onClick={() => onSeek(j.n)}
              className="rounded-full border border-line px-2.5 py-1 text-xs text-muted hover:border-text/30 hover:text-text"
            >
              {j.label}
            </button>
          ))}
        </div>
      </div>

      {children}
    </div>
  );
}

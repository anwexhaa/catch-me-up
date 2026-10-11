"use client";

import { useCallback, useEffect, useState } from "react";
import { TOTAL } from "@/lib/match";

export type Speed = { id: string; label: string; bps: number };

export const SPEEDS: Speed[] = [
  { id: "live", label: "Real pace", bps: 1 / 25 },
  { id: "normal", label: "1 ball / 3s", bps: 1 / 3 },
  { id: "fast", label: "1 ball / s", bps: 1 },
  { id: "turbo", label: "4 balls / s", bps: 4 },
];

type Clock = { playing: boolean; speed: Speed; anchorBall: number; anchorTime: number };

const clampBall = (n: number) => Math.max(0, Math.min(TOTAL, Math.round(n)));

// The position is derived from wall-clock time rather than counted tick by tick, so a
// throttled background tab still "misses" the right number of balls while you're away.
function positionAt(c: Clock, t: number): number {
  if (!c.playing) return c.anchorBall;
  const elapsed = Math.max(0, t - c.anchorTime) / 1000;
  return clampBall(c.anchorBall + Math.floor(elapsed * c.speed.bps));
}

export function useReplayClock(initialBall: number) {
  const [clock, setClock] = useState<Clock>({
    playing: false,
    speed: SPEEDS[1],
    anchorBall: initialBall,
    anchorTime: 0,
  });
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!clock.playing) return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (positionAt(clock, t) >= TOTAL) setClock((c) => ({ ...c, playing: false, anchorBall: TOTAL }));
    };
    const id = setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [clock]);

  const ball = positionAt(clock, now);

  const play = useCallback(() => {
    setClock((c) => ({ ...c, playing: true, anchorBall: c.anchorBall >= TOTAL ? 0 : c.anchorBall, anchorTime: Date.now() }));
  }, []);

  const pause = useCallback(() => {
    setClock((c) => ({ ...c, playing: false, anchorBall: positionAt(c, Date.now()) }));
  }, []);

  const setSpeed = useCallback((speed: Speed) => {
    const t = Date.now();
    setClock((c) => ({ ...c, speed, anchorBall: positionAt(c, t), anchorTime: t }));
  }, []);

  const seek = useCallback((n: number, opts?: { play?: boolean }) => {
    const t = Date.now();
    setNow(t);
    setClock((c) => ({ ...c, playing: opts?.play ?? c.playing, anchorBall: clampBall(n), anchorTime: t }));
  }, []);

  /** Current position computed from the wall clock, for use inside event handlers. */
  const currentBall = useCallback(() => positionAt(clock, Date.now()), [clock]);

  return { ball, playing: clock.playing, speed: clock.speed, play, pause, setSpeed, seek, currentBall };
}

"use client";

import { useState } from "react";
import { DELIVERIES, OVERS, TEAMS, ballLabel, describeBall, short, stateAt, scoreText, SECOND_INNINGS_START } from "@/lib/match";
import { BallChip, Card } from "./ui";

export function BallFeed({ n }: { n: number }) {
  const [shown, setShown] = useState(3);
  const overs = OVERS.filter((ov) => ov.startN < n).reverse();

  if (overs.length === 0) {
    return (
      <Card title="Ball by ball">
        <p className="text-sm text-muted">The first ball hasn&apos;t been bowled yet.</p>
      </Card>
    );
  }

  return (
    <Card title="Ball by ball">
      <div className="space-y-4">
        {overs.slice(0, shown).map((ov) => {
          const upto = Math.min(ov.endN, n);
          const balls = DELIVERIES.slice(ov.startN, upto).reverse();
          const done = n >= ov.endN;
          const runs = DELIVERIES.slice(ov.startN, upto).reduce((a, d) => a + d.t, 0);
          return (
            <div key={`${ov.i}-${ov.o}`}>
              {done && ov.endN === SECOND_INNINGS_START && (
                <p className="mb-3 rounded-lg border border-accent-2/40 bg-surface-2 px-3 py-2 text-center font-display text-[13px] text-text">
                  Innings break · {TEAMS[0]} {scoreText(stateAt(SECOND_INNINGS_START).innings[0])} · {TEAMS[1]} need{" "}
                  {stateAt(SECOND_INNINGS_START).innings[0].runs + 1}
                </p>
              )}
              <div className="mb-1.5 flex items-baseline justify-between text-xs">
                <span className="font-semibold text-text">
                  {short(TEAMS[ov.i])} · Over {ov.o + 1} · {ov.bowler}
                </span>
                <span className="text-muted">
                  {done ? (
                    `${runs} run${runs === 1 ? "" : "s"}${ov.wkts ? `, ${ov.wkts} wkt` : ""} · ${ov.score}`
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-accent">
                      <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent" /> in progress
                    </span>
                  )}
                </span>
              </div>
              <ul className="space-y-1">
                {balls.map((d, k) => (
                  <li key={upto - 1 - k} className="rise-in flex items-center gap-2.5 text-[13px]">
                    <span className="w-8 shrink-0 text-right font-mono text-[11px] text-muted">{ballLabel(d)}</span>
                    <BallChip d={d} size="sm" animate={upto - 1 - k === n - 1} />
                    <span className={d.w ? "font-semibold text-wicket" : d.r >= 4 ? "text-text" : "text-text/75"}>{describeBall(d)}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      {overs.length > shown && (
        <button type="button" onClick={() => setShown((s) => s + 5)} className="mt-4 w-full rounded-lg border border-line py-2 text-xs text-muted hover:border-text/30 hover:text-text">
          Show earlier overs
        </button>
      )}
    </Card>
  );
}

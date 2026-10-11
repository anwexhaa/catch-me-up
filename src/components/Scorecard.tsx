"use client";

import { useState } from "react";
import { fullName, oversText, scoreText, type MatchState } from "@/lib/match";
import { Card, TeamBadge } from "./ui";

export function Scorecard({ s }: { s: MatchState }) {
  const started = s.innings.filter((inn) => inn.started);
  const [pick, setPick] = useState<number | null>(null);
  const idx = pick !== null && s.innings[pick].started ? pick : s.active.index;
  const inn = s.innings[idx];

  if (started.length === 0) {
    return (
      <Card title="Scorecard">
        <p className="text-sm text-muted">The scorecard fills in once the first ball is bowled.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {started.map((x) => (
          <button
            key={x.team}
            type="button"
            onClick={() => setPick(x.index)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2 text-sm ${
              x.index === idx ? "border-text/30 bg-surface-2 text-text" : "border-line text-muted"
            }`}
          >
            <TeamBadge team={x.team} size="sm" /> {scoreText(x)} <span className="text-xs text-muted">({oversText(x.balls)})</span>
          </button>
        ))}
      </div>

      <Card title={`${inn.team} batting`}>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11px] text-muted">
              <th className="pb-2 font-medium">Batter</th>
              <th className="pb-2 text-right font-medium">R</th>
              <th className="pb-2 text-right font-medium">B</th>
              <th className="pb-2 text-right font-medium">4s</th>
              <th className="pb-2 text-right font-medium">6s</th>
              <th className="pb-2 text-right font-medium">SR</th>
            </tr>
          </thead>
          <tbody>
            {inn.batters.map((b) => (
              <tr key={b.id} className="border-t border-line/60 align-top">
                <td className="py-1.5 pr-2">
                  <div className={b.out ? "text-text" : "font-semibold text-text"}>
                    {fullName(b.id)}
                    {!b.out && "*"}
                  </div>
                  <div className="text-[11px] text-muted">{b.out ?? (inn.complete ? "not out" : "batting")}</div>
                </td>
                <td className="py-1.5 text-right font-semibold tabular-nums">{b.runs}</td>
                <td className="py-1.5 text-right tabular-nums text-muted">{b.balls}</td>
                <td className="py-1.5 text-right tabular-nums text-muted">{b.fours}</td>
                <td className="py-1.5 text-right tabular-nums text-muted">{b.sixes}</td>
                <td className="py-1.5 text-right tabular-nums text-muted">{b.balls ? ((b.runs * 100) / b.balls).toFixed(0) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-2 flex justify-between border-t border-line pt-2 text-[13px]">
          <span className="text-muted">Extras {inn.extras}</span>
          <span className="font-semibold">
            Total {scoreText(inn)} ({oversText(inn.balls)} ov)
          </span>
        </div>
        {inn.fow.length > 0 && (
          <p className="mt-2 text-[11px] leading-relaxed text-muted">
            <span className="font-medium text-text/80">Fall of wickets: </span>
            {inn.fow.map((f) => `${f.score}-${f.wkt} (${f.player}, ${f.over})`).join(", ")}
          </p>
        )}
      </Card>

      <Card title={`${inn.bowlingTeam} bowling`}>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11px] text-muted">
              <th className="pb-2 font-medium">Bowler</th>
              <th className="pb-2 text-right font-medium">O</th>
              <th className="pb-2 text-right font-medium">M</th>
              <th className="pb-2 text-right font-medium">R</th>
              <th className="pb-2 text-right font-medium">W</th>
              <th className="pb-2 text-right font-medium">Econ</th>
            </tr>
          </thead>
          <tbody>
            {inn.bowlers.map((b) => (
              <tr key={b.id} className="border-t border-line/60">
                <td className="py-1.5">{fullName(b.id)}</td>
                <td className="py-1.5 text-right tabular-nums text-muted">{oversText(b.balls)}</td>
                <td className="py-1.5 text-right tabular-nums text-muted">{b.maidens}</td>
                <td className="py-1.5 text-right tabular-nums">{b.runs}</td>
                <td className="py-1.5 text-right font-semibold tabular-nums">{b.wkts}</td>
                <td className="py-1.5 text-right tabular-nums text-muted">{b.balls ? ((b.runs * 6) / b.balls).toFixed(2) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

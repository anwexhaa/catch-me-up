import { MATCH, TEAMS, oversText, scoreText, short, type MatchState } from "@/lib/match";
import { BallChip, TeamBadge, WinBar } from "./ui";

const venueParts = MATCH.venue.split(", ");
const VENUE = `${venueParts[0]}, ${venueParts[venueParts.length - 1]}`;

function statusLine(s: MatchState): string {
  const [first, second] = s.innings;
  switch (s.phase) {
    case "pre":
      return MATCH.toss;
    case "inn1":
      return `${short(first.team)} run rate ${s.crr.toFixed(2)}`;
    case "break":
      return `Innings break · ${second.team} need ${s.target} to win`;
    case "inn2":
      return `${short(second.team)} need ${s.need} from ${s.ballsLeft} ball${s.ballsLeft === 1 ? "" : "s"} · RRR ${s.rrr?.toFixed(2)}`;
    case "done":
      return s.result ?? "";
  }
}

export function ScoreHeader({ s }: { s: MatchState }) {
  const batting = s.active;
  const showLive = s.phase === "inn1" || s.phase === "inn2";
  return (
    <section className="rounded-2xl border border-line bg-gradient-to-b from-surface-2 to-surface p-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
        {MATCH.event} · {VENUE}
      </p>

      <div className="mt-3 space-y-2">
        {s.innings.map((inn) => {
          const isBatting = showLive && inn.index === batting.index;
          return (
            <div key={inn.team} className="flex items-center gap-3">
              <TeamBadge team={inn.team} />
              <span className={`flex-1 text-[15px] ${isBatting ? "font-semibold text-text" : "text-muted"}`}>{inn.team}</span>
              {inn.started ? (
                <span className={`tabular-nums ${isBatting ? "text-2xl font-bold" : "text-lg font-semibold text-text/80"}`}>
                  {scoreText(inn)}
                  <span className="ml-1.5 text-xs font-normal text-muted">({oversText(inn.balls)})</span>
                </span>
              ) : (
                <span className="text-sm text-muted">{inn.index === 1 && s.target ? `Target ${s.target}` : "Yet to bat"}</span>
              )}
            </div>
          );
        })}
      </div>

      <p className={`mt-3 text-sm font-medium ${s.phase === "done" ? "text-accent-2" : "text-text"}`}>{statusLine(s)}</p>

      <div className="mt-3">
        <WinBar p={s.winProb} teams={TEAMS} />
      </div>

      {showLive && (
        <div className="mt-4 grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 border-t border-line pt-3 text-[13px]">
          <div className="text-muted">
            <span className="text-text">
              {batting.atCrease
                .map((id) => {
                  const b = batting.batters.find((x) => x.id === id)!;
                  return `${id} ${b.runs}* (${b.balls})`;
                })
                .join("  ·  ")}
            </span>
            {batting.atCrease.length < 2 && <span className="ml-2 text-accent">new batter walking in</span>}
          </div>
          <div className="text-right text-muted">
            {batting.bowler &&
              (() => {
                const bw = batting.bowlers.find((x) => x.id === batting.bowler)!;
                return (
                  <span>
                    <span className="text-text">{bw.id}</span> {oversText(bw.balls)}-{bw.maidens}-{bw.runs}-{bw.wkts}
                  </span>
                );
              })()}
          </div>
          {batting.thisOver.length > 0 && (
            <div className="col-span-2 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs text-muted">This over</span>
              {batting.thisOver.map((d, k) => (
                <BallChip key={k} d={d} size="sm" />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

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

const CALLOUTS = {
  wicket: { text: "WICKET!", className: "bg-wicket text-white" },
  six: { text: "SIX!", className: "bg-six text-white" },
  four: { text: "FOUR!", className: "bg-four text-text" },
};

/** Broadcast-style flash for the ball that was just bowled. Re-mounts (and replays) per ball. */
function Callout({ s }: { s: MatchState }) {
  const d = s.last;
  if (!d || s.phase === "done") return null;
  const kind = d.w ? "wicket" : d.r === 6 ? "six" : d.r === 4 ? "four" : null;
  if (!kind) return null;
  const c = CALLOUTS[kind];
  return (
    <span
      key={s.n}
      className={`callout pointer-events-none absolute right-4 top-3 rounded-md px-2.5 py-1 font-display text-sm font-bold tracking-wider shadow-lg ${c.className}`}
      aria-hidden
    >
      {c.text}
    </span>
  );
}

export function ScoreHeader({ s }: { s: MatchState }) {
  const batting = s.active;
  const showLive = s.phase === "inn1" || s.phase === "inn2";
  return (
    <section className="relative overflow-hidden rounded-2xl bg-board p-4 text-on-board shadow-[0_8px_24px_-12px_rgba(24,63,48,0.6)] ring-1 ring-inset ring-white/10">
      {/* scoreboard frame: gold hairline inset */}
      <div className="pointer-events-none absolute inset-1.5 rounded-xl border border-accent-2/40" aria-hidden />
      <Callout s={s} />

      <p className="relative pr-20 text-[10px] font-medium uppercase tracking-[0.16em] text-on-board-muted">
        {MATCH.event} · {VENUE}
      </p>

      <div className="relative mt-3 space-y-2">
        {s.innings.map((inn) => {
          const isBatting = showLive && inn.index === batting.index;
          return (
            <div key={inn.team} className="flex items-center gap-3">
              <TeamBadge team={inn.team} />
              <span className={`flex-1 text-[15px] ${isBatting ? "font-semibold" : "text-on-board-muted"}`}>
                {inn.team}
                {isBatting && <span className="live-dot ml-2 inline-block h-1.5 w-1.5 rounded-full bg-accent-2 align-middle" />}
              </span>
              {inn.started ? (
                <span className={`font-display tabular-nums ${isBatting ? "text-[28px] font-bold leading-none" : "text-lg font-semibold opacity-80"}`}>
                  <span key={scoreText(inn)} className="score-pop">
                    {scoreText(inn)}
                  </span>
                  <span className="ml-1.5 font-sans text-xs font-normal text-on-board-muted">({oversText(inn.balls)})</span>
                </span>
              ) : (
                <span className="text-sm text-on-board-muted">{inn.index === 1 && s.target ? `Target ${s.target}` : "Yet to bat"}</span>
              )}
            </div>
          );
        })}
      </div>

      <p key={statusLine(s)} className={`fade-in relative mt-3 text-sm font-medium ${s.phase === "done" ? "font-display text-base text-accent-2" : ""}`}>
        {statusLine(s)}
      </p>

      <div className="relative mt-3">
        <WinBar p={s.winProb} teams={TEAMS} />
      </div>

      {showLive && (
        <div className="relative mt-4 grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 border-t border-white/15 pt-3 text-[13px]">
          <div>
            {batting.atCrease
              .map((id) => {
                const b = batting.batters.find((x) => x.id === id)!;
                return `${id} ${b.runs}* (${b.balls})`;
              })
              .join("  ·  ")}
            {batting.atCrease.length < 2 && <span className="ml-2 text-accent-2">new batter walking in</span>}
          </div>
          <div className="text-right text-on-board-muted">
            {batting.bowler &&
              (() => {
                const bw = batting.bowlers.find((x) => x.id === batting.bowler)!;
                return (
                  <span>
                    <span className="text-on-board">{bw.id}</span> {oversText(bw.balls)}-{bw.maidens}-{bw.runs}-{bw.wkts}
                  </span>
                );
              })()}
          </div>
          {batting.thisOver.length > 0 && (
            <div className="col-span-2 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs text-on-board-muted">This over</span>
              {batting.thisOver.map((d, k) => (
                <BallChip key={`${d.i}-${d.o}-${k}`} d={d} size="sm" animate={k === batting.thisOver.length - 1} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

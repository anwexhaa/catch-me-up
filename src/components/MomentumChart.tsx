import { DELIVERIES, SECOND_INNINGS_START, TEAMS, TOTAL, WIN_SERIES, short, turningPoints, type TurningPoint } from "@/lib/match";
import { Card, TEAM_COLOR } from "./ui";

const W = 340;
const H = 132;
const TOP = 10;
const BOTTOM = 22;
const PLOT_H = H - TOP - BOTTOM;
const x = (n: number) => (n / TOTAL) * W;
const y = (p: number) => TOP + (1 - p) * PLOT_H;
const MID = y(0.5);

export function MomentumChart({ n, onExplain }: { n: number; onExplain?: (tp: TurningPoint) => void }) {
  const pts = WIN_SERIES.slice(0, n + 1).map((p, k) => `${x(k).toFixed(1)},${y(p).toFixed(1)}`);
  const line = `M${pts.join(" L")}`;
  const area = `M0,${MID} L${pts.join(" L")} L${x(n).toFixed(1)},${MID} Z`;
  const tps = turningPoints(n);
  const wickets = DELIVERIES.slice(0, n)
    .map((d, k) => (d.w ? k + 1 : -1))
    .filter((k) => k > 0);

  return (
    <Card title="Momentum">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Win chance over the match. ${TEAMS[0]} above the middle line, ${TEAMS[1]} below.`}>
        <defs>
          <clipPath id="above">
            <rect x="0" y="0" width={W} height={MID} />
          </clipPath>
          <clipPath id="below">
            <rect x="0" y={MID} width={W} height={H} />
          </clipPath>
        </defs>

        <line x1="0" x2={W} y1={MID} y2={MID} stroke="var(--line)" strokeDasharray="3 4" />
        <line x1={x(SECOND_INNINGS_START)} x2={x(SECOND_INNINGS_START)} y1={TOP - 6} y2={H - BOTTOM + 4} stroke="var(--line)" />
        <text x="2" y={TOP + 2} fill={TEAM_COLOR[TEAMS[0]]} fontSize="9" fontWeight="600">
          {short(TEAMS[0])} ahead
        </text>
        <text x="2" y={H - BOTTOM - 3} fill={TEAM_COLOR[TEAMS[1]]} fontSize="9" fontWeight="600">
          {short(TEAMS[1])} ahead
        </text>
        <text x={x(SECOND_INNINGS_START / 2)} y={H - 6} fill="var(--muted)" fontSize="9" textAnchor="middle">
          {short(TEAMS[0])} batting
        </text>
        <text x={x((SECOND_INNINGS_START + TOTAL) / 2)} y={H - 6} fill="var(--muted)" fontSize="9" textAnchor="middle">
          {short(TEAMS[1])} chasing
        </text>

        {n > 0 && (
          <>
            <path d={area} fill={TEAM_COLOR[TEAMS[0]]} opacity="0.22" clipPath="url(#above)" />
            <path d={area} fill={TEAM_COLOR[TEAMS[1]]} opacity="0.22" clipPath="url(#below)" />
            <path d={line} fill="none" stroke="var(--text)" strokeWidth="1.6" strokeLinejoin="round" />
          </>
        )}

        {wickets.map((k) => (
          <circle key={k} cx={x(k)} cy={y(WIN_SERIES[k])} r="2.4" fill="var(--wicket)" />
        ))}

        {tps.map((tp, k) => (
          <g key={tp.n}>
            <circle cx={x(tp.n)} cy={y(WIN_SERIES[tp.n])} r="7" fill="var(--accent-2)" />
            <text x={x(tp.n)} y={y(WIN_SERIES[tp.n]) + 3} fontSize="9" fontWeight="700" textAnchor="middle" fill="#000">
              {k + 1}
            </text>
          </g>
        ))}

        <circle cx={x(n)} cy={y(WIN_SERIES[n])} r="3.5" fill="var(--accent)" className="live-dot" />
      </svg>

      <div className="mt-2 flex items-center gap-3 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-wicket" /> wicket
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-accent-2" /> turning point
        </span>
        <span className="ml-auto">Simple resources model</span>
      </div>

      {tps.length > 0 && (
        <ol className="mt-3 space-y-1.5">
          {tps.map((tp, k) => {
            const toward = tp.swing > 0 ? TEAMS[0] : TEAMS[1];
            const inner = (
              <>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-2 text-[10px] font-bold text-black">{k + 1}</span>
                <span className="flex-1">
                  {short(TEAMS[tp.over.i])} over {tp.over.o + 1} · {tp.over.bowler} · {tp.over.runs} run{tp.over.runs === 1 ? "" : "s"}
                  {tp.over.wkts ? `, ${tp.over.wkts} wkt` : ""}
                </span>
                <span className="font-semibold" style={{ color: TEAM_COLOR[toward] }}>
                  +{Math.round(Math.abs(tp.swing) * 100)} {short(toward)}
                </span>
              </>
            );
            return (
              <li key={tp.n}>
                {onExplain ? (
                  <button
                    type="button"
                    onClick={() => onExplain(tp)}
                    className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left text-[13px] hover:bg-surface-2"
                  >
                    {inner}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-1.5 py-1 text-[13px]">{inner}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

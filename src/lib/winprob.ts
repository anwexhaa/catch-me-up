// A deliberately simple, explainable T20 win-chance model.
//
// "Resources" follow the Duckworth-Lewis idea: the runs a side can still expect depend
// on balls left and wickets in hand. We turn expected runs into a win chance with a
// normal approximation. It is not a betting-grade model; it exists so the app can show
// momentum and spot turning points without any external service.

const PAR_TOTAL = 170; // typical 20-over total in a big tournament match
const DECAY = 0.02;
// Share of full scoring potential left with N wickets down (index = wickets lost).
const WICKET_FACTOR = [1, 0.93, 0.85, 0.75, 0.64, 0.52, 0.4, 0.28, 0.17, 0.08];
const FULL = 1 - Math.exp(-DECAY * 20);

function resource(ballsLeft: number, wktsLost: number): number {
  if (wktsLost >= 10 || ballsLeft <= 0) return 0;
  const f = WICKET_FACTOR[wktsLost];
  return (f * (1 - Math.exp((-DECAY * (ballsLeft / 6)) / f))) / FULL;
}

export function expectedRuns(ballsLeft: number, wktsLost: number): number {
  return PAR_TOTAL * resource(ballsLeft, wktsLost);
}

const spread = (expected: number) => 2 * Math.sqrt(Math.max(expected, 0));

// Standard normal CDF (Abramowitz & Stegun 7.1.26).
function phi(z: number): number {
  const t = 1 / (1 + 0.3275911 * (Math.abs(z) / Math.SQRT2));
  const poly =
    t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1 - poly * Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

const clamp = (p: number) => Math.min(0.99, Math.max(0.01, p));

/** Chance the chasing side gets `need` more runs. */
export function chaseWinProb(need: number, ballsLeft: number, wktsLost: number): number {
  if (need <= 0) return 1;
  if (ballsLeft <= 0 || wktsLost >= 10) return 0;
  const e = expectedRuns(ballsLeft, wktsLost);
  return clamp(phi((e - need + 0.5) / Math.max(spread(e), 1.5)));
}

/** Chance the side batting first wins, given its innings so far. */
export function firstInningsWinProb(runs: number, ballsLeft: number, wktsLost: number): number {
  const rest = expectedRuns(ballsLeft, wktsLost);
  const projected = runs + rest;
  const s = Math.hypot(spread(rest), spread(PAR_TOTAL));
  return clamp(1 - phi((PAR_TOTAL - (projected + 1) + 0.5) / s));
}

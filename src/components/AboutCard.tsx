import type { Scenario } from "@/lib/scenarios";
import { ScenarioList } from "./Scenarios";

const STEPS = [
  <>Pick a fan scenario, or set your own team, favourite player and language.</>,
  <>
    Tap <b>Catch me up</b> for the story so far.
  </>,
  <>
    Hit <b>Step away · 5 overs</b>. When you&apos;re back, you get a recap of just what you missed.
  </>,
  <>
    Tap a turning point on the momentum chart, or ask anything in <b>Ask</b>.
  </>,
];

export function AboutCard({ onPick }: { onPick?: (s: Scenario) => void }) {
  return (
    <div className="space-y-4 text-[13px] leading-relaxed">
      <div>
        <h2 className="font-display text-base font-bold">Try it in 60 seconds</h2>
        <ol className="mt-2 space-y-1.5">
          {STEPS.map((step, k) => (
            <li key={k} className="flex gap-2.5 text-text/85">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[11px] font-semibold text-accent">
                {k + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <ScenarioList onPick={onPick} />

      <div>
        <h2 className="font-display text-base font-bold">The fan problem</h2>
        <p className="mt-1 text-muted">
          Most fans can&apos;t sit through a 3½-hour T20. They check in between work, classes and commutes, and the scoreboard gives
          them numbers, not the story. Catch Me Up tells you what you missed, for you: your team, your favourite player, your
          language and how much cricket you know.
        </p>
      </div>

      <div>
        <h2 className="font-display text-base font-bold">Under the hood</h2>
        <p className="mt-1 text-muted">
          A replay engine and a simple win-chance model run in the browser. Recaps and answers come from Google Gemini, which only
          ever sees the match up to the current ball, so nothing is spoiled. If the AI is unavailable, a rule-based summary steps in.
        </p>
      </div>

      <p className="border-t border-line pt-3 text-[11px] text-muted">
        Built by Anwesha for the Dream11 Forward Deployed Engineer Intern assignment. Ball-by-ball data from Cricsheet.
      </p>
    </div>
  );
}

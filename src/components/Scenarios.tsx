import { X } from "lucide-react";
import { languageOf } from "@/lib/profile";
import { SCENARIOS, initials, type Scenario } from "@/lib/scenarios";
// One colour per fan so the avatars are easy to tell apart.
const AVATAR_COLORS = ["var(--accent)", "var(--ind)", "var(--sa)", "var(--accent-2)", "var(--six)"];
const avatarColor = (s: Scenario) => AVATAR_COLORS[SCENARIOS.findIndex((x) => x.id === s.id) % AVATAR_COLORS.length];

function Avatar({ s, size = "md" }: { s: Scenario; size?: "sm" | "md" }) {
  const dims = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-display font-bold text-white ring-2 ring-surface ${dims}`}
      style={{ background: avatarColor(s) }}
      aria-hidden
    >
      {initials(s)}
    </span>
  );
}

/** One-tap demo presets shown on the welcome screen. */
export function ScenarioPicker({ onPick }: { onPick: (s: Scenario) => void }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-sm font-semibold">Or step into a fan&apos;s shoes</p>
        <span className="text-[11px] text-muted">illustrative fans</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {SCENARIOS.map((s, k) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onPick(s)}
            className={`rise-in group flex flex-col gap-1.5 rounded-xl border border-line bg-surface p-3 text-left hover:border-accent hover:shadow-md ${
              SCENARIOS.length % 2 === 1 && k === SCENARIOS.length - 1 ? "col-span-2" : ""
            }`}
            style={{ animationDelay: `${0.12 + k * 0.06}s` }}
            aria-label={`Try the app as ${s.name} from ${s.place}`}
          >
            <span className="flex items-center gap-2">
              <Avatar s={s} size="sm" />
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold leading-tight">
                  {s.name}, {s.age}
                </span>
                <span className="block text-[11px] text-muted">{s.place}</span>
              </span>
            </span>
            <span className="line-clamp-2 text-[11px] leading-snug text-text/75">{s.need}</span>
            <span className="text-[11px] font-semibold text-accent transition-transform group-hover:translate-x-0.5">
              Try as {s.name} →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** "Playing as …" context shown above the live screen while a scenario is active. */
export function ScenarioStrip({ s, onClose }: { s: Scenario; onClose: () => void }) {
  return (
    <section className="rise-in rounded-2xl border border-accent-2/40 bg-surface-2/70 p-3">
      <div className="flex items-start gap-2.5">
        <Avatar s={s} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] leading-snug">
            <span className="font-semibold">
              Playing as {s.name}, {s.age}
            </span>{" "}
            <span className="text-muted">· {s.place}</span>
          </p>
          <p className="mt-0.5 text-[12px] leading-snug text-text/80">{s.situation}</p>
          <p className="mt-1 text-[12px] leading-snug">
            <span className="font-semibold text-accent">Needs: </span>
            {s.need}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {s.features.map((f) => (
              <span key={f} className="rounded-full border border-accent-2/50 bg-surface px-2 py-0.5 text-[10px] font-medium text-accent-2">
                {f}
              </span>
            ))}
          </div>
        </div>
        <button type="button" onClick={onClose} className="text-muted hover:text-text" aria-label="Stop playing as this fan">
          <X size={16} />
        </button>
      </div>
    </section>
  );
}

/** Who the app is for: need → feature, for the side panel. */
export function ScenarioList({ onPick }: { onPick?: (s: Scenario) => void }) {
  return (
    <div>
      <h2 className="font-display text-base font-bold">Who it&apos;s for</h2>
      <p className="mt-0.5 text-[11px] text-muted">Illustrative fans and the need each feature meets.</p>
      <ul className="mt-2 space-y-2.5">
        {SCENARIOS.map((s) => (
          <li key={s.id} className="flex gap-2.5">
            <Avatar s={s} size="sm" />
            <div className="min-w-0 flex-1 text-[12px] leading-snug">
              <p>
                <span className="font-semibold">
                  {s.name}, {s.age}
                </span>{" "}
                <span className="text-muted">
                  · {s.place} · {languageOf(s.profile.language).label}
                </span>
              </p>
              <p className="text-text/80">{s.need}</p>
              <p className="mt-0.5 text-accent-2">{s.features.join(" · ")}</p>
            </div>
            {onPick && (
              <button
                type="button"
                onClick={() => onPick(s)}
                className="h-fit shrink-0 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-accent hover:border-accent"
              >
                Try
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

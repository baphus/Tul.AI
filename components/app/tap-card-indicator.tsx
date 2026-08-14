import { MoveUpLeftIcon } from "lucide-react";

/**
 * Decorative prompt for a tappable card. The parent must be positioned relative;
 * the indicator deliberately ignores pointer input so the card keeps its gesture.
 */
export function TapCardIndicator() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-[-1.55rem] bottom-[-1.15rem] z-10 flex items-end gap-1.5 motion-safe:animate-[tap-card-wiggle_2.4s_cubic-bezier(.16,1,.3,1)_infinite]"
    >
      <span className="t-caption-strong rounded-lg border-[3px] border-ink bg-warning px-2.5 py-1 text-ink shadow-[3px_3px_0_var(--ink)]">
        Tap me!
      </span>
      <MoveUpLeftIcon
        className="mb-0.5 size-11 -rotate-6 text-ink drop-shadow-[2px_2px_0_var(--warning)]"
        strokeWidth={3}
        aria-hidden="true"
      />
    </div>
  );
}

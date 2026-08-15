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
      <svg viewBox="0 0 72 72" className="mb-0.5 size-13 -rotate-6 overflow-visible" fill="none" aria-hidden="true">
        <path d="M63 60C55 58 50 52 46 45C42 38 37 34 29 31C21 28 16 22 11 14" stroke="var(--warning)" strokeWidth="7" strokeLinecap="round" />
        <path d="M63 60C55 58 50 52 46 45C42 38 37 34 29 31C21 28 16 22 11 14" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" strokeDasharray="3 2" />
        <path d="M11 14L13 31M11 14L28 16" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

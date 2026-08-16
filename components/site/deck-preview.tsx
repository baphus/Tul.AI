import { ArrowUpIcon, CheckIcon, ShieldCheckIcon, XIcon } from "lucide-react";

import { MatchMetric } from "@/components/scholarship/match-metric";
import { ProviderCrest, providerTint } from "@/components/scholarship/provider-logo";
import { RequirementMark } from "@/components/scholarship/requirement-mark";
import { benefitSummary } from "@/lib/logic/format";
import type { Scholarship } from "@/lib/scholarships";
import { cn } from "@/lib/utils";

/**
 * The product itself, standing in for the portrait subject DESIGN.md's hero
 * asks for. It is the real card with real data rather than an illustration —
 * decorative, because every claim on it is also stated in the surrounding copy.
 */
export function DeckPreview({
  card,
  index,
  controls = false,
  className,
}: {
  card: Scholarship;
  index: number;
  controls?: boolean;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none select-none", className)}>
      <div className="relative mx-auto w-full max-w-[23rem]">
        {/* The rest of the deck, waiting underneath. */}
        <div className="absolute inset-x-7 top-7 h-full rounded-xl border border-hairline bg-canvas/45" />
        <div className="absolute inset-x-3.5 top-3.5 h-full rounded-xl border border-hairline bg-canvas/75" />

        <div
          className="tinted relative flex flex-col overflow-hidden rounded-xl border border-[color:var(--tint-border)] p-5 shadow-[0_20px_50px_-12px_rgba(14,15,12,0.4)]"
          style={{ ...providerTint(index), background: "var(--tint-face)" }}
        >
          <div className="flex items-start justify-between gap-3">
            <span className="t-micro inline-flex items-center gap-1.5 rounded-full border border-met/25 bg-met/8 px-2.5 py-1 text-met">
              <ShieldCheckIcon className="size-3" />
              {card.verification}
            </span>
          </div>

          <div className="mt-5 flex items-center gap-2.5">
            <ProviderCrest index={index} provider={card.provider} logo={card.logo} className="size-9" />
            <span className="t-caption text-[color:var(--tint-ink)]">{card.provider}</span>
          </div>

          <h3 className="t-display-md mt-3 text-ink">{card.title}</h3>

          <p className="mt-5 flex items-baseline gap-2">
            <span className={cn("text-ink", card.amount > 0 ? "t-figure" : "t-caption leading-snug")}>{benefitSummary(card)}</span>
            <span className="t-micro text-ink-mute">{card.amountNote}</span>
          </p>

          <div className="mt-5 border-t border-hairline pt-4">
            <ul className="flex flex-col gap-2.5">
              {card.why.map((w) => (
                <li key={w.label} className="flex items-center gap-2.5">
                  <RequirementMark state={w.state} size="sm" />
                  <span className="t-caption text-ink">{w.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <MatchMetric card={card} className="mt-5" />

          <div className="mt-4 flex items-end justify-between border-t border-hairline pt-4">
            <span>
              <span className="t-micro block text-ink-mute">Closes</span>
              <span className="t-body-strong t-num block text-ink">{card.deadline}</span>
            </span>
            <span
              className={cn(
                "t-body-strong",
                card.tone === "strong" ? "text-met" : "text-attention-ink"
              )}
            >
              {card.match}
            </span>
          </div>
        </div>

        {controls && (
          <div className="mt-6 flex items-center justify-center gap-6">
            {[
              { Icon: XIcon, label: "Pass", solid: false },
              { Icon: ArrowUpIcon, label: "Details", solid: false, small: true },
              { Icon: CheckIcon, label: "Interested", solid: true },
            ].map(({ Icon, label, solid, small }) => (
              <span key={label} className="flex flex-col items-center gap-2">
                <span
                  className={cn(
                    "grid place-items-center rounded-full",
                    small ? "size-12" : "size-14",
                    solid
                      ? "bg-ink text-white shadow-[0_8px_24px_-6px_rgba(14,15,12,0.5)]"
                      : "border border-hairline bg-canvas text-ink-mute"
                  )}
                >
                  <Icon className={small ? "size-4" : "size-5"} />
                </span>
                <span className="t-micro text-ink-mute">{label}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { ProviderCrest } from "@/components/scholarship/provider-logo";
import { DeadlineChip } from "@/components/scholarship/deadline-chip";
import { VerificationBadge } from "@/components/scholarship/verification-badge";
import type { RankedMatch } from "@/lib/logic/matching";
import type { Scholarship } from "@/lib/scholarships";
import { cn } from "@/lib/utils";

const MATCH_TONE = {
  strong: "text-met",
  good: "text-ink",
  possible: "text-attention-ink",
  none: "text-ink-mute",
} as const;

/** The one published fact that earns space on the discovery card. */
function matchReason(result: RankedMatch) {
  return (
    result.checks.find((check) => check.state === "met")?.detail ??
    result.checks.find((check) => check.state === "unknown")?.detail ??
    "Review the published requirements before deciding whether to save this opportunity."
  );
}

/**
 * The discovery surface is intentionally a single, calm decision brief. Full
 * eligibility evidence belongs in the record, not behind a card flip.
 */
export function ScholarshipCard({
  card,
  index,
  result,
}: {
  card: Scholarship;
  index: number;
  result: RankedMatch;
}) {
  return (
    <article className="absolute inset-0 flex flex-col rounded-xl bg-canvas p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <ProviderCrest
            index={index}
            provider={card.provider}
            logo={card.logo}
            className="size-10 rounded-md border-hairline"
          />
          <p className="t-caption-strong min-w-0 text-ink-mute">{card.provider}</p>
        </div>
        <p className={cn("t-caption-strong flex-none", MATCH_TONE[result.tone])}>
          {result.match}
        </p>
      </div>

      <h2 className="t-display-lg mt-8 text-balance">{card.title}</h2>
      <p className="t-body mt-5 max-w-[38ch] text-ink-mute text-pretty">
        {matchReason(result)}
      </p>

      <div className="mt-auto border-t border-hairline pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="t-micro mb-1.5 text-ink-mute">Application deadline</p>
            <DeadlineChip deadline={card.deadline} deadlineIso={card.deadlineIso} />
          </div>
          <VerificationBadge
            status={card.verification}
            lastVerified={card.lastVerified}
            className="max-w-full"
          />
        </div>
      </div>
    </article>
  );
}

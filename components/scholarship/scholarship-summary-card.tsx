import Link from "next/link";
import type { ReactNode } from "react";

import { DeadlineChip } from "@/components/scholarship/deadline-chip";
import { MatchMetric } from "@/components/scholarship/match-metric";
import { ProviderCrest } from "@/components/scholarship/provider-logo";
import { VerificationBadge } from "@/components/scholarship/verification-badge";
import { formatPeso } from "@/lib/logic/format";
import { ROUTES } from "@/lib/logic/routes";
import type { Scholarship } from "@/lib/scholarships";
import { cn } from "@/lib/utils";

/**
 * The scholarship as a row: provider, name, benefit, deadline, verification and
 * the requirement metric. Used by the directory, the review screen and the
 * saved list so one programme reads the same everywhere.
 */
export function ScholarshipSummaryCard({
  card,
  index,
  href,
  actions,
  muted = false,
  className,
}: {
  card: Scholarship;
  index: number;
  href?: string;
  actions?: ReactNode;
  muted?: boolean;
  className?: string;
}) {
  const target = href ?? ROUTES.scholarship(card.id);

  return (
    <article
      className={cn(
        "rounded-lg border border-hairline p-5 transition-colors sm:p-6",
        muted ? "bg-canvas-soft" : "bg-canvas hover:border-hairline-dark/30",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <ProviderCrest
          index={index}
          provider={card.provider}
          logo={card.logo}
          className={cn(muted && "opacity-70")}
        />
        <div className="min-w-0 flex-1">
          <p className="t-eyebrow text-ink-mute">{card.provider}</p>
          <h3 className="t-display-md mt-1">
            <Link
              href={target}
              className="ring-brand rounded-xs hover:underline hover:decoration-hairline-dark hover:underline-offset-4"
            >
              {card.title}
            </Link>
          </h3>
        </div>
        <div className="hidden text-right sm:block">
          <p className="t-display-md t-num">{formatPeso(card.amount)}</p>
          <p className="t-micro mt-0.5 text-ink-mute">{card.amountNote}</p>
        </div>
      </div>

      <p className="t-body mt-4 text-ink-mute sm:hidden">
        <span className="t-body-strong t-num text-ink">{formatPeso(card.amount)}</span>{" "}
        {card.amountNote}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <DeadlineChip deadline={card.deadline} deadlineIso={card.deadlineIso} />
        <VerificationBadge
          status={card.verification}
          lastVerified={card.lastVerified}
          showDate={false}
        />
      </div>

      <MatchMetric card={card} className="mt-4" />

      {actions && <div className="mt-5 flex flex-wrap gap-2">{actions}</div>}
    </article>
  );
}

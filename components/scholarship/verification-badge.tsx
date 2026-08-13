import { CircleAlertIcon, CircleHelpIcon, CircleSlashIcon, RefreshCwIcon, ShieldCheckIcon } from "lucide-react";

import { formatIsoDate } from "@/lib/logic/deadlines";
import type { VerificationStatus } from "@/lib/scholarships";
import { cn } from "@/lib/utils";

const STYLE: Record<VerificationStatus, { class: string; Icon: typeof ShieldCheckIcon; help: string }> = {
  Verified: {
    class: "border-met/25 bg-met/8 text-met",
    Icon: ShieldCheckIcon,
    help: "Confirmed against the provider's own published information.",
  },
  "Needs Verification": {
    class: "border-attention/25 bg-attention/8 text-attention-ink",
    Icon: CircleAlertIcon,
    help: "The programme exists, but something material could not be confirmed.",
  },
  Updated: {
    class: "border-ink/20 bg-ink/6 text-ink",
    Icon: RefreshCwIcon,
    help: "The published information changed since we last checked.",
  },
  Expired: {
    class: "border-hairline bg-canvas-soft text-ink-mute",
    Icon: CircleSlashIcon,
    help: "The application period has ended.",
  },
  Unknown: {
    class: "border-hairline bg-canvas-soft text-ink-mute",
    Icon: CircleHelpIcon,
    help: "Not enough information to confirm this record.",
  },
};

/**
 * Verification state + the date it was last checked (PRD §31). Both are always
 * shown together — a state without a timestamp is not a trust signal.
 */
export function VerificationBadge({
  status,
  lastVerified,
  className,
  showDate = true,
}: {
  status: VerificationStatus;
  lastVerified: string;
  className?: string;
  showDate?: boolean;
}) {
  const { class: tone, Icon } = STYLE[status];

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-x-2 gap-y-1", className)}>
      <span
        className={cn("t-micro inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1", tone)}
      >
        <Icon className="size-3" aria-hidden="true" />
        {status}
      </span>
      {showDate && (
        <span className="t-micro text-ink-mute">
          Last verified{" "}
          <time dateTime={lastVerified}>{formatIsoDate(lastVerified)}</time>
        </span>
      )}
    </span>
  );
}

export function verificationHelp(status: VerificationStatus): string {
  return STYLE[status].help;
}

/** Source-trust tier, in the words of the trust hierarchy (PRD §15). */
export function sourceTierLabel(tier: 1 | 2 | 3 | 4): string {
  switch (tier) {
    case 1:
      return "Tier 1 · official provider source";
    case 2:
      return "Tier 2 · official document or notice";
    case 3:
      return "Tier 3 · trusted secondary source";
    case 4:
      return "Tier 4 · informal source, discovery only";
  }
}

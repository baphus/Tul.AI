"use client";

import { CircleAlertIcon, CircleHelpIcon, CircleSlashIcon, RefreshCwIcon, ShieldCheckIcon } from "lucide-react";

import type { VerificationStatus } from "@/lib/scholarships";
import { useLanguage } from "@/lib/logic/language";
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
    help: "The provider's published information changed.",
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
 * Verification state is the student-facing trust signal. The underlying check
 * timestamp remains in the record for audit and operations, not UI clutter.
 */
export function VerificationBadge({
  status,
  className,
}: {
  status: VerificationStatus;
  className?: string;
}) {
  const { class: tone, Icon } = STYLE[status];
  const language = useLanguage();
  const labels: Record<typeof language, Record<VerificationStatus, string>> = {
    ENG: { Verified: "Verified", "Needs Verification": "Needs Verification", Updated: "Updated", Expired: "Expired", Unknown: "Unknown" },
    FIL: { Verified: "Na-verify", "Needs Verification": "Kailangang i-verify", Updated: "Na-update", Expired: "Paso na", Unknown: "Hindi alam" },
    BIS: { Verified: "Napamatud-an", "Needs Verification": "Kinahanglan pamatuoran", Updated: "Na-update", Expired: "Natapos na", Unknown: "Wala mahibal-i" },
  };

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-x-2 gap-y-1", className)}>
      <span
        className={cn("t-micro inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1", tone)}
      >
        <Icon className="size-3" aria-hidden="true" />
        {labels[language][status]}
      </span>
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

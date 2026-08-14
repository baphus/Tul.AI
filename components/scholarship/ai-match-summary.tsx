"use client";

import { SparklesIcon } from "lucide-react";

import type { RankedMatch } from "@/lib/logic/matching";

function fallbackSummary(result: RankedMatch): string {
  const lead = result.checks.find((check) => check.state === "met");
  const next = result.checks.find((check) => check.state !== "met");
  if (lead && next?.state === "unknown") {
    return `Here’s what stands out: ${lead.detail} One detail is still worth confirming: ${next.detail}`;
  }
  if (lead && next) {
    return `Here’s what stands out: ${lead.detail} Keep this in mind: ${next.detail}`;
  }
  if (lead) {
    return `Here’s what stands out: ${lead.detail} Based on the published requirements, this is a ${result.match.toLowerCase()}.`;
  }
  if (next) {
    return `Here’s the key detail to review: ${next.detail} The published checks currently place this in ${result.match.toLowerCase()}.`;
  }
  return `Tul.AI’s read: ${result.match}, based on the published requirements available for this programme.`;
}

/**
 * Advisory prose over a deterministic result. This never changes a check,
 * score, ranking, or eligibility decision.
 */
export function AiMatchSummary({ result, compact = false }: { result?: RankedMatch; compact?: boolean }) {
  if (!result) return null;

  const summary = fallbackSummary(result);

  return (
    <aside className={compact ? "mt-2" : "mt-5 rounded-lg border border-hairline bg-canvas-soft p-4"} aria-label="Tul.AI match insight">
      <div className="flex items-start gap-3">
        <SparklesIcon className="mt-0.5 size-4 flex-none text-ink-deep" aria-hidden="true" />
        <div>
          <p className={compact ? "t-caption-strong" : "t-body-strong"}>Tul.AI match insight</p>
          <p className="t-caption mt-1 text-ink-mute text-pretty">{summary}</p>
          {!compact && <p className="t-micro mt-2 text-ink-mute">
            A clear read of the published checks below; it does not decide eligibility.
          </p>}
        </div>
      </div>
    </aside>
  );
}

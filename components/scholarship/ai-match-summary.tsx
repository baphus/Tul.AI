"use client";

import { SparklesIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { useLanguage } from "@/lib/logic/language";
import { aiReRank } from "@/lib/logic/matching.ai";
import type { RankedMatch } from "@/lib/logic/matching";

function fallbackSummary(result: RankedMatch): string {
  const lead = result.checks.find((check) => check.state === "met");
  const next = result.checks.find((check) => check.state !== "met");
  return [lead?.detail, next?.detail].filter(Boolean).join(" ") || result.match;
}

/**
 * Advisory prose over a deterministic result. This never changes a check,
 * score, ranking, or eligibility decision.
 */
export function AiMatchSummary({ result, compact = false }: { result?: RankedMatch; compact?: boolean }) {
  const language = useLanguage();
  const [generated, setGenerated] = useState<{ id: string; summary: string } | null>(null);

  useEffect(() => {
    if (!result) return;
    let cancelled = false;

    aiReRank([result], undefined, language).then(({ explanations, generated }) => {
      const explanation = explanations.find((item) => item.id === result.id)?.reason;
      if (!cancelled && explanation) {
        setGenerated(generated ? { id: result.id, summary: explanation } : null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [language, result]);

  if (!result) return null;

  const aiGenerated = generated?.id === result.id;
  const summary = aiGenerated ? generated.summary : fallbackSummary(result);

  return (
    <aside className={compact ? "mt-2" : "mt-5 rounded-lg border border-hairline bg-canvas-soft p-4"} aria-label="AI explanation">
      <div className="flex items-start gap-3">
        <SparklesIcon className="mt-0.5 size-4 flex-none text-ink-deep" aria-hidden="true" />
        <div>
          <p className={compact ? "t-caption-strong" : "t-body-strong"}>{aiGenerated ? "AI summary" : "Match summary"}</p>
          <p className="t-caption mt-1 text-ink-mute text-pretty">{summary}</p>
          {!compact && <p className="t-micro mt-2 text-ink-mute">
            {aiGenerated
              ? "Generated from the published checks below; it does not decide eligibility."
              : "Based on the published checks below; it does not decide eligibility."}
          </p>}
        </div>
      </div>
    </aside>
  );
}

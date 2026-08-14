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
export function AiMatchSummary({ result }: { result?: RankedMatch }) {
  const language = useLanguage();
  const [summary, setSummary] = useState(() => (result ? fallbackSummary(result) : ""));
  const [aiGenerated, setAiGenerated] = useState(false);

  useEffect(() => {
    if (!result) return;
    setSummary(fallbackSummary(result));
    setAiGenerated(false);
    let cancelled = false;

    aiReRank([result], undefined, language).then(({ explanations, generated }) => {
      const explanation = explanations.find((item) => item.id === result.id)?.reason;
      if (!cancelled && explanation) {
        setSummary(explanation);
        setAiGenerated(generated);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [language, result]);

  if (!result) return null;

  return (
    <aside className="mt-5 rounded-lg border border-hairline bg-canvas-soft p-4" aria-label="AI explanation">
      <div className="flex items-start gap-3">
        <SparklesIcon className="mt-0.5 size-4 flex-none text-ink-deep" aria-hidden="true" />
        <div>
          <p className="t-body-strong">{aiGenerated ? "AI summary" : "Match summary"}</p>
          <p className="t-caption mt-1 text-ink-mute text-pretty">{summary}</p>
          <p className="t-micro mt-2 text-ink-mute">
            {aiGenerated
              ? "Generated from the published checks below; it does not decide eligibility."
              : "Based on the published checks below; it does not decide eligibility."}
          </p>
        </div>
      </div>
    </aside>
  );
}

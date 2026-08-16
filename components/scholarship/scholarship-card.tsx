"use client";

import { SparklesIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { MatchBadge } from "@/components/scholarship/match-metric";
import { ProviderCrest, ProviderWatermark, providerTint } from "@/components/scholarship/provider-logo";
import { RequirementMark } from "@/components/scholarship/requirement-mark";
import { DeadlineCountdown } from "@/components/scholarship/deadline-chip";
import { benefitSummary, formatPeso } from "@/lib/logic/format";
import { compactMatchReason } from "@/lib/logic/matching";
import type { RankedMatch } from "@/lib/logic/matching";
import type { Scholarship } from "@/lib/scholarships";
import { cn } from "@/lib/utils";

function CountUp({
  value,
  reduced,
  format,
  className,
}: {
  value: number;
  reduced: boolean;
  format: (value: number) => string;
  className?: string;
}) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const duration = Math.min(1, (now - start) / 360);
      setProgress(1 - Math.pow(1 - duration, 3));
      if (duration < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduced, value]);
  return <span className={cn("t-figure text-ink-deep", className)}>{format(Math.round(value * (reduced ? 1 : progress)))}</span>;
}

const faceClass = "absolute inset-0 flex flex-col overflow-hidden rounded-xl border border-[color:var(--tint-border)] p-4 shadow-[0_8px_24px_rgba(14,15,12,0.1)] [backface-visibility:hidden] sm:p-5 lg:p-5";

export function ScholarshipCard({
  card,
  index,
  flipped,
  reduced,
  result,
  compact = false,
}: {
  card: Scholarship;
  index: number;
  flipped: boolean;
  reduced: boolean;
  result: RankedMatch;
  compact?: boolean;
}) {
  return (
    <div className="tinted absolute inset-0 [perspective:1400px]" style={providerTint(index)}>
      <div className={cn("absolute inset-0 [transform-style:preserve-3d]", reduced ? "transition-none" : "transition-transform duration-500 ease-out")} style={{ transform: flipped ? "rotateY(180deg)" : undefined }}>
        <article className={faceClass} style={{ background: "var(--tint-face)" }} aria-hidden={flipped}>
          <ProviderWatermark logo={card.logo} className={compact ? "-right-10 top-12 size-40" : "-right-14 top-28 size-54"} />
          <div className={cn("relative flex gap-3", compact ? "justify-end" : "items-start justify-between")}>
            {!compact && (
              <div>
                <p className="t-micro text-ink-deep">Your match</p>
                <p className="mt-1">{result.percent === null ? <span className="t-figure text-ink-deep">-</span> : <CountUp key={card.id} value={result.percent} reduced={reduced} format={(value) => `${value}%`} className="text-[clamp(2.5rem,5vw,3.125rem)] leading-none" />}</p>
              </div>
            )}
            <MatchBadge card={result} className={cn("shrink-0", compact ? "px-1.5 py-0.5 text-[0.625rem] leading-3 [&>span]:size-1" : "mt-1")} />
          </div>
          {!compact && (
            <>
              <div className="relative mt-4 border-t border-hairline pt-4 lg:mt-3 lg:pt-3">
                <p className="t-micro text-ink-deep">Potential assistance</p>
                <p className="mt-1 flex flex-wrap items-baseline gap-2">
                  {card.amount > 0 ? <CountUp key={`${card.id}-assistance`} value={card.amount} reduced={reduced} format={formatPeso} /> : <span className="t-caption text-ink-deep leading-snug">{benefitSummary(card)}</span>}
                  {card.amount > 0 && <span className="t-caption text-ink-mute">{card.amountNote}</span>}
                </p>
              </div>
              <div className="relative mt-4 border-t border-hairline pt-4 lg:mt-3 lg:pt-3">
                <p className="t-micro text-ink-mute">Deadline</p>
                <p className="t-body-strong mt-1">{card.deadline}</p>
                <DeadlineCountdown deadlineIso={card.deadlineIso} />
              </div>
              <div className="relative mt-4 border-t border-hairline pt-4 lg:mt-3 lg:pt-3">
                <p className="t-micro flex items-center gap-1.5 text-ink-deep"><SparklesIcon className="size-3.5 shrink-0" aria-hidden="true" />Why this matched you</p>
                <p className="t-caption mt-1.5 text-ink-mute text-pretty line-clamp-3">{compactMatchReason(result)}</p>
              </div>
            </>
          )}
          <h2 className={cn(
            "relative mt-auto text-balance",
            compact
              ? "t-heading pt-4 text-[clamp(0.95rem,3.6vw,1.25rem)] leading-[1.08] sm:text-[1.1rem] lg:text-[1.2rem]"
              : "t-display-lg pt-5 text-[clamp(1.85rem,7.5vw,2.4rem)] leading-[0.96] lg:pt-4 lg:text-[2rem]",
            "[overflow-wrap:anywhere]"
          )}>{card.title}</h2>
          {compact && (
            <div className="relative mt-3 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-hairline pt-2 text-ink-deep">
              <p className="t-caption-strong tabular-nums">
                <span className="sr-only">Published requirements matched: </span>
                {result.percent === null ? "—" : `${result.percent}%`}
              </p>
              <p className="t-caption-strong justify-self-end tabular-nums">
                <span className="sr-only">Published benefit: </span>
                {benefitSummary(card)}
              </p>
              <p className="t-micro col-span-2 truncate text-ink-mute">
                <span className="sr-only">Deadline: </span>
                {card.deadline}
              </p>
            </div>
          )}
          <div className="hidden">
          <ProviderWatermark logo={card.logo} className="-right-14 top-28 size-54" />
          <p className="t-eyebrow mt-2.5 text-[color:var(--tint-ink)] lg:mt-1.5">{card.provider}</p>
          <h2 className="t-display-lg mt-1 mb-3 text-balance text-[clamp(1.85rem,7.5vw,2.4rem)] leading-[0.96] lg:mb-2 lg:text-[2rem]">{card.title}</h2>
          <div className="mb-3 flex items-end justify-between border-y border-hairline py-3 text-ink-deep lg:mb-2 lg:py-2">
            <div><p className="t-micro text-ink-deep">Requirements matched</p><p className="mt-1">{result.percent === null ? <span className="t-figure">—</span> : <CountUp key={card.id} value={result.percent} reduced={reduced} format={(value) => `${value}%`} />}</p></div>
            <p className="t-caption max-w-[15ch] text-right text-ink-mute">{result.met} of {result.total} published requirements{result.unknown ? ` · ${result.unknown} to confirm` : ""}</p>
          </div>
          <p className="t-micro text-ink-deep">Potential grant</p>
          <p className="mb-auto flex flex-wrap items-baseline gap-2"><CountUp key={card.id} value={card.amount} reduced={reduced} format={formatPeso} /><span className="t-caption text-ink-mute">{card.amountNote}</span></p>
          <div className="mt-3 flex items-end justify-between border-t border-hairline pt-3 lg:mt-2 lg:pt-2"><div><p className="t-micro text-ink-mute">Deadline</p><p className="t-body-strong">{card.deadline}</p><DeadlineCountdown deadlineIso={card.deadlineIso} /></div>{result.tone !== "possible" && <p className={cn("t-body-strong", result.tone === "strong" ? "text-met" : "text-attention-ink")}>{result.match}</p>}</div>
          </div>
        </article>
        <article className={cn(faceClass, "[transform:rotateY(180deg)]")} style={{ background: "var(--tint-face-back)" }} aria-hidden={!flipped}>
          <ProviderWatermark logo={card.logo} className="-right-10 bottom-16 size-42" />
          <div className="mb-2 flex items-center gap-2.5"><ProviderCrest index={index} provider={card.provider} logo={card.logo} /><p className="t-eyebrow text-[color:var(--tint-ink)]">{card.provider}</p></div>
          <h2 className="t-display-md mb-3 text-balance">{card.title}</h2>
          <p className="t-eyebrow mb-2 text-ink-mute">Published requirements</p><div className="mb-3 h-px bg-hairline" />
          <ul className="flex flex-col gap-2.5">{result.checks.map((check) => <li key={check.label} className="flex gap-2.5"><RequirementMark state={check.state === "met" ? "ok" : check.state === "not-met" ? "warn" : "none"} /><div><p className="t-caption-strong text-ink">{check.label}</p><p className="t-micro mt-0.5 text-ink-mute">{check.detail}</p></div></li>)}</ul>
          <div className="mt-auto flex items-center justify-between border-t border-hairline pt-3"><p className="t-micro text-ink-mute">Tap to flip back</p><p className="t-micro text-ink-mute">Your match</p></div>
        </article>
      </div>
    </div>
  );
}

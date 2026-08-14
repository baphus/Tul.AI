"use client";

import { FlipHorizontalIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { ProviderCrest, ProviderWatermark, providerTint } from "@/components/scholarship/provider-logo";
import { RequirementMark } from "@/components/scholarship/requirement-mark";
import { VerificationBadge } from "@/components/scholarship/verification-badge";
import { DeadlineCountdown } from "@/components/scholarship/deadline-chip";
import { formatPeso } from "@/lib/logic/format";
import { compactMatchReason } from "@/lib/logic/matching";
import type { RankedMatch } from "@/lib/logic/matching";
import type { Scholarship } from "@/lib/scholarships";
import { cn } from "@/lib/utils";

function CountUp({
  value,
  reduced,
  format,
}: {
  value: number;
  reduced: boolean;
  format: (value: number) => string;
}) {
  const [progress, setProgress] = useState(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) {
      setProgress(1);
      return;
    }
    setProgress(0);
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
  return <span className="t-figure text-ink-deep">{format(Math.round(value * progress))}</span>;
}

const faceClass = "absolute inset-0 flex flex-col overflow-hidden rounded-xl border border-[color:var(--tint-border)] p-5 shadow-[0_8px_24px_rgba(14,15,12,0.1)] [backface-visibility:hidden]";

export function ScholarshipCard({ card, index, flipped, reduced, onFlip, result }: { card: Scholarship; index: number; flipped: boolean; reduced: boolean; onFlip: () => void; result: RankedMatch }) {
  return (
    <div className="tinted absolute inset-0 [perspective:1400px]" style={providerTint(index)}>
      <div className={cn("absolute inset-0 [transform-style:preserve-3d]", reduced ? "transition-none" : "transition-transform duration-500 ease-out")} style={{ transform: flipped ? "rotateY(180deg)" : undefined }}>
        <article className={faceClass} style={{ background: "var(--tint-face)" }} aria-hidden={flipped}>
          <ProviderWatermark index={index} className="-right-14 top-28 size-54" />
          <FlipButton onClick={onFlip} label="Show published requirements" />
          <VerificationBadge status={card.verification} />
          <p className="t-eyebrow mt-4 text-[color:var(--tint-ink)]">{card.provider}</p>
          <h2 className="t-display-lg mt-1.5 mb-4 text-balance">{card.title}</h2>
          <div className="mb-4 flex items-end justify-between border-y border-hairline py-4 text-ink-deep">
            <div><p className="t-micro text-ink-deep">Requirements matched</p><p className="mt-1">{result.percent === null ? <span className="t-figure">—</span> : <CountUp key={card.id} value={result.percent} reduced={reduced} format={(value) => `${value}%`} />}</p></div>
            <p className="t-caption max-w-[15ch] text-right text-ink-mute">{result.met} of {result.total} published requirements{result.unknown ? ` · ${result.unknown} to confirm` : ""}</p>
          </div>
          <p className="t-micro text-ink-deep">Potential grant</p>
          <p className="mb-4 flex flex-wrap items-baseline gap-2"><CountUp key={card.id} value={card.amount} reduced={reduced} format={formatPeso} /><span className="t-caption text-ink-mute">{card.amountNote}</span></p>
          <div className="mb-3.5 h-px bg-hairline" />
          <p className="t-caption mb-auto text-ink-mute text-pretty">{compactMatchReason(result)} Flip this card to inspect each published requirement, then open the full details when you are ready.</p>
          <div className="mt-4 flex items-end justify-between border-t border-hairline pt-3.5"><div><p className="t-micro text-ink-mute">Deadline</p><p className="t-body-strong">{card.deadline}</p><DeadlineCountdown deadlineIso={card.deadlineIso} /></div><p className={cn("t-body-strong", card.tone === "strong" ? "text-met" : "text-attention-ink")}>{result.match}</p></div>
        </article>
        <article className={cn(faceClass, "[transform:rotateY(180deg)]")} style={{ background: "var(--tint-face-back)" }} aria-hidden={!flipped}>
          <ProviderWatermark index={index} className="-right-10 bottom-16 size-42" />
          <FlipButton onClick={onFlip} label="Show match summary" />
          <div className="mb-3 flex items-center gap-2.5"><ProviderCrest index={index} provider={card.provider} logo={card.logo} /><p className="t-eyebrow text-[color:var(--tint-ink)]">{card.provider}</p></div>
          <h2 className="t-display-md mb-4 text-balance">{card.title}</h2>
          <p className="t-eyebrow mb-2 text-ink-mute">Published requirements</p><div className="mb-3.5 h-px bg-hairline" />
          <ul className="mb-auto flex flex-col gap-3">{result.checks.map((check) => <li key={check.label} className="flex gap-2.5"><RequirementMark state={check.state === "met" ? "ok" : check.state === "not-met" ? "warn" : "none"} /><div><p className="t-caption-strong text-ink">{check.label}</p><p className="t-micro mt-0.5 text-ink-mute">{check.detail}</p></div></li>)}</ul>
          <div className="flex items-center justify-between border-t border-hairline pt-3.5"><p className="t-micro text-ink-mute">Tap to flip back</p><p className="t-micro text-ink-mute">Demo data</p></div>
        </article>
      </div>
    </div>
  );
}

function FlipButton({ onClick, label }: { onClick: () => void; label: string }) {
  return <button type="button" onClick={onClick} aria-label={label} className="ring-brand absolute top-4 right-4 z-10 hidden size-8 place-items-center rounded-md border border-hairline bg-canvas/70 text-ink-mute transition-colors hover:text-ink lg:grid"><FlipHorizontalIcon className="size-3.5" /></button>;
}

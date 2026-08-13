"use client";

import { FlipHorizontalIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { MatchMetric } from "@/components/scholarship/match-metric";
import {
  ProviderCrest,
  ProviderWatermark,
  providerTint,
} from "@/components/scholarship/provider-logo";
import { RequirementMark } from "@/components/scholarship/requirement-mark";
import { VerificationBadge } from "@/components/scholarship/verification-badge";
import { DeadlineCountdown } from "@/components/scholarship/deadline-chip";
import { formatPeso } from "@/lib/logic/format";
import type { Scholarship } from "@/lib/scholarships";
import { cn } from "@/lib/utils";

/** Eases the peso figure up on arrival. Remounted per card via `key`. */
function AmountCounter({ value, reduced }: { value: number; reduced: boolean }) {
  const [progress, setProgress] = useState(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / 620);
      setProgress(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  return (
    <span className="t-num text-[2rem] leading-none" style={{ fontVariationSettings: '"wght" 540' }}>
      {formatPeso(Math.round(value * progress))}
    </span>
  );
}

const faceClass =
  "absolute inset-0 flex flex-col overflow-hidden rounded-xl border border-[color:var(--tint-border)] p-5 shadow-[0_8px_24px_rgba(14,15,12,0.1)] [backface-visibility:hidden]";

export function ScholarshipCard({
  card,
  index,
  flipped,
  reduced,
  onFlip,
}: {
  card: Scholarship;
  index: number;
  flipped: boolean;
  reduced: boolean;
  onFlip: () => void;
}) {
  return (
    <div
      className="tinted absolute inset-0 [perspective:1400px]"
      style={providerTint(index)}
    >
      <div
        className={cn(
          "absolute inset-0 [transform-style:preserve-3d]",
          reduced ? "transition-none" : "transition-transform duration-500 ease-out"
        )}
        style={{ transform: flipped ? "rotateY(180deg)" : undefined }}
      >
        {/* ── Front ── */}
        <article
          className={faceClass}
          style={{ background: "var(--tint-face)" }}
          aria-hidden={flipped}
        >
          <ProviderWatermark index={index} className="-right-14 top-28 size-54" />
          <FlipButton onClick={onFlip} label="Show what this programme covers" />

          <VerificationBadge
            status={card.verification}
            lastVerified={card.lastVerified}
            showDate={false}
          />

          <p className="t-eyebrow mt-4 text-[color:var(--tint-ink)]">{card.provider}</p>
          <h3 className="t-display-lg mt-1.5 mb-4 text-balance">{card.title}</h3>

          <p className="t-micro text-ink-mute">Up to</p>
          <p className="mb-4 flex flex-wrap items-baseline gap-2">
            <AmountCounter key={card.id} value={card.amount} reduced={reduced} />
            <span className="t-caption text-ink-mute">{card.amountNote}</span>
          </p>

          <div className="mb-3.5 h-px bg-hairline" />
          <p className="t-eyebrow mb-2.5 text-ink-mute">Why you match</p>
          <ul className="mb-auto flex flex-col gap-2">
            {card.why.map((w) => (
              <li key={w.label} className="flex items-center gap-2.5">
                <RequirementMark state={w.state} />
                <span className="t-caption text-ink">{w.label}</span>
              </li>
            ))}
          </ul>

          <MatchMetric card={card} className="mt-4" />

          <div className="mt-4 flex items-end justify-between border-t border-hairline pt-3.5">
            <div>
              <p className="t-micro text-ink-mute">Deadline</p>
              <p className="t-body-strong">{card.deadline}</p>
              <DeadlineCountdown deadlineIso={card.deadlineIso} />
            </div>
            <p
              className={cn(
                "t-body-strong",
                card.tone === "strong" ? "text-met" : "text-attention-ink"
              )}
            >
              {card.match}
            </p>
          </div>
        </article>

        {/* ── Back ── */}
        <article
          className={cn(faceClass, "[transform:rotateY(180deg)]")}
          style={{ background: "var(--tint-face-back)" }}
          aria-hidden={!flipped}
        >
          <ProviderWatermark index={index} className="-right-10 bottom-16 size-42" />
          <FlipButton onClick={onFlip} label="Flip back to the match summary" />

          <div className="mb-3 flex items-center gap-2.5">
            <ProviderCrest index={index} provider={card.provider} logo={card.logo} />
            <p className="t-eyebrow text-[color:var(--tint-ink)]">{card.provider}</p>
          </div>
          <h3 className="t-display-md mb-4 text-balance">{card.title}</h3>

          <p className="t-eyebrow mb-2 text-ink-mute">About this programme</p>
          <p className="t-caption mb-4 text-ink-mute text-pretty">{card.back.about}</p>
          <div className="mb-3.5 h-px bg-hairline" />
          <dl className="mb-auto flex flex-col gap-3">
            {card.back.facts.map(([label, value]) => (
              <div key={label}>
                <dt className="t-micro text-ink-mute">{label}</dt>
                <dd className="t-caption mt-0.5 text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex items-center justify-between border-t border-hairline pt-3.5">
            <p className="t-micro text-ink-mute">Tap to flip back</p>
            <p className="t-micro text-ink-mute">Demo data</p>
          </div>
        </article>
      </div>
    </div>
  );
}

function FlipButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="ring-brand absolute top-4 right-4 z-10 hidden size-8 place-items-center rounded-md border border-hairline bg-canvas/70 text-ink-mute transition-colors hover:text-ink lg:grid"
    >
      <FlipHorizontalIcon className="size-3.5" />
    </button>
  );
}

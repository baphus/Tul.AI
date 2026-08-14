import { ChevronRightIcon } from "lucide-react";
import type { ReactNode } from "react";

import { ApplyDialog } from "@/components/scholarship/apply-dialog";
import { AskPanel } from "@/components/scholarship/ask-panel";
import { DeadlineChip } from "@/components/scholarship/deadline-chip";
import { MatchBadge, MatchMetric } from "@/components/scholarship/match-metric";
import { ProviderCrest, providerTint } from "@/components/scholarship/provider-logo";
import { RequirementMark } from "@/components/scholarship/requirement-mark";
import {
  sourceTierLabel,
  VerificationBadge,
  verificationHelp,
} from "@/components/scholarship/verification-badge";
import { VerifyDialog } from "@/components/scholarship/verify-dialog";
import { formatPeso } from "@/lib/logic/format";
import { detailRequirements } from "@/lib/logic/detail-match";
import type { RankedMatch } from "@/lib/logic/matching";
import type { Scholarship } from "@/lib/scholarships";
import { cn } from "@/lib/utils";

/**
 * The full scholarship record (PRD §23). Server-rendered and shareable: the
 * requirement rows are native <details>, so they open without JavaScript and
 * the page is readable before anything hydrates. Only the three interactive
 * moments — ask, verify, apply — are client islands.
 */
export function ScholarshipDetail({
  card,
  index,
  topSlot,
  className,
  result,
  matchExplanation,
}: {
  card: Scholarship;
  index: number;
  topSlot?: ReactNode;
  className?: string;
  /** The live deterministic result when a student is viewing this record in-app. */
  result?: RankedMatch;
  /** Advisory AI prose that is grounded in the live deterministic result. */
  matchExplanation?: ReactNode;
}) {
  const personalized = Boolean(result);
  const rows = result ? detailRequirements(result) : card.rows;
  const match = result ?? card;
  const unknowns = rows.filter((r) => r.state === "none").length;
  const attention = rows.filter((r) => r.state === "warn").length;

  return (
    <article className={cn("min-w-0 pb-[max(4rem,env(safe-area-inset-bottom))]", className)}>
      {/* ── Header ── */}
      <header
        className="tinted border-b border-hairline px-6 pt-6 pb-8 sm:px-8"
        style={{ ...providerTint(index), background: "var(--tint-wash)" }}
      >
        {topSlot}
        <div className="mt-4 flex items-center gap-3">
          <ProviderCrest index={index} provider={card.provider} logo={card.logo} />
          <p className="t-eyebrow text-[color:var(--tint-ink)]">{card.provider}</p>
        </div>
        <h1 className="t-display-xl mt-4 text-balance">{card.title}</h1>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {personalized && <MatchBadge card={match} />}
          <DeadlineChip deadline={card.deadline} deadlineIso={card.deadlineIso} />
          <VerificationBadge status={card.verification} />
        </div>
      </header>

      <div className="min-w-0 px-5 sm:px-8">
        {/* ── Key facts ── */}
        <dl className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-hairline bg-canvas p-5">
            <dt className="t-micro text-ink-mute">Potential assistance</dt>
            <dd className="t-display-md t-num mt-1.5">{formatPeso(card.amount)}</dd>
            <p className="t-caption mt-1 text-ink-mute">{card.amountNote}</p>
          </div>
          <div className="rounded-lg border border-hairline bg-canvas p-5">
            <dt className="t-micro text-ink-mute">Application deadline</dt>
            <dd className="t-display-md mt-1.5">
              <time dateTime={card.deadlineIso}>{card.deadline}</time>
            </dd>
            <p className="t-caption mt-1 text-ink-mute">Published by the provider</p>
          </div>
        </dl>

        <p className="t-body mt-6 text-ink-mute text-pretty">{card.back.about}</p>

        <dl className="mt-6 grid gap-5 border-t border-hairline pt-6 sm:grid-cols-2">
          {card.back.facts.map(([label, value]) => (
            <div key={label}>
              <dt className="t-micro text-ink-mute">{label}</dt>
              <dd className="t-caption mt-1 text-ink">{value}</dd>
            </div>
          ))}
        </dl>

        {/* ── Why this matched ── */}
        <section className="mt-12" aria-labelledby="why">
          <h2 id="why" className="t-display-lg">
            {personalized ? "Why this matched you" : "Published requirements"}
          </h2>
          <p className="t-body mt-2 text-ink-mute text-pretty">
            {personalized
              ? "Matching compares your profile against each published requirement. Open a row to read the requirement behind it."
              : "This public page lists provider-published requirements. Start matching to compare them with your own profile."}
          </p>

          {matchExplanation}
          {personalized && <MatchMetric card={match} className="mt-5" />}

          <ul className="mt-5 overflow-hidden rounded-lg border border-hairline bg-canvas">
            {rows.map((row, i) => (
              <li key={row.label} className={cn(i < rows.length - 1 && "border-b border-hairline")}>
                <details className="group">
                  <summary className="ring-brand flex cursor-pointer list-none items-center gap-3 px-4 py-4 transition-colors hover:bg-canvas-soft">
                    <RequirementMark state={row.state} />
                    <span className="t-body-strong flex-1">{row.label}</span>
                    <ChevronRightIcon
                      className="size-4 flex-none text-ink-mute transition-transform group-open:rotate-90"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="t-caption pt-0 pr-4 pb-4 pl-[3.25rem] text-ink-mute">
                    {row.text}
                  </p>
                </details>
              </li>
            ))}
          </ul>

          {personalized && (unknowns > 0 || attention > 0) && (
            <p className="t-caption mt-4 rounded-md border border-hairline bg-canvas-soft p-4 text-ink-mute text-pretty">
              {unknowns > 0 && (
                <>
                  {unknowns === 1 ? "One requirement is" : `${unknowns} requirements are`}{" "}
                  <strong className="text-ink">unknown</strong> — the provider hasn&apos;t
                  published it, or we don&apos;t have that detail about you yet. Unknown is
                  not the same as ineligible.{" "}
                </>
              )}
              {attention > 0 && (
                <>
                  {attention === 1 ? "One item needs" : `${attention} items need`} attention
                  before you apply.
                </>
              )}
            </p>
          )}
        </section>

        {/* ── Documents ── */}
        <section className="mt-12" aria-labelledby="documents">
          <h2 id="documents" className="t-display-lg">
            What you&apos;ll need
          </h2>
          <p className="t-body mt-2 text-ink-mute">
            The documents named in the provider&apos;s published requirements.
          </p>
          <ul className="mt-5 flex flex-col gap-2.5">
            {card.needs.map((need) => (
              <li
                key={need}
                className="flex items-center gap-3 rounded-md border border-hairline bg-canvas px-4 py-3.5"
              >
                <span
                  className="size-4 flex-none rounded-xs border-[1.5px] border-hairline-dark/30"
                  aria-hidden="true"
                />
                <span className="t-caption">{need}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Verification & sources ── */}
        <section className="mt-12" aria-labelledby="sources">
          <h2 id="sources" className="t-display-lg">
            Sources checked
          </h2>
          <p className="t-body mt-2 text-ink-mute text-pretty">
            {verificationHelp(card.verification)} {sourceTierLabel(card.sourceTier)}.
          </p>

          <ul className="mt-5 flex flex-col gap-2.5">
            {card.sources.map((source) => (
              <li key={source.url || source.name} className="rounded-lg border border-hairline bg-canvas p-4">
                <p className="t-micro flex items-center gap-2 text-met">
                  <span className="size-1.5 rounded-full bg-met" aria-hidden="true" />
                  Official source
                </p>
                {source.url ? <a className="ring-brand t-body-strong mt-1.5 block underline underline-offset-2" href={source.url} target="_blank" rel="noreferrer">{source.name}</a> : <p className="t-body-strong mt-1.5">{source.name}</p>}
                <p className="t-caption mt-0.5 text-ink-mute">{source.date}</p>
              </li>
            ))}
          </ul>

          <p className="t-caption mt-4 text-ink-mute">
            Provider pages can change at any time. Always confirm details with the official
            source before you apply.
          </p>

          <div className="mt-5">
            <VerifyDialog card={card} />
          </div>
        </section>

        {/* ── Grounded Q&A ── */}
        <section className="mt-12" aria-labelledby="ask">
          <AskPanel card={card} />
        </section>

        {/* ── Standing disclaimer (AGENTS.md §3) ── */}
        <div className="mt-12 rounded-lg border border-hairline bg-canvas-soft p-5">
          <p className="t-eyebrow text-ink-mute">Important</p>
          <p className="t-caption mt-2 text-ink text-pretty">
            Meeting published requirements does not guarantee selection. The scholarship
            provider makes the final decision, and Tul.AI is not the official application
            portal.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <ApplyDialog card={card} />
          <p className="t-micro text-ink-mute">Opens {card.host} in a new tab</p>
        </div>
      </div>
    </article>
  );
}

import { ChevronRightIcon } from "lucide-react";
import type { ReactNode } from "react";

import { ApplyDialog } from "@/components/scholarship/apply-dialog";
import { AskPanel } from "@/components/scholarship/ask-panel";
import { DeadlineChip } from "@/components/scholarship/deadline-chip";
import { MatchBadge, MatchMetric } from "@/components/scholarship/match-metric";
import { ProviderCrest, ProviderWatermark, providerTint } from "@/components/scholarship/provider-logo";
import { RequirementMark } from "@/components/scholarship/requirement-mark";
import { formatPeso } from "@/lib/logic/format";
import { detailRequirements } from "@/lib/logic/detail-match";
import type { RankedMatch } from "@/lib/logic/matching";
import type { Scholarship } from "@/lib/scholarships";
import { cn } from "@/lib/utils";

function DisclosureSection({
  title,
  open = false,
  children,
}: {
  title: string;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={open} className="group border-t border-hairline py-5 first:border-t-0 first:pt-0">
      <summary className="ring-brand flex cursor-pointer list-none items-center justify-between gap-4 rounded-md outline-hidden">
        <h2 className="t-display-lg">{title}</h2>
        <ChevronRightIcon className="size-5 flex-none text-ink-mute transition-transform group-open:rotate-90" aria-hidden="true" />
      </summary>
      <div className="pt-5">{children}</div>
    </details>
  );
}

/**
 * The full scholarship record (PRD §23). Server-rendered and shareable: the
 * requirement rows are native <details>, so they open without JavaScript and
 * the page is readable before anything hydrates. Only the three interactive
 * moments — ask and apply — are client islands.
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
        className="tinted relative isolate overflow-hidden border-b border-hairline px-6 pt-6 pb-8 sm:px-8"
        style={{ ...providerTint(index), background: "var(--tint-wash)" }}
      >
        <ProviderWatermark logo={card.logo} className="-right-10 -top-12 size-64 sm:-right-4 sm:-top-16 sm:size-76" />
        <div className="relative">
          {topSlot}
          <div className="mt-4 flex items-center gap-3">
            <ProviderCrest index={index} provider={card.provider} logo={card.logo} />
            <p className="t-eyebrow text-[color:var(--tint-ink)]">{card.provider}</p>
          </div>
          <h1 className="t-display-xl mt-4 max-w-[16ch] text-balance">{card.title}</h1>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {personalized && match.tone !== "possible" && <MatchBadge card={match} />}
            <DeadlineChip deadline={card.deadline} deadlineIso={card.deadlineIso} expectedNextCycle={card.expectedNextCycle} />
          </div>
        </div>
      </header>

      <div className="min-w-0 px-5 sm:px-8">
        {/* ── Key facts ── */}
        <dl className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-hairline bg-canvas p-5">
            <dt className="t-micro text-ink-mute">Potential assistance</dt>
            <dd className={cn("mt-1.5", card.amount ? "t-display-md t-num" : "t-body-strong text-pretty")}>{card.amount ? formatPeso(card.amount) : card.assistance}</dd>
            <p className="t-caption mt-1 text-ink-mute">{card.amountNote}</p>
          </div>
          <div className="rounded-lg border border-hairline bg-canvas p-5">
            <dt className="t-micro text-ink-mute">Application deadline</dt>
            <dd className="t-display-md mt-1.5">
              {card.expectedNextCycle ? "Expected next cycle in 2027" : <time dateTime={card.deadlineIso}>{card.deadline}</time>}
            </dd>
            <p className="t-caption mt-1 text-ink-mute">{card.expectedNextCycle ? "The provider has not published the 2027 call date yet" : "Published by the provider"}</p>
          </div>
        </dl>

        <div className="mt-8">
          <DisclosureSection title="About this scholarship" open>
        <p className="t-body text-ink-mute text-pretty">{card.back.about}</p>

        <dl className="mt-6 grid gap-5 border-t border-hairline pt-6 sm:grid-cols-2">
          {card.back.facts.map(([label, value]) => (
            <div key={label}>
              <dt className="t-micro text-ink-mute">{label}</dt>
              <dd className="t-caption mt-1 text-ink">{value}</dd>
            </div>
          ))}
        </dl>

        {/* ── Why this matched ── */}
          </DisclosureSection>
          <DisclosureSection title="Published support" open>
            <ul className="space-y-3">
              {card.benefits.map((benefit) => (
                <li key={benefit} className="t-body flex gap-3 text-ink-mute">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ink" aria-hidden="true" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </DisclosureSection>
          <DisclosureSection title={personalized ? "Why this matched you" : "Published requirements"} open>
        <section aria-labelledby="why">
          <h2 id="why" className="sr-only">
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
          </DisclosureSection>
          <DisclosureSection title="What you'll need">
        <section aria-labelledby="documents">
          <h2 id="documents" className="sr-only">
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

        {/* ── Grounded Q&A ── */}
          </DisclosureSection>
          <DisclosureSection title="Ask Tul.AI">
            <section aria-labelledby="ask">
              <AskPanel card={card} condensed />
            </section>
          </DisclosureSection>
        </div>

        {/* ── Standing disclaimer (AGENTS.md §3) ── */}
        <div className="hidden">
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

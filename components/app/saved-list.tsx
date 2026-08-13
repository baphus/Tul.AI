"use client";

import { BellRingIcon, CheckIcon } from "lucide-react";
import Link from "next/link";

import { ApplyDialog } from "@/components/scholarship/apply-dialog";
import { DeadlineChip } from "@/components/scholarship/deadline-chip";
import { MatchMetric } from "@/components/scholarship/match-metric";
import { ProviderCrest } from "@/components/scholarship/provider-logo";
import { VerificationBadge } from "@/components/scholarship/verification-badge";
import { Button } from "@/components/ui/button";
import { useToday } from "@/hooks/use-today";
import { useTulAi } from "@/hooks/use-tul-ai";
import { daysUntil, deadlineLabel, deadlineTone } from "@/lib/logic/deadlines";
import { formatPeso } from "@/lib/logic/format";
import { ROUTES } from "@/lib/logic/routes";
import { checkedDocs, savedIndexes } from "@/lib/logic/state";
import type { Scholarship } from "@/lib/scholarships";
import { cn } from "@/lib/utils";

/**
 * Saved scholarships with deadline tracking and an application checklist
 * (PRD §26–27) — the point where discovery turns into action.
 */
export function SavedList() {
  const { state, cards, ready } = useTulAi();
  const today = useToday();

  const saved = savedIndexes(state)
    .map((index) => ({ card: cards[index], index }))
    .sort((a, b) => a.card.deadlineIso.localeCompare(b.card.deadlineIso));

  const next = saved[0];
  const nextDays = today && next ? daysUntil(next.card.deadlineIso, today) : Number.NaN;

  if (ready && saved.length === 0) {
    return (
      <div className="mx-auto max-w-[34rem] py-16 text-center">
        <h1 className="t-display-lg text-balance">Nothing saved yet.</h1>
        <p className="t-body mt-4 text-ink-mute text-pretty">
          Mark a scholarship as interesting in the deck and it lands here with its
          deadline and a document checklist you can work through.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button className="h-12 rounded-md px-6" render={<Link href={ROUTES.discover} />}>
            Open the deck
          </Button>
          <Button
            variant="outline"
            className="h-12 rounded-md border-hairline-dark px-5"
            render={<Link href={ROUTES.scholarships} />}
          >
            Browse everything
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10">
      <h1 className="t-display-xl text-balance">Your applications.</h1>
      <p className="t-body-lg mt-4 max-w-[36rem] text-ink-mute text-pretty">
        {saved.length} saved {saved.length === 1 ? "programme" : "programmes"}, ordered by
        what closes first. Tick documents off as you prepare them — the same paperwork
        usually covers several applications.
      </p>

      {next && today && !Number.isNaN(nextDays) && (
        <p
          className={cn(
            "t-body-strong mt-8 flex items-center gap-3 rounded-lg border p-4",
            deadlineTone(nextDays) === "urgent"
              ? "border-attention/30 bg-attention/8 text-attention-ink"
              : "border-hairline bg-canvas-soft text-ink"
          )}
          role="status"
        >
          <BellRingIcon className="size-4 flex-none" aria-hidden="true" />
          <span>
            {next.card.provider} closes {next.card.deadline} —{" "}
            {deadlineLabel(nextDays).toLowerCase()}.
          </span>
        </p>
      )}

      <ul className="mt-8 flex flex-col gap-5">
        {saved.map(({ card, index }) => (
          <li key={card.id}>
            <SavedCard card={card} index={index} />
          </li>
        ))}
      </ul>

      <p className="t-micro mt-8 text-ink-mute">
        Checklists live on this device only. Tul.AI never submits an application or creates
        an account for you.
      </p>
    </div>
  );
}

function SavedCard({ card, index }: { card: Scholarship; index: number }) {
  const { state, dispatch } = useTulAi();
  const done = checkedDocs(state, card.id);
  const complete = done.length;
  const total = card.needs.length;

  return (
    <article className="rounded-lg border border-hairline bg-canvas p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <ProviderCrest index={index} provider={card.provider} />
        <div className="min-w-0 flex-1">
          <p className="t-eyebrow text-ink-mute">{card.provider}</p>
          <h2 className="t-display-md mt-1">
            <Link
              href={ROUTES.scholarship(card.id)}
              className="ring-brand rounded-xs hover:underline hover:decoration-hairline-dark hover:underline-offset-4"
            >
              {card.title}
            </Link>
          </h2>
        </div>
        <p className="t-display-md t-num hidden flex-none sm:block">
          {formatPeso(card.amount)}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <DeadlineChip deadline={card.deadline} deadlineIso={card.deadlineIso} />
        <VerificationBadge
          status={card.verification}
          lastVerified={card.lastVerified}
          showDate={false}
        />
      </div>

      <MatchMetric card={card} className="mt-4" />

      {/* ── Application checklist ── */}
      <div className="mt-6 rounded-lg border border-hairline bg-canvas-soft p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="t-body-strong">Application checklist</h3>
          <p className="t-micro t-num text-ink-mute">
            {complete} of {total} ready
          </p>
        </div>

        <div
          className="mt-3 flex gap-1"
          role="img"
          aria-label={`${complete} of ${total} documents ready`}
        >
          {card.needs.map((need) => (
            <span
              key={need}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                done.includes(need) ? "bg-met" : "bg-hairline"
              )}
            />
          ))}
        </div>

        <ul className="mt-4 flex flex-col gap-1">
          {card.needs.map((need) => {
            const checked = done.includes(need);
            return (
              <li key={need}>
                <label className="group flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-canvas">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => dispatch({ type: "TOGGLE_DOC", id: card.id, doc: need })}
                    className="peer sr-only"
                  />
                  <span
                    className="grid size-5 flex-none place-items-center rounded-xs border-[1.5px] border-hairline-dark/30 bg-canvas text-transparent transition-colors peer-checked:border-met peer-checked:bg-met peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink"
                    aria-hidden="true"
                  >
                    <CheckIcon className="size-3" strokeWidth={3} />
                  </span>
                  <span
                    className={cn(
                      "t-caption",
                      checked ? "text-ink-mute line-through" : "text-ink"
                    )}
                  >
                    {need}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <ApplyDialog card={card} label="Go to official application" />
        <Button
          variant="ghost"
          className="h-12 px-3 text-ink-mute"
          onClick={() => dispatch({ type: "MOVE", index })}
        >
          Remove from my list
        </Button>
      </div>
    </article>
  );
}

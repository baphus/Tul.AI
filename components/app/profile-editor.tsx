"use client";

import { Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ChoiceChip } from "@/components/app/choice-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTulAi } from "@/hooks/use-tul-ai";
import { ROUTES } from "@/lib/logic/routes";
import type { Profile } from "@/lib/logic/state";
import { clearPersisted } from "@/lib/logic/storage";
import {
  dependentsError,
  gwaError,
  isProfileReady,
  profileCompleteness,
} from "@/lib/logic/validation";
import { CHIPS, CITIES, INCOMES, STAGE_OPTS, YEARS } from "@/lib/scholarships";
import { cn } from "@/lib/utils";

const fieldClass = "h-12 rounded-md border-hairline bg-canvas px-4";
const selectClass =
  "ring-brand t-body h-12 rounded-md border border-hairline bg-canvas px-3.5 text-ink";

/**
 * View, change or delete everything Tul.AI holds (PRD §32). Emptying a field is
 * always allowed — the requirements that depend on it become unknown, never
 * unmet.
 */
export function ProfileEditor() {
  const { state, dispatch, ready } = useTulAi();
  const profile = state.profile;
  const [confirming, setConfirming] = useState(false);

  const set = (field: keyof Omit<Profile, "chips">, value: string) =>
    dispatch({ type: "SET_FIELD", field, value });

  const { filled, total } = profileCompleteness(profile);
  const complete = isProfileReady(profile);

  const deleteEverything = () => {
    dispatch({ type: "RESET_ALL" });
    clearPersisted();
    setConfirming(false);
  };

  return (
    <div className="py-10">
      <h1 className="t-display-xl text-balance">Your profile.</h1>
      <p className="t-body-lg mt-4 max-w-[36rem] text-ink-mute text-pretty">
        Everything Tul.AI knows about you, in one place. Each field exists because it
        changes which programmes can match you — nothing here is collected for its own
        sake.
      </p>

      <div className="mt-8 rounded-lg border border-hairline bg-canvas-soft p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="t-body-strong">
            {complete ? "Ready for matching" : "Two answers still needed"}
          </p>
          <p className="t-micro t-num text-ink-mute">
            {filled} of {total} fields
          </p>
        </div>
        <div
          className="mt-3 flex gap-1"
          role="img"
          aria-label={`${filled} of ${total} profile fields filled in`}
        >
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                i < filled ? "bg-ink" : "bg-hairline"
              )}
            />
          ))}
        </div>
        <p className="t-caption mt-3 text-ink-mute text-pretty">
          {complete
            ? "A fuller profile surfaces more programmes, but a blank field never counts against you."
            : "Where you study and what you study are the two that decide what can match at all."}
        </p>
      </div>

      <form className="mt-12 flex flex-col gap-12" onSubmit={(e) => e.preventDefault()}>
        <Fieldset
          legend="Where you study"
          why="City and provincial programmes are limited to residents; universities fund their own students."
        >
          <div className="grid gap-2.5 sm:max-w-sm">
            <Label htmlFor="city">City or province</Label>
            <Input
              id="city"
              className={fieldClass}
              list="cities"
              placeholder="e.g. Cebu City"
              value={profile.city}
              onChange={(e) => set("city", e.target.value)}
            />
            <datalist id="cities">
              {CITIES.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>
          </div>
        </Fieldset>

        <Fieldset
          legend="What you study"
          why="Priority-course lists decide entire programmes, and some grants are administered by one campus."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2.5">
              <Label htmlFor="course">Course or programme</Label>
              <Input
                id="course"
                className={fieldClass}
                placeholder="e.g. BS Nursing"
                value={profile.course}
                onChange={(e) => set("course", e.target.value)}
              />
            </div>
            <div className="grid gap-2.5">
              <Label htmlFor="school">School</Label>
              <Input
                id="school"
                className={fieldClass}
                placeholder="e.g. Cebu Technological University"
                value={profile.school}
                onChange={(e) => set("school", e.target.value)}
              />
            </div>
          </div>
        </Fieldset>

        <Fieldset
          legend="Academic standing"
          why="Merit programmes publish a numeric cut-off. A blank GWA is unknown, not unmet."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="grid gap-2.5">
              <Label htmlFor="stage">Current stage</Label>
              <select
                id="stage"
                className={selectClass}
                value={profile.stage}
                onChange={(e) => set("stage", e.target.value)}
              >
                <option value="">Prefer not to say</option>
                {STAGE_OPTS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2.5">
              <Label htmlFor="year">Year level</Label>
              <select
                id="year"
                className={selectClass}
                value={profile.year}
                onChange={(e) => set("year", e.target.value)}
              >
                <option value="">Prefer not to say</option>
                {YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2.5">
              <Label htmlFor="gwa">GWA</Label>
              <Input
                id="gwa"
                inputMode="decimal"
                className={fieldClass}
                placeholder="e.g. 94.5"
                value={profile.gwa}
                aria-invalid={gwaError(profile.gwa)}
                aria-describedby={gwaError(profile.gwa) ? "gwa-error" : undefined}
                onChange={(e) => set("gwa", e.target.value)}
              />
              {gwaError(profile.gwa) && (
                <p id="gwa-error" role="alert" className="t-micro text-destructive">
                  Use a number between 60 and 100, or leave it blank.
                </p>
              )}
            </div>
          </div>
        </Fieldset>

        <Fieldset
          legend="Household"
          why="Need-based programmes publish income ceilings, and a ceiling means something different for a household of two than for eight."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2.5">
              <Label htmlFor="income">Monthly household income</Label>
              <select
                id="income"
                className={selectClass}
                value={profile.income}
                onChange={(e) => set("income", e.target.value)}
              >
                <option value="">Prefer not to say</option>
                {INCOMES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2.5">
              <Label htmlFor="dependents">Household size</Label>
              <Input
                id="dependents"
                inputMode="numeric"
                className={fieldClass}
                placeholder="e.g. 5"
                value={profile.dependents}
                aria-invalid={dependentsError(profile.dependents)}
                onChange={(e) => set("dependents", e.target.value)}
              />
              {dependentsError(profile.dependents) && (
                <p role="alert" className="t-micro text-destructive">
                  Use a whole number between 0 and 20.
                </p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <p className="t-body-strong">Circumstances you&apos;ve shared</p>
            <p className="t-caption mt-1 mb-3.5 text-ink-mute">
              Each one unlocks specific programmes. Remove any at any time.
            </p>
            <div className="flex flex-wrap gap-2">
              {CHIPS.map((option) => (
                <ChoiceChip
                  key={option}
                  label={option}
                  pressed={profile.chips.includes(option)}
                  onToggle={() => dispatch({ type: "TOGGLE_CHIP", value: option })}
                />
              ))}
            </div>
          </div>
        </Fieldset>

        <Fieldset
          legend="In your own words"
          why="Read once to propose structured details you can review. We'd rather store the reviewed field than the paragraph."
        >
          <div className="grid gap-2.5">
            <Label htmlFor="notes" className="sr-only">
              Anything else Tul.AI should know
            </Label>
            <Textarea
              id="notes"
              rows={5}
              className="rounded-lg border-hairline bg-canvas p-4 text-base"
              placeholder="Anything else that might help us find better opportunities."
              value={profile.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </Fieldset>
      </form>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button
          className="h-12 rounded-md px-6"
          disabled={!complete}
          render={complete ? <Link href={ROUTES.matching} /> : undefined}
        >
          Re-run matching
        </Button>
        <p className="t-micro text-ink-mute">
          Changes are saved to this device as you type.
        </p>
      </div>

      {/* ── Deletion ── */}
      <section className="mt-16 rounded-lg border border-hairline bg-canvas-soft p-6" aria-labelledby="delete-heading">
        <h2 id="delete-heading" className="t-display-md">
          Delete your data
        </h2>
        <p className="t-caption mt-2.5 max-w-[38rem] text-ink-mute text-pretty">
          Removes your profile, your shortlist and every checklist from this device. There
          is no soft delete and no copy kept elsewhere — in this prototype there is nowhere
          else for it to be.
        </p>

        {confirming ? (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              variant="destructive"
              className="h-11 rounded-md px-5"
              onClick={deleteEverything}
            >
              <Trash2Icon />
              Yes, delete everything
            </Button>
            <Button
              variant="ghost"
              className="h-11 px-3 text-ink-mute"
              onClick={() => setConfirming(false)}
            >
              Keep my data
            </Button>
          </div>
        ) : (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="h-11 rounded-md border-hairline-dark px-5"
              onClick={() => setConfirming(true)}
            >
              <Trash2Icon />
              Delete my profile and shortlist
            </Button>
            <Button
              variant="ghost"
              className="h-11 px-3 text-ink-mute"
              onClick={() => dispatch({ type: "CLEAR_PROFILE" })}
            >
              Clear the profile only
            </Button>
          </div>
        )}

        {ready && (
          <p className="t-micro mt-4 text-ink-mute">
            Read what each field is used for on the{" "}
            <Link
              href={ROUTES.privacy}
              className="ring-brand rounded-xs text-ink underline decoration-ink/25 underline-offset-4"
            >
              privacy page
            </Link>
            .
          </p>
        )}
      </section>
    </div>
  );
}

function Fieldset({
  legend,
  why,
  children,
}: {
  legend: string;
  why: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-t border-hairline pt-8">
      <legend className="sr-only">{legend}</legend>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:gap-10">
        <div>
          <p className="t-display-md">{legend}</p>
          <p className="t-caption mt-2 text-ink-mute text-pretty">{why}</p>
        </div>
        <div>{children}</div>
      </div>
    </fieldset>
  );
}

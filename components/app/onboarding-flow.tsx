"use client";

import { ArrowLeftIcon, ArrowRightIcon, SparklesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";

import { ChoiceCard, ChoiceChip } from "@/components/app/choice-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTulAi } from "@/hooks/use-tul-ai";
import { ONBOARDING_STEPS, ROUTES } from "@/lib/logic/routes";
import type { Profile } from "@/lib/logic/state";
import { canAdvance, dependentsError, gwaError } from "@/lib/logic/validation";
import {
  CHIPS,
  COURSE_SUGGESTIONS,
  DEPENDENT_HINT,
  INCOMES,
  LOCATIONS,
  STAGE_OPTS,
  YEARS,
} from "@/lib/scholarships";
import { cn } from "@/lib/utils";

interface StepMeta {
  question: string;
  why: string;
  optional?: boolean;
}

const STEP_META: Record<number, StepMeta> = {
  1: {
    question: "First, where are you studying?",
    why: "City and provincial programmes are limited to residents, and universities only fund their own students.",
  },
  2: {
    question: "What are you studying?",
    why: "Priority-course lists decide whole programmes — DOST-SEI's science and technology fields, or a province's list for this cycle.",
  },
  3: {
    question: "What's your current academic standing?",
    why: "Merit programmes publish a numeric cut-off. Leave the GWA blank if you'd rather not say — we'll treat it as unknown, never as unmet.",
  },
  4: {
    question: "Tell us about your household.",
    why: "Need-based programmes publish income ceilings, and a ceiling means something different for a household of two than for eight.",
    optional: true,
  },
  5: {
    question: "Anything else you'd like Tul.AI to know?",
    why: "This is where AI earns its place: a sentence in your own words can surface a programme no dropdown would have found.",
    optional: true,
  },
};

/**
 * The onboarding conversation (PRD §12): one question per screen, always showing
 * where you are, why the question matters, and whether it's optional.
 *
 * The step lives in the URL, so Back, Forward and a shared link all behave.
 */
export function OnboardingFlow({ step }: { step: number }) {
  const router = useRouter();
  const { state, dispatch } = useTulAi();
  const profile = state.profile;

  const meta = STEP_META[step];
  const ready = canAdvance(step, profile);
  const isLast = step === ONBOARDING_STEPS;

  const setField = useCallback(
    (field: keyof Omit<Profile, "chips">, value: string) =>
      dispatch({ type: "SET_FIELD", field, value }),
    [dispatch]
  );

  const goTo = useCallback(
    (next: number) => {
      if (next < 1) {
        router.push(ROUTES.home);
        return;
      }
      if (next > ONBOARDING_STEPS) {
        router.push(ROUTES.matching);
        return;
      }
      router.push(ROUTES.onboardingStep(next));
    },
    [router]
  );

  const advance = useCallback(() => {
    if (!ready) return;
    goTo(step + 1);
  }, [goTo, ready, step]);

  /* The options a number key can pick on this step. */
  const shortcuts = useMemo<string[]>(() => {
    if (step === 1) return LOCATIONS.map((l) => l.value);
    if (step === 3) return STAGE_OPTS;
    if (step === 4) return INCOMES;
    return [];
  }, [step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);

      if (e.key === "Enter" && !e.shiftKey) {
        if (typing && target?.tagName === "TEXTAREA") return;
        e.preventDefault();
        if (ready) advance();
        return;
      }
      if (typing) return;

      const n = Number(e.key);
      if (!Number.isNaN(n) && n >= 1 && n <= shortcuts.length) {
        e.preventDefault();
        const value = shortcuts[n - 1];
        if (step === 1) setField("city", value);
        else if (step === 3) setField("stage", value);
        else if (step === 4) setField("income", value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, ready, setField, shortcuts, step]);

  const knownLocation = LOCATIONS.some((l) => l.value === profile.city);
  const otherSelected = profile.city !== "" && !knownLocation;
  const needsYear = profile.stage === "College Student" || profile.stage === "Graduate Student";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* ── Progress ── */}
      <div
        className="flex gap-1.5"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={ONBOARDING_STEPS}
        aria-valuenow={step}
        aria-label={`Question ${step} of ${ONBOARDING_STEPS}`}
      >
        {Array.from({ length: ONBOARDING_STEPS }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-[3px] flex-1 rounded-full transition-colors",
              i < step ? "bg-indigo" : "bg-hairline"
            )}
          />
        ))}
      </div>

      {/* ── Question ── */}
      <div key={step} className="flex-1 pt-12 [animation:rise_360ms_cubic-bezier(.2,.8,.3,1)_both] sm:pt-16">
        <div className="flex items-start justify-between gap-6">
          <h1 className="t-display-xl max-w-[32rem] text-balance">{meta.question}</h1>
          {meta.optional && (
            <span className="t-micro mt-2 flex-none rounded-full border border-hairline px-2.5 py-1 text-ink-mute">
              Optional
            </span>
          )}
        </div>
        <p className="t-body mt-4 max-w-[34rem] text-ink-mute text-pretty">{meta.why}</p>

        <div className="mt-10">
          {/* ── 1 · Location ── */}
          {step === 1 && (
            <fieldset>
              <legend className="sr-only">Where are you studying?</legend>
              <div className="flex flex-col gap-2.5">
                {LOCATIONS.map((location, i) => (
                  <ChoiceCard
                    key={location.value}
                    name="location"
                    value={location.value}
                    label={location.label}
                    note={location.note}
                    shortcut={i + 1}
                    checked={
                      profile.city === location.value ||
                      (location.value === "Somewhere else" && otherSelected)
                    }
                    onSelect={(value) =>
                      setField("city", value === "Somewhere else" ? "Somewhere else" : value)
                    }
                  />
                ))}
              </div>

              {(otherSelected || profile.city === "Somewhere else") && (
                <div className="mt-4 grid gap-2">
                  <Label htmlFor="other-city">Which city or province?</Label>
                  <Input
                    id="other-city"
                    autoFocus
                    className="h-12 rounded-md border-hairline bg-canvas px-4"
                    placeholder="e.g. Iloilo City"
                    value={otherSelected ? profile.city : ""}
                    onChange={(e) =>
                      setField("city", e.target.value.trim() === "" ? "Somewhere else" : e.target.value)
                    }
                  />
                  <p className="t-micro text-ink-mute">
                    Coverage outside Cebu is national programmes for now — we&apos;ll say so
                    rather than pretend otherwise.
                  </p>
                </div>
              )}
            </fieldset>
          )}

          {/* ── 2 · Studies ── */}
          {step === 2 && (
            <div className="flex flex-col gap-8">
              <div className="grid gap-2.5">
                <Label htmlFor="course">Course or programme</Label>
                <Input
                  id="course"
                  autoFocus
                  className="h-12 rounded-md border-hairline bg-canvas px-4"
                  placeholder="e.g. BS Nursing"
                  value={profile.course}
                  onChange={(e) => setField("course", e.target.value)}
                />
                <div className="mt-1 flex flex-wrap gap-2">
                  {COURSE_SUGGESTIONS.map((course) => (
                    <ChoiceChip
                      key={course}
                      label={course}
                      pressed={profile.course === course}
                      onToggle={() =>
                        setField("course", profile.course === course ? "" : course)
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-2.5">
                <Label htmlFor="school">
                  School{" "}
                  <span className="t-micro text-ink-mute">— optional, but it unlocks university grants</span>
                </Label>
                <Input
                  id="school"
                  className="h-12 rounded-md border-hairline bg-canvas px-4"
                  placeholder="e.g. Cebu Technological University"
                  value={profile.school}
                  onChange={(e) => setField("school", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* ── 3 · Academic standing ── */}
          {step === 3 && (
            <div className="flex flex-col gap-8">
              <fieldset>
                <legend className="t-body-strong mb-3">Where are you right now?</legend>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {STAGE_OPTS.map((option, i) => (
                    <ChoiceCard
                      key={option}
                      name="stage"
                      value={option}
                      label={option}
                      shortcut={i + 1}
                      checked={profile.stage === option}
                      onSelect={(value) => setField("stage", value)}
                    />
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-6 sm:grid-cols-2">
                {needsYear && (
                  <div className="grid gap-2.5">
                    <Label htmlFor="year">Year level</Label>
                    <select
                      id="year"
                      className="ring-brand t-body h-12 rounded-md border border-hairline bg-canvas px-3.5 text-ink"
                      value={profile.year}
                      onChange={(e) => setField("year", e.target.value)}
                    >
                      <option value="">Prefer not to say</option>
                      {YEARS.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid gap-2.5">
                  <Label htmlFor="gwa">
                    General weighted average{" "}
                    <span className="t-micro text-ink-mute">— optional</span>
                  </Label>
                  <Input
                    id="gwa"
                    inputMode="decimal"
                    className="h-12 rounded-md border-hairline bg-canvas px-4"
                    placeholder="e.g. 94.5"
                    value={profile.gwa}
                    aria-invalid={gwaError(profile.gwa)}
                    aria-describedby={gwaError(profile.gwa) ? "gwa-error" : undefined}
                    onChange={(e) => setField("gwa", e.target.value)}
                  />
                  {gwaError(profile.gwa) && (
                    <p id="gwa-error" role="alert" className="t-caption text-destructive">
                      Use a number between 60 and 100 — or leave it blank.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── 4 · Household ── */}
          {step === 4 && (
            <div className="flex flex-col gap-8">
              <fieldset>
                <legend className="t-body-strong mb-3">
                  Estimated monthly household income
                </legend>
                <div className="flex flex-col gap-2.5">
                  {INCOMES.map((option, i) => (
                    <ChoiceCard
                      key={option}
                      name="income"
                      value={option}
                      label={option}
                      shortcut={i + 1}
                      checked={profile.income === option}
                      onSelect={(value) => setField("income", value)}
                    />
                  ))}
                </div>
              </fieldset>

              <div className="grid max-w-xs gap-2.5">
                <Label htmlFor="dependents">Household size</Label>
                <Input
                  id="dependents"
                  inputMode="numeric"
                  className="h-12 rounded-md border-hairline bg-canvas px-4"
                  placeholder="e.g. 5"
                  value={profile.dependents}
                  aria-invalid={dependentsError(profile.dependents)}
                  aria-describedby="dependents-hint"
                  onChange={(e) => setField("dependents", e.target.value)}
                />
                <p
                  id="dependents-hint"
                  className={cn(
                    "t-micro",
                    dependentsError(profile.dependents) ? "text-destructive" : "text-ink-mute"
                  )}
                >
                  {dependentsError(profile.dependents)
                    ? "Use a whole number between 0 and 20."
                    : DEPENDENT_HINT}
                </p>
              </div>

              <fieldset>
                <legend className="t-body-strong">Do any of these apply?</legend>
                <p className="t-caption mt-1 mb-3.5 text-ink-mute">
                  Choose as many as you like. Each one unlocks specific programmes — and you
                  can leave them all unticked.
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
              </fieldset>
            </div>
          )}

          {/* ── 5 · In their own words ── */}
          {step === 5 && (
            <div className="flex flex-col gap-5">
              <Label htmlFor="notes" className="sr-only">
                Anything else you&apos;d like Tul.AI to know?
              </Label>
              <Textarea
                id="notes"
                rows={6}
                autoFocus
                className="rounded-lg border-hairline bg-canvas p-4 text-base"
                placeholder="For example: my father works overseas, I'm the first in my family to go to college, and I'm hoping to take nursing."
                value={profile.notes}
                onChange={(e) => setField("notes", e.target.value)}
              />

              <div className="flex gap-3.5 rounded-lg border border-hairline bg-canvas-soft p-4">
                <span
                  className="grid size-7 flex-none place-items-center rounded-md bg-indigo text-white"
                  aria-hidden="true"
                >
                  <SparklesIcon className="size-3.5" />
                </span>
                <p className="t-caption text-ink-mute text-pretty">
                  Tul.AI reads this to propose structured details — an OFW parent,
                  first-generation student, an intended course — and you&apos;ll be able to
                  review and correct them. It never decides eligibility from a sentence.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="sticky bottom-0 mt-12 border-t border-hairline bg-canvas/95 py-5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="h-11 px-3 text-ink-mute"
            onClick={() => goTo(step - 1)}
          >
            <ArrowLeftIcon />
            Back
          </Button>

          <div className="ml-auto flex items-center gap-4">
            {meta.optional && !isLast && (
              <button
                type="button"
                onClick={() => goTo(step + 1)}
                className="ring-brand t-caption rounded-xs text-ink-mute underline decoration-hairline-dark/40 underline-offset-4 hover:text-ink"
              >
                Skip this
              </button>
            )}
            {isLast && (
              <button
                type="button"
                onClick={() => router.push(ROUTES.matching)}
                className="ring-brand t-caption rounded-xs text-ink-mute underline decoration-hairline-dark/40 underline-offset-4 hover:text-ink"
              >
                Skip for now
              </button>
            )}
            <span className="t-micro t-num text-ink-mute">
              {step} of {ONBOARDING_STEPS}
            </span>
            <Button
              className="h-12 rounded-md px-6"
              disabled={!ready}
              onClick={advance}
            >
              {isLast ? "Find my matches" : "Continue"}
              <ArrowRightIcon />
            </Button>
          </div>
        </div>

        {!ready && (
          <p className="t-micro mt-3 text-right text-ink-mute">
            {step === 1
              ? "Pick where you're studying to continue."
              : step === 2
                ? "Tell us what you're studying to continue."
                : step === 3
                  ? "Choose where you are right now to continue."
                  : "Fix the highlighted answer to continue."}
          </p>
        )}
        <p className="t-micro mt-2 hidden text-right text-ink-mute sm:block">
          Press <kbd className="rounded-xs border border-hairline px-1">Enter</kbd> to
          continue{shortcuts.length > 0 && <> · number keys pick an answer</>}
        </p>
      </div>
    </div>
  );
}

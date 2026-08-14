"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  Building2Icon,
  ChurchIcon,
  CheckIcon,
  LandmarkIcon,
  Loader2Icon,
  GraduationCapIcon,
  SparklesIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { BandPicker } from "@/components/app/band-picker";
import { ChoiceCard, ChoiceChip } from "@/components/app/choice-card";
import { DotGrid } from "@/components/site/dot-grid";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  SearchableField,
  SearchableGroupedField,
} from "@/components/ui/searchable-field";
import { Textarea } from "@/components/ui/textarea";
import { useTulAi } from "@/hooks/use-tul-ai";
import { ONBOARDING_STEPS, ROUTES } from "@/lib/logic/routes";
import { useLanguage, useTranslation } from "@/lib/logic/language";
import type { TranslationKey } from "@/lib/logic/translations";
import type { Profile } from "@/lib/logic/state";
import { canAdvance, dependentsError, gwaError, isPlanning } from "@/lib/logic/validation";
import { GWA_BANDS, HOUSEHOLD_BANDS } from "@/lib/reference/bands";
import { COURSE_GROUPS, type CourseOption } from "@/lib/reference/courses";
import { LOCATION_OPTIONS } from "@/lib/reference/locations";
import { schoolsFor, type SchoolKind } from "@/lib/reference/schools";
import {
  CHIP_EXCLUSIVE,
  CHIP_NONE,
  CIRCUMSTANCE_CHIPS,
  CITIZENSHIP_OPTIONS,
  COURSE_SUGGESTIONS,
  DEPENDENT_HINT,
  INCOMES,
  LOCATIONS,
  QUICK_NOTES,
  STAGE_NOTES,
  STAGE_OPTS,
  YEARS,
  chipLabel,
} from "@/lib/scholarships";
import { cn } from "@/lib/utils";

/**
 * The onboarding conversation (PRD §12, spec §3.3): one question per screen,
 * always showing where you are, why the question matters, and whether it's
 * optional. The step lives in the URL, so Back, Forward and a shared link all
 * behave.
 *
 * Six questions, in the order a student can actually answer them:
 *
 *   1. journey    — asked first because it decides whether the rest of the
 *                   conversation may presume enrolment at all. Someone securing
 *                   funding before they commit to a school is never asked where
 *                   they study.
 *   2. location   — ahead of studies so step 3 can filter schools by it.
 *   3. studies    — course, and school only if they have one.
 *   4. academic   — bands, with the exact figure optional.
 *   5. household  — bands and optional circumstances.
 *   6. free text  — with openers, some of which set a structured field rather
 *                   than writing sensitive prose (spec §2.4).
 *
 * Only 1–3 gate progress. Everything after is optional by design: a blank answer
 * becomes an unknown requirement, never a failed one (AGENTS.md §3).
 */

interface StepMeta {
  question: string;
  why: string;
  optional?: boolean;
}

/* Main's school metadata is rendered in the searchable school results below. */
const schoolKindLabels: Record<SchoolKind, string> = {
  state: "State university",
  local: "Local college",
  private: "Private institution",
  sectarian: "Sectarian institution",
};

type ExtractionProposal = {
  city?: string;
  course?: string;
  gwa?: string;
  chips?: string[];
  summary?: string;
};

function SchoolKindIcon({ kind }: { kind: SchoolKind }) {
  const Icon =
    kind === "state"
      ? LandmarkIcon
      : kind === "local"
        ? Building2Icon
        : kind === "sectarian"
          ? ChurchIcon
          : GraduationCapIcon;

  return (
    <span
      className="flex size-8 flex-none items-center justify-center rounded-full bg-canvas-soft text-ink group-data-highlighted:bg-white/15 group-data-highlighted:text-white"
      aria-hidden="true"
    >
      <Icon className="size-4" />
    </span>
  );
}

function metaFor(step: number, planning: boolean, t: (key: TranslationKey) => string): StepMeta {
  switch (step) {
    case 1:
      return {
        question: t("whereStudies"),
        why: t("onboardingWhyStage"),
      };
    case 2:
      return {
        question: t("whereBased"),
        why: t("onboardingWhyLocation"),
      };
    case 3:
      return {
        question: planning ? t("planningStudy") : t("studying"),
        why: t("onboardingWhyCourse"),
      };
    case 4:
      return {
        question: t("academicStanding"),
        why: t("onboardingWhyGwa"),
        optional: true,
      };
    case 5:
      return {
        question: t("household"),
        why: t("onboardingWhyHousehold"),
        optional: true,
      };
    default:
      return {
        question: t("anythingElse"),
        why: t("onboardingWhyAnything"),
        optional: true,
      };
  }
}

export function OnboardingFlow({ step }: { step: number }) {
  const router = useRouter();
  const { state, dispatch } = useTulAi();
  const language = useLanguage();
  const { t } = useTranslation();
  const profile = state.profile;

  const [extracting, setExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<string | null>(null);
  const [extractionProposal, setExtractionProposal] = useState<ExtractionProposal | null>(null);
  const [extractConsent, setExtractConsent] = useState(false);

  const planning = isPlanning(profile);
  const meta = metaFor(step, planning, t);
  const ready = canAdvance(step, profile);
  const isLast = step === ONBOARDING_STEPS;
  /*
   * The first five questions collect core matching inputs with reviewed
   * controls. AI is only a catch-all when it could fill an optional detail the
   * student skipped, rather than a second way to answer the same questions.
   */
  const canUseAiProfileHelper = !profile.gwa.trim() || profile.chips.length === 0;

  const setField = useCallback(
    (field: keyof Omit<Profile, "chips">, value: string) =>
      dispatch({ type: "SET_FIELD", field, value }),
    [dispatch]
  );

  /**
   * Turn the student's own sentence into structured fields (AGENTS.md §7 — the
   * LLM may convert natural language into attributes, but it decides no
   * eligibility and it only ever proposes). Existing answers are never
   * overwritten, and every field it touches is one the student can go back and
   * correct.
   */
  const runAiExtract = async () => {
    if (!profile.notes.trim() || extracting) return;
    setExtracting(true);
    setExtractionResult(null);
    setExtractionProposal(null);
    try {
      const res = await fetch("/api/ai/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: profile.notes, consent: extractConsent, language }),
      });
      const json = await res.json();
      if (json?.extracted) {
        const ext = json.extracted as ExtractionProposal;
        setExtractionProposal(ext);
        setExtractionResult(ext.summary || "Review each suggestion before adding it to your profile.");
      }
    } catch (err) {
      console.error("AI extraction error:", err);
    } finally {
      setExtracting(false);
    }
  };

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
    if (step === 1) return STAGE_OPTS;
    if (step === 4) return GWA_BANDS.map((band) => band.value);
    return [];
  }, [step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);

      if (e.key === "Enter" && !e.shiftKey) {
        if (typing && target?.tagName === "TEXTAREA") return;
        /* A searchable field owns Enter — it commits the highlighted suggestion.
           Advancing on the same keystroke would skip the step the student was
           still answering. */
        if (typing && target?.getAttribute("role") === "combobox") return;
        e.preventDefault();
        if (ready) advance();
        return;
      }
      if (typing) return;

      const n = Number(e.key);
      if (!Number.isNaN(n) && n >= 1 && n <= shortcuts.length) {
        e.preventDefault();
        const value = shortcuts[n - 1];
        if (step === 1) setField("stage", value);
        else if (step === 4) setField("gwaBand", value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, ready, setField, shortcuts, step]);

  const knownLocation = LOCATIONS.some((l) => l.value === profile.city);
  const otherSelected = profile.city !== "" && !knownLocation;
  const needsYear =
    profile.stage === "College Student" || profile.stage === "Graduate Student";

  const schools = useMemo(() => schoolsFor(profile.city), [profile.city]);
  const schoolsByName = useMemo(
    () => new Map(schools.schools.map((school) => [school.name, school])),
    [schools.schools]
  );
  const locationNames = useMemo(() => LOCATION_OPTIONS.map((o) => o.value), []);

  const display = (value: string) =>
    language === "FIL"
      ? ({
          "Grade 12": "Grade 12",
          "Incoming College": "Papasok sa kolehiyo",
          "College Student": "Estudyante sa kolehiyo",
          "Graduate Student": "Estudyanteng kumukuha ng graduate degree",
          "Still planning to study": "Nagpaplano pa lang mag-aral",
          "Finishing senior high and looking ahead to college": "Tinatapos ang senior high at naghahanda para sa kolehiyo",
          "Accepted or enrolling, but classes haven't started": "Tanggap na o nag-e-enroll pa lang, pero hindi pa nagsisimula ang klase",
          "Currently enrolled in an undergraduate programme": "Kasalukuyang naka-enroll sa undergraduate na programa",
          "Taking a master's, doctorate or professional degree": "Kumukuha ng master's, doctorate, o professional degree",
          "Securing funding first — no school decided yet": "Naghahanap muna ng pondo — wala pang napipiling paaralan",
          Filipino: "Filipino",
          "Not a Filipino citizen": "Hindi Pilipinong mamamayan",
          "One of my parents works overseas": "Nagtatrabaho sa ibang bansa ang isa sa mga magulang ko",
          "We're a 4Ps household": "Sambahayan kami ng 4Ps",
          "I'm from a solo-parent household": "Galing ako sa sambahayang may solo parent",
          "I'm the first in my family to go to college": "Ako ang unang mag-aaral sa kolehiyo sa aming pamilya",
          "I'm working while studying": "Nagtatrabaho ako habang nag-aaral",
          "I need allowance, not just tuition": "Kailangan ko ng allowance, hindi tuition lang",
          "I had to stop studying for a while": "Kinailangan kong tumigil muna sa pag-aaral",
          "I'm planning to shift courses": "Nagpaplano akong magpalit ng kurso",
          "Prefer not to say": t("onboardingPreferNot"),
          "Somewhere else": "Ibang lugar",
          "Elsewhere in Cebu": "Ibang bahagi ng Cebu",
          "Metro Manila": "Metro Manila",
          Davao: "Davao",
          "Cebu City": "Cebu City",
          "Below 80": "Mas mababa sa 80",
          "9 or more": "9 o higit pa",
          "None of these apply": "Wala sa mga ito",
          None: "Wala sa mga ito",
          "4Ps household": "Sambahayan ng 4Ps",
          "OFW parent": "Magulang na OFW",
          "Solo-parent household": "Sambahayan ng solo parent",
          PWD: "PWD",
          "Indigenous community": "Katutubong komunidad",
        }[value] ?? value)
      : value;

  const noteFor = (value: string) =>
    language === "FIL"
      ? ({
          "Finishing senior high and looking ahead to college": "Tinatapos ang senior high at naghahanda para sa kolehiyo",
          "Accepted or enrolling, but classes haven't started": "Tanggap na o nag-e-enroll pa lang, pero hindi pa nagsisimula ang klase",
          "Currently enrolled in an undergraduate programme": "Kasalukuyang naka-enroll sa undergraduate na programa",
          "Taking a master's, doctorate or professional degree": "Kumukuha ng master's, doctorate, o professional degree",
          "Securing funding first — no school decided yet": "Naghahanap muna ng pondo — wala pang napipiling paaralan",
          "Usually clears every published cut-off": "Karaniwang pasok sa lahat ng inilathalang cut-off",
          "Clears most merit programmes": "Pasok sa karamihan ng merit programme",
          "Clears many need-based and LGU programmes": "Pasok sa maraming need-based at LGU programme",
          "Below most merit cut-offs, but need-based aid rarely asks": "Mas mababa sa karamihan ng merit cut-off, pero bihirang manghingi ng GWA ang need-based aid",
          "Need-based and category programmes usually publish no GWA": "Karaniwang walang GWA requirement ang need-based at category programme",
          "Treated as unknown — never as a requirement you failed": "Ituturing na unknown — hindi kailanman requirement na hindi mo naabot",
        }[value] ?? value)
      : value;

  const quickNoteText = (note: (typeof QUICK_NOTES)[number]) =>
    language === "FIL"
      ? ({
          "I'm the first in my family to go to college.": "Ako ang unang makakapagkolehiyo sa aming pamilya.",
          "I'm working while studying, so I need something that fits around a job.": "Nagtatrabaho ako habang nag-aaral, kaya kailangan ko ng bagay na maaaring isabay sa trabaho.",
          "Tuition is only part of the problem — I need help with allowance, transport and books too.": "Bahagi lang ng problema ang tuition — kailangan ko rin ng tulong para sa allowance, pamasahe, at libro.",
          "I had to stop studying for a while and I'm returning now.": "Kinailangan kong tumigil muna sa pag-aaral at ngayon ay nagbabalik ako.",
          "I'm planning to shift courses, so I'm open to programmes tied to a different field.": "Nagpaplano akong magpalit ng kurso, kaya bukas ako sa programang kaugnay ng ibang larangan.",
        }[note.text ?? ""] ?? note.text)
      : note.text;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* ── The lime question band ───────────────────────────
          The hero's surface language brought into the product: the same brand
          band, the same recoloured dot field, the same arrival animation. The
          answering surface below stays white, which is DESIGN.md's band →
          white-cards rhythm rather than a full lime page.

          Copy on lime is `ink-deep`, never `ink-mute` — the muted ink falls to
          roughly 3:1 on this surface and would fail WCAG 1.4.3 as body text. */}
      <div className="relative -mx-5 overflow-hidden rounded-b-xl bg-brand px-5 pt-5 pb-9 sm:-mx-8 sm:px-8 lg:pt-4 lg:pb-6">
        <DotGrid baseColor="#86d95a" activeColor="#163300" />

        <div className="relative">
          <div
            className="flex gap-1.5"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={ONBOARDING_STEPS}
            aria-valuenow={step}
              aria-label={`${t("onboardingQuestion")} ${step} / ${ONBOARDING_STEPS}`}
          >
            {Array.from({ length: ONBOARDING_STEPS }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "h-[3px] flex-1 rounded-full transition-colors",
                  i < step ? "bg-ink-deep" : "bg-ink-deep/20"
                )}
              />
            ))}
          </div>

          <div key={step} className="pt-8 lg:pt-5">
            <div className="flex items-start justify-between gap-6">
              <p className="t-eyebrow enter text-ink-deep/70">
                {t("onboardingQuestion")} {step} / {ONBOARDING_STEPS}
              </p>
              {meta.optional && (
                <span className="t-micro enter flex-none rounded-full border border-ink-deep/25 px-2.5 py-1 text-ink-deep">
                  {t("onboardingOptional")}
                </span>
              )}
            </div>
            <h1 className="t-display-xl enter enter-d1 mt-3 max-w-[32rem] text-balance text-ink-deep lg:t-display-lg">
              {meta.question}
            </h1>
            <p className="t-body enter enter-d2 mt-4 max-w-[34rem] text-ink-deep/80 text-pretty">
              {meta.why}
            </p>
          </div>
        </div>
      </div>

      {/* ── The answering surface ────────────────────────── */}
      <div
        key={`answers-${step}`}
        className="flex-1 pt-10 lg:pt-6 [animation:rise_360ms_cubic-bezier(.2,.8,.3,1)_both]"
      >
        {/* ── 1 · Journey ── */}
        {step === 1 && (
          <fieldset>
            <legend className="sr-only">{t("whereStudies")}</legend>
            <div className="flex flex-col gap-2.5 lg:grid lg:grid-cols-2">
              {STAGE_OPTS.map((option, i) => (
                <ChoiceCard
                  key={option}
                  name="stage"
                  value={option}
                  label={display(option)}
                  note={noteFor(STAGE_NOTES[option])}
                  shortcut={i + 1}
                  checked={profile.stage === option}
                  onSelect={(value) => setField("stage", value)}
                />
              ))}
            </div>

            {needsYear && (
              <div className="mt-6 grid max-w-xs gap-2.5">
                <Label htmlFor="year">
                  {t("onboardingYearLevel")} <span className="t-micro text-ink-mute">— {t("optional")}</span>
                </Label>
                <select
                  id="year"
                  className="ring-brand t-body h-12 rounded-md border border-hairline bg-canvas px-3.5 text-ink"
                  value={profile.year}
                  onChange={(e) => setField("year", e.target.value)}
                >
                  <option value="">{t("onboardingPreferNot")}</option>
                  {YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <fieldset className="mt-6">
              <legend className="t-body-strong">{t("onboardingCitizenship")} <span className="t-micro text-ink-mute">— {t("optional")}</span></legend>
              <p className="t-caption mt-1 text-ink-mute text-pretty">{t("onboardingCitizenshipHint")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {CITIZENSHIP_OPTIONS.map((option) => (
                  <ChoiceChip key={option} label={display(option)} pressed={profile.citizenship === option} onToggle={() => setField("citizenship", profile.citizenship === option ? "" : option)} />
                ))}
              </div>
            </fieldset>

            {planning && (
              <Aside>
                {t("onboardingPlanningAside")}
              </Aside>
            )}
          </fieldset>
        )}

        {/* ── 2 · Location ── */}
        {step === 2 && (
          <div className="flex flex-col gap-7 lg:grid lg:grid-cols-2 lg:items-start lg:gap-12">
            <fieldset>
              <legend className="t-body-strong mb-3">{t("onboardingBestCovered")}</legend>
              <div className="flex flex-wrap gap-2">
                {LOCATIONS.filter((l) => l.value !== "Somewhere else").map((location) => (
                  <ChoiceChip
                    key={location.value}
                    label={display(location.label)}
                    pressed={profile.city === location.value}
                    onToggle={() =>
                      setField("city", profile.city === location.value ? "" : location.value)
                    }
                  />
                ))}
              </div>
            </fieldset>

            <div className="grid gap-2.5">
              <Label htmlFor="city">{t("onboardingSearchLocation")}</Label>
              <SearchableField
                id="city"
                items={locationNames}
                value={profile.city}
                onValueChange={(value) => setField("city", value)}
                placeholder="hal. Iloilo City"
                emptyMessage="Wala sa listahan — pananatilihin ang isinulat mo at itutugma sa mga pambansang programa."
              />
              {otherSelected && (
                <p className="t-micro text-ink-mute text-pretty">
                  {t("onboardingLocationCoverage")}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── 3 · Studies ── */}
        {step === 3 && (
          <div className="flex flex-col gap-9 lg:grid lg:grid-cols-2 lg:items-start lg:gap-12">
            <div className="grid gap-2.5">
              <Label htmlFor="course">{t("onboardingCourse")}</Label>
              <SearchableGroupedField<CourseOption>
                id="course"
                groups={COURSE_GROUPS}
                value={profile.course}
                onValueChange={(value) => setField("course", value)}
                itemLabel={(item) => item.name}
                autoFocus
                placeholder={t("onboardingSearchCourses")}
                emptyMessage="Wala sa listahan — pananatilihin namin ang eksaktong isinulat mo at ihahambing ito sa wording ng bawat provider."
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

            {planning ? (
              <Aside>
                {t("onboardingPlanningStudies")}
              </Aside>
            ) : (
              <div className="grid gap-2.5">
                <Label htmlFor="school">
                  {t("onboardingSchool")}{" "}
                  <span className="t-micro text-ink-mute">
                    — {t("optional")}, pero nagbubukas ito ng university grant
                  </span>
                </Label>
                <SearchableField
                  id="school"
                  items={schools.schools.map((school) => school.name)}
                  value={profile.school}
                  onValueChange={(value) => setField("school", value)}
                  placeholder="hal. Cebu Technological University"
                  itemContent={(name) => {
                    const school = schoolsByName.get(name);
                    if (!school) return name;

                    return (
                      <span className="flex min-w-0 items-center gap-3">
                        <SchoolKindIcon kind={school.kind} />
                        <span className="min-w-0 flex-1">
                          <span className="t-body block truncate">{school.name}</span>
                          <span className="t-micro block truncate text-ink-faint group-data-highlighted:text-white/70">
                            {school.city} · {schoolKindLabels[school.kind]}
                          </span>
                        </span>
                      </span>
                    );
                  }}
                  emptyMessage="Wala sa listahan — pananatilihin namin ang isinulat mo."
                />
                <p className="t-micro text-ink-mute text-pretty">
                  {schools.scope === "all"
                    ? language === "FIL"
                      ? `Ipinapakita ang lahat ng ${schools.schools.length} paaralan sa talaan namin.`
                      : `Showing all ${schools.schools.length} schools we hold.`
                    : language === "FIL"
                      ? `Ipinapakita ang ${schools.schools.length} paaralan ${schools.scope === "city" ? "sa" : "sa buong"} ${schools.place} — mag-type para hanapin ang lahat ng paaralan.`
                      : `Showing ${schools.schools.length} ${schools.scope === "city" ? "schools in" : "schools across"} ${schools.place} — type to search every school instead.`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── 4 · Academic standing ── */}
        {step === 4 && (
          <BandPicker
            name="General weighted average"
            bands={GWA_BANDS}
            band={profile.gwaBand}
            onBandChange={(value) => setField("gwaBand", value)}
            exact={profile.gwa}
            onExactChange={(value) => setField("gwa", value)}
            exactLabel={language === "FIL" ? "Eksaktong GWA" : "Exact GWA"}
            exactPlaceholder="hal. 94.5"
            exactHint={language === "FIL" ? "Kailangan lamang kapag tumatawid ang isang range sa cut-off ng provider — sasabihin namin ito sa match kung kinakailangan." : "Only needed when a band sits across a provider's cut-off — we'll tell you on the match if it does."}
            exactError={gwaError(profile.gwa)}
            exactErrorMessage={language === "FIL" ? "Gumamit ng numerong nasa pagitan ng 60 at 100 — o iwan itong blangko." : "Use a number between 60 and 100 — or leave it blank."}
            withheldLabel={t("onboardingPreferNot")}
            disclosureLabel={language === "FIL" ? "Idagdag ang eksaktong GWA (opsyonal)" : "Add my exact GWA (optional)"}
            displayValue={display}
            displayNote={noteFor}
          />
        )}

        {/* ── 5 · Household ── */}
        {step === 5 && (
          <div className="flex flex-col gap-9 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)] lg:items-start lg:gap-x-12 lg:gap-y-8">
            <fieldset className="lg:col-start-1">
              <legend className="t-body-strong mb-3">
                {t("onboardingHouseholdIncome")}
              </legend>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {INCOMES.map((option) => (
                  <ChoiceCard
                    key={option}
                    name="income"
                    value={option}
                  label={display(option)}
                    checked={profile.income === option}
                    onSelect={(value) => setField("income", value)}
                  />
                ))}
              </div>
            </fieldset>

            <div className="lg:col-start-1">
              <p className="t-body-strong mb-3">{t("onboardingHouseholdSize")}</p>
              <BandPicker
                name="Household size"
                bands={HOUSEHOLD_BANDS}
                band={profile.householdBand}
                onBandChange={(value) => setField("householdBand", value)}
                exact={profile.dependents}
                onExactChange={(value) => setField("dependents", value)}
                exactLabel={language === "FIL" ? "Eksaktong laki ng sambahayan" : "Exact household size"}
                exactPlaceholder="hal. 5"
                exactHint={language === "FIL" ? "Ilang tao ang umaasa sa kitang iyon, kasama ka?" : DEPENDENT_HINT}
                exactError={dependentsError(profile.dependents)}
                exactErrorMessage={language === "FIL" ? "Gumamit ng buong bilang sa pagitan ng 0 at 20." : "Use a whole number between 0 and 20."}
                exactInputMode="numeric"
                disclosureLabel={language === "FIL" ? "Magbigay ng eksaktong bilang (opsyonal)" : "Give an exact number instead (optional)"}
                displayValue={display}
                displayNote={noteFor}
              />
            </div>

            <fieldset className="mx-auto w-full max-w-md text-center lg:col-start-2 lg:row-span-2 lg:row-start-1">
              <legend className="t-body-strong">{t("onboardingCircumstances")}</legend>
              <p className="t-caption mt-1 mb-3.5 text-ink-mute text-pretty">
                Pumili ng ilan hangga't gusto mo — bawat isa ay nagbubukas ng partikular na programa. Ang dalawang nasa ibaba ng linya ay sagot tungkol sa buong listahan, kaya lilinisin ng pagpili sa alinman ang iba.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {CIRCUMSTANCE_CHIPS.map((option) => (
                  <ChoiceChip
                    key={option}
                    label={display(option)}
                    pressed={profile.chips.includes(option)}
                    onToggle={() => dispatch({ type: "TOGGLE_CHIP", value: option })}
                  />
                ))}
              </div>
              <div className="mt-3.5 flex flex-wrap justify-center gap-2 border-t border-hairline pt-3.5">
                {CHIP_EXCLUSIVE.map((option) => (
                  <ChoiceChip
                    key={option}
                    label={display(chipLabel(option))}
                    pressed={profile.chips.includes(option)}
                    onToggle={() => dispatch({ type: "TOGGLE_CHIP", value: option })}
                  />
                ))}
              </div>
              {profile.chips.includes(CHIP_NONE) && (
                <p className="t-micro mx-auto mt-3.5 max-w-[46ch] text-ink-mute text-pretty">
                  Ang mga programang para sa isa sa mga kategorya sa itaas ay lalabas na hindi kasalukuyang kwalipikado dahil sinabi mong walang naaangkop. Alisin ang check kung mas gusto mong hindi ito sagutin.
                </p>
              )}
            </fieldset>
          </div>
        )}

        {/* ── 6 · In their own words ── */}
        {step === 6 && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="t-body-strong mb-3">{t("onboardingQuickStart")}</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_NOTES.map((note) => {
                    const translatedText = quickNoteText(note);
                    const applied = note.chip
                      ? profile.chips.includes(note.chip)
                      : translatedText
                      ? profile.notes.includes(translatedText)
                      : false;
                  return (
                    <ChoiceChip
                      key={note.label}
                      label={display(note.label)}
                      pressed={applied}
                      onToggle={() => {
                        /* A message whose meaning is already a structured field
                           sets that field. Writing it as prose instead would
                           persist sensitive free text we would then have to
                           justify and delete (AGENTS.md §9, spec §2.4). */
                        if (note.chip) {
                          dispatch({ type: "TOGGLE_CHIP", value: note.chip });
                          return;
                        }
                        if (!translatedText) return;
                        const current = profile.notes;
                        if (applied) {
                          setField(
                            "notes",
                            current.replace(translatedText, "").replace(/\s{2,}/g, " ").trim()
                          );
                          return;
                        }
                        setField(
                          "notes",
                          current.trim() ? `${current.trim()} ${translatedText}` : translatedText
                        );
                      }}
                    />
                  );
                })}
              </div>
              <p className="t-micro mt-3 max-w-[52ch] text-ink-mute text-pretty">
                {t("onboardingFirstThree")}
              </p>
            </div>

            <div className="grid gap-2.5">
              <Label htmlFor="notes">{t("onboardingOwnWords")}</Label>
              <Textarea
                id="notes"
                rows={6}
                className="rounded-lg border-hairline bg-canvas p-4 text-base"
                placeholder={language === "FIL" ? "Halimbawa: nagtatrabaho sa ibang bansa ang tatay ko, ako ang unang mag-aaral sa kolehiyo sa aming pamilya, at nais kong kumuha ng nursing." : "For example: my father works overseas, I'm the first in my family to go to college, and I'm hoping to take nursing."}
                value={profile.notes}
                onChange={(e) => setField("notes", e.target.value)}
              />
            </div>

            {canUseAiProfileHelper && (
              <div className="flex flex-col gap-3">
                <p className="t-micro max-w-[58ch] text-ink-mute text-pretty">
                  {t("onboardingAiHint")}
                </p>
              <Button
                type="button"
                variant="outline"
                disabled={!profile.notes.trim() || extracting || !extractConsent}
                onClick={runAiExtract}
                className="h-11 w-full justify-center gap-2 rounded-md border-hairline-dark/40 bg-canvas text-ink hover:bg-canvas-soft sm:w-auto"
              >
                {extracting ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    {t("onboardingAiParsing")}
                  </>
                ) : (
                  <>
                    <SparklesIcon className="size-4 text-brand" />
                    {t("onboardingAiCheck")}
                  </>
                )}
              </Button>

              {extractionResult && (
                <div className="flex items-start gap-3 rounded-lg border border-met/30 bg-met/10 p-4 [animation:rise_260ms_cubic-bezier(.2,.8,.3,1)_both]">
                  <span
                    className="grid size-5 flex-none place-items-center rounded-full bg-met text-white"
                    aria-hidden="true"
                  >
                    <CheckIcon className="size-3" strokeWidth={3} />
                  </span>
                  <div>
                    <p className="t-caption-strong text-ink">{t("onboardingOptionalProposed")}</p>
                    <p className="t-caption mt-0.5 text-ink-mute text-pretty">
                      {extractionResult}
                    </p>
                    <p className="t-micro mt-2 text-ink-mute text-pretty">
                      {t("onboardingAiCorrection")}
                    </p>
                    {extractionProposal && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {extractionProposal.course && !profile.course && (
                          <Button type="button" size="sm" variant="outline" onClick={() => setField("course", extractionProposal.course!)}>
                            Add course: {extractionProposal.course}
                          </Button>
                        )}
                        {extractionProposal.city && !profile.city && (
                          <Button type="button" size="sm" variant="outline" onClick={() => setField("city", extractionProposal.city!)}>
                            Add location: {extractionProposal.city}
                          </Button>
                        )}
                        {extractionProposal.gwa && !profile.gwa && (
                          <Button type="button" size="sm" variant="outline" onClick={() => setField("gwa", extractionProposal.gwa!)}>
                            Add GWA: {extractionProposal.gwa}
                          </Button>
                        )}
                        {extractionProposal.chips?.filter((chip) => !profile.chips.includes(chip)).length ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => extractionProposal.chips?.filter((chip) => !profile.chips.includes(chip)).forEach((value) => dispatch({ type: "TOGGLE_CHIP", value }))}
                          >
                            Add circumstances: {extractionProposal.chips.filter((chip) => !profile.chips.includes(chip)).join(", ")}
                          </Button>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <label className="flex items-start gap-2.5">
                <input type="checkbox" checked={extractConsent} onChange={(event) => setExtractConsent(event.target.checked)} className="mt-1 size-4 accent-ink" />
                <span className="t-micro max-w-[58ch] text-ink-mute">{t("onboardingConsent")}</span>
              </label>
              </div>
            )}

            <div className="flex gap-3.5 rounded-lg border border-hairline bg-canvas-soft p-4">
              <span
                className="grid size-7 flex-none place-items-center rounded-md bg-ink text-white"
                aria-hidden="true"
              >
                <SparklesIcon className="size-3.5" />
              </span>
              <p className="t-caption text-ink-mute text-pretty">
                {t("onboardingAiDescription")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="sticky bottom-0 mt-12 border-t border-hairline bg-canvas/95 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:py-5 lg:mt-8 lg:py-3.5">
        <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
          <Button
            variant="ghost"
            className="h-11 px-3 text-ink-mute"
            onClick={() => goTo(step - 1)}
          >
            <ArrowLeftIcon />
            {t("onboardingBack")}
          </Button>

          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            {meta.optional && !isLast && (
              <button
                type="button"
                onClick={() => goTo(step + 1)}
                className="ring-brand t-caption rounded-xs text-ink-mute underline decoration-hairline-dark/40 underline-offset-4 hover:text-ink"
              >
                {t("onboardingSkip")}
              </button>
            )}
            {isLast && (
              <button
                type="button"
                onClick={() => router.push(ROUTES.matching)}
                className="ring-brand t-caption rounded-xs text-ink-mute underline decoration-hairline-dark/40 underline-offset-4 hover:text-ink"
              >
                {t("onboardingSkipNow")}
              </button>
            )}
            <span className="t-micro t-num text-ink-mute">
              {step} of {ONBOARDING_STEPS}
            </span>
          </div>
          <Button
            className="order-3 h-12 w-full rounded-md px-6 sm:order-none sm:ml-1 sm:w-auto"
            disabled={!ready}
            onClick={advance}
          >
              {isLast ? t("onboardingFindMatches") : t("onboardingContinue")}
              {isLast ? <SparklesIcon /> : <ArrowRightIcon />}
          </Button>
        </div>

        {!ready && (
          <p className="t-micro mt-3 text-right text-ink-mute">
            {step === 1
              ? t("onboardingPickStudy")
              : step === 2
                ? t("onboardingTellLocation")
                : step === 3
                  ? t("onboardingTellStudy")
                  : t("onboardingFixAnswer")}
          </p>
        )}
        <p className="t-micro mt-2 hidden text-right text-ink-mute sm:block">
          {t("onboardingPressEnter")} <kbd className="rounded-xs border border-hairline px-1">Enter</kbd> {t("onboardingToContinue")}
          {shortcuts.length > 0 && <> · {t("onboardingNumberKeys")}</>}
        </p>
      </div>
    </div>
  );
}

/** A quiet note explaining a branch the student just took. */
function Aside({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 flex gap-3.5 rounded-lg border border-hairline bg-canvas-soft p-4">
      <span
        className="grid size-6 flex-none place-items-center rounded-full bg-met text-white"
        aria-hidden="true"
      >
        <CheckIcon className="size-3.5" strokeWidth={3} />
      </span>
      <p className="t-caption max-w-[52ch] text-ink-mute text-pretty">{children}</p>
    </div>
  );
}

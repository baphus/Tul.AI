"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  Building2Icon,
  ChevronDownIcon,
  CheckIcon,
  ChurchIcon,
  GraduationCapIcon,
  LandmarkIcon,
  SparklesIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ReactCountryFlag from "react-country-flag";
import { useCallback, useEffect, useMemo, useState } from "react";

import { BandPicker } from "@/components/app/band-picker";
import { ChoiceCard, ChoiceChip, InfoHint } from "@/components/app/choice-card";
import { DotGrid } from "@/components/site/dot-grid";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  SearchableField,
  SearchableGroupedField,
} from "@/components/ui/searchable-field";
import { Textarea } from "@/components/ui/textarea";
import { useTulAi } from "@/hooks/use-tul-ai";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
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
  optional?: boolean;
}

const NOTE_PLACEHOLDERS = [
  "For example: I am working while studying and need support for transport and books.",
  "For example: one of my parents works overseas, and I am preparing for nursing.",
  "For example: I am returning to school and would appreciate help with allowance.",
];

/** A gentle example loop that pauses, erases, then offers another prompt. */
function useTypingPlaceholder(reduced: boolean) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (reduced) return;

    let timeout = 0;
    let example = 0;
    let character = 0;
    let erasing = false;
    const tick = () => {
      const message = NOTE_PLACEHOLDERS[example];
      if (!erasing) {
        character += 1;
        setText(message.slice(0, character));
        if (character === message.length) {
          erasing = true;
          timeout = window.setTimeout(tick, 1800);
          return;
        }
      } else {
        character -= 1;
        setText(message.slice(0, character));
        if (character === 0) {
          erasing = false;
          example = (example + 1) % NOTE_PLACEHOLDERS.length;
          timeout = window.setTimeout(tick, 500);
          return;
        }
      }
      timeout = window.setTimeout(tick, erasing ? 20 : 34);
    };
    timeout = window.setTimeout(tick, 500);
    return () => window.clearTimeout(timeout);
  }, [reduced]);

  return reduced ? NOTE_PLACEHOLDERS[0] : text;
}

/* Main's school metadata is rendered in the searchable school results below. */
const schoolKindLabels: Record<SchoolKind, string> = {
  state: "State university",
  local: "Local college",
  private: "Private institution",
  sectarian: "Sectarian institution",
};

/*
 * Generic institution icon per `kind`, in place of per-school monograms or
 * official seals. One stable glyph covers the whole selector — the kind text
 * beside it carries the distinction — and no unlicensed crest is claimed.
 */
const schoolKindIcons: Record<SchoolKind, LucideIcon> = {
  state: LandmarkIcon,
  local: Building2Icon,
  private: GraduationCapIcon,
  sectarian: ChurchIcon,
};

const SCHOOL_LOGOS: Record<string, string> = {
  "University of San Carlos": "/logos/schools/university-of-san-carlos.png",
  "Cebu Technological University": "/logos/schools/cebu-technological-university.png",
  "University of the Philippines Cebu": "/logos/schools/university-of-the-philippines-cebu.png",
  "Cebu Normal University": "/logos/schools/cebu-normal-university.png",
  "University of Cebu": "/logos/schools/university-of-cebu.png",
  "University of San Jose–Recoletos": "/logos/schools/university-of-san-jose-recoletos.png",
  "Cebu Institute of Technology – University": "/logos/schools/cebu-institute-of-technology-university.png",
  "Southwestern University PHINMA": "/logos/schools/southwestern-university-phinma.png",
  "University of the Visayas": "/logos/schools/university-of-the-visayas.png",
  "Cebu City Medical Center College": "/logos/schools/cebu-city-medical-center-college.png",
  "Cebu Institute of Medicine": "/logos/schools/cebu-institute-of-medicine.png",
  "Asian College of Technology": "/logos/schools/asian-college-of-technology.png",
  "Velez College": "/logos/schools/velez-college.jpg",
  "University of Southern Philippines Foundation": "/logos/schools/university-of-southern-philippines-foundation.png",
  "St. Theresa's College of Cebu": "/logos/schools/st-theresas-college-of-cebu.png",
  "St. Paul College Foundation": "/logos/schools/st-paul-college-foundation.png",
  "University of the Philippines Diliman": "/logos/schools/university-of-the-philippines-diliman.png",
  "University of the Philippines Manila": "/logos/schools/university-of-the-philippines-manila.png",
  "Ateneo de Manila University": "/logos/schools/ateneo-de-manila-university.png",
  "De La Salle University": "/logos/schools/de-la-salle-university.png",
  "Far Eastern University": "/logos/schools/far-eastern-university.png",
  "University of Santo Tomas": "/logos/schools/university-of-santo-tomas.png",
  "Polytechnic University of the Philippines": "/logos/schools/polytechnic-university-of-the-philippines.png",
  "Mapúa University": "/logos/schools/mapua-university.png",
  "Technological University of the Philippines": "/logos/schools/technological-university-of-the-philippines.png",
  "Pamantasan ng Lungsod ng Maynila": "/logos/schools/pamantasan-ng-lungsod-ng-maynila.png",
  "Quezon City University": "/logos/schools/quezon-city-university.png",
  "Miriam College": "/logos/schools/miriam-college.png",
  "Rizal Technological University": "/logos/schools/rizal-technological-university.png",
  "Pamantasan ng Lungsod ng Pasig": "/logos/schools/pamantasan-ng-lungsod-ng-pasig.png",
  "Taguig City University": "/logos/schools/taguig-city-university.png",
  "University of Makati": "/logos/schools/university-of-makati.png",
  "Marikina Polytechnic College": "/logos/schools/marikina-polytechnic-college.png",
  "Cebu Doctors' University": "/logos/schools/cebu-doctors-university.png",
  "Benedicto College": "/logos/schools/benedicto-college.png",
  "West Visayas State University": "/logos/schools/west-visayas-state-university.png",
  "Central Philippine University": "/logos/schools/central-philippine-university.png",
  "University of San Agustin": "/logos/schools/university-of-san-agustin.png",
  "Silliman University": "/logos/schools/silliman-university.png",
  "Negros Oriental State University": "/logos/schools/negros-oriental-state-university.png",
  "University of St. La Salle": "/logos/schools/university-of-st-la-salle.png",
  "Carlos Hilado Memorial State University": "/logos/schools/carlos-hilado-memorial-state-university.png",
  "Visayas State University": "/logos/schools/visayas-state-university.png",
  "Eastern Visayas State University": "/logos/schools/eastern-visayas-state-university.png",
  "Bohol Island State University": "/logos/schools/bohol-island-state-university.png",
  "Holy Name University": "/logos/schools/holy-name-university.png",
  "Capiz State University": "/logos/schools/capiz-state-university.png",
  "Aklan State University": "/logos/schools/aklan-state-university.png",
  "University of the Philippines Los Baños": "/logos/schools/university-of-the-philippines-los-banos.png",
  "Benguet State University": "/logos/schools/benguet-state-university.png",
  "Batangas State University": "/logos/schools/batangas-state-university.png",
  "De La Salle Lipa": "/logos/schools/de-la-salle-lipa.png",
  "Cavite State University": "/logos/schools/cavite-state-university.png",
  "Bulacan State University": "/logos/schools/bulacan-state-university.png",
  "Central Luzon State University": "/logos/schools/central-luzon-state-university.png",
  "Holy Angel University": "/logos/schools/holy-angel-university.png",
  "Saint Louis University": "/logos/schools/saint-louis-university.png",
  "Ateneo de Naga University": "/logos/schools/ateneo-de-naga-university.png",
  "Bicol University": "/logos/schools/bicol-university.png",
  "Pangasinan State University": "/logos/schools/pangasinan-state-university.png",
  "Cagayan State University": "/logos/schools/cagayan-state-university.png",
  "Western Philippines University": "/logos/schools/western-philippines-university.png",
  "Mariano Marcos State University": "/logos/schools/mariano-marcos-state-university.png",
  "University of Southeastern Philippines": "/logos/schools/university-of-southeastern-philippines.png",
  "University of Mindanao": "/logos/schools/university-of-mindanao.png",
  "Ateneo de Davao University": "/logos/schools/ateneo-de-davao-university.png",
  "Xavier University – Ateneo de Cagayan": "/logos/schools/xavier-university-ateneo-de-cagayan.png",
  "Mindanao State University – Iligan Institute of Technology": "/logos/schools/mindanao-state-university-iligan-institute-of-technology.png",
  "Western Mindanao State University": "/logos/schools/western-mindanao-state-university.png",
  "Mindanao State University – General Santos": "/logos/schools/mindanao-state-university-general-santos.png",
  "Caraga State University": "/logos/schools/caraga-state-university.png",
  "Central Mindanao University": "/logos/schools/central-mindanao-university.png",
  "Ateneo de Zamboanga University": "/logos/schools/ateneo-de-zamboanga-university.png",
};

function schoolLogo(name: string): string | undefined {
  if (name.startsWith("Cebu Technological University")) {
    return SCHOOL_LOGOS["Cebu Technological University"];
  }
  if (name.startsWith("University of Cebu")) {
    return SCHOOL_LOGOS["University of Cebu"];
  }
  return SCHOOL_LOGOS[name];
}

function SchoolMark({ kind }: { kind: SchoolKind }) {
  const Icon = schoolKindIcons[kind];
  return (
    <span
      className="flex size-8 flex-none items-center justify-center rounded-full bg-ink text-white group-data-highlighted:bg-white group-data-highlighted:text-ink"
      aria-hidden="true"
    >
      <Icon className="size-4" strokeWidth={2} />
    </span>
  );
}

function metaFor(step: number, planning: boolean, t: (key: TranslationKey) => string): StepMeta {
  switch (step) {
    case 1:
      return {
        question: t("whereStudies"),
      };
    case 2:
      return {
        question: t("whereBased"),
      };
    case 3:
      return {
        question: planning ? t("planningStudy") : t("studying"),
      };
    case 4:
      return {
        question: t("academicStanding"),
        optional: true,
      };
    case 5:
      return {
        question: t("household"),
        optional: true,
      };
    default:
      return {
        question: t("anythingElse"),
        optional: true,
      };
  }
}

export function OnboardingFlow({ step }: { step: number }) {
  const router = useRouter();
  const { state, dispatch } = useTulAi();
  const language = useLanguage();
  const { t } = useTranslation();
  const reduced = usePrefersReducedMotion();
  const profile = state.profile;
  const typingPlaceholder = useTypingPlaceholder(reduced);
  const [citizenshipOpen, setCitizenshipOpen] = useState(false);
  const [circumstancesOpen, setCircumstancesOpen] = useState(false);

  const planning = isPlanning(profile);
  const meta = metaFor(step, planning, t);
  const ready = canAdvance(step, profile);
  const isLast = step === ONBOARDING_STEPS;
  const setField = useCallback(
    (field: keyof Omit<Profile, "chips">, value: string) =>
      dispatch({ type: "SET_FIELD", field, value }),
    [dispatch]
  );

  useEffect(() => {
    if (state.hydrated && !profile.citizenship) {
      setField("citizenship", "Filipino");
    }
  }, [profile.citizenship, setField, state.hydrated]);

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
          "Working student": "Nagtatrabaho habang nag-aaral",
          "Allowance support": "Tulong para sa allowance",
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
          "Tuition is only part of the problem - I need help with allowance, transport and books too.": "Bahagi lang ng problema ang tuition - kailangan ko rin ng tulong para sa allowance, pamasahe, at libro.",
          "Tuition is only part of the problem — I need help with allowance, transport and books too.": "Bahagi lang ng problema ang tuition — kailangan ko rin ng tulong para sa allowance, pamasahe, at libro.",
          "I had to stop studying for a while and I'm returning now.": "Kinailangan kong tumigil muna sa pag-aaral at ngayon ay nagbabalik ako.",
          "I'm planning to shift courses, so I'm open to programmes tied to a different field.": "Nagpaplano akong magpalit ng kurso, kaya bukas ako sa programang kaugnay ng ibang larangan.",
        }[note.text ?? ""] ?? note.text)
      : note.text;

  const fieldCopy = language === "FIL"
    ? {
        locationEmpty: "Wala sa listahan — pananatilihin ang isinulat mo at itutugma sa mga pambansang programa.",
        courseEmpty: "Wala sa listahan — pananatilihin namin ang eksaktong isinulat mo at ihahambing ito sa wording ng bawat provider.",
        schoolExtra: "pero nagbubukas ito ng university grant",
        schoolEmpty: "Wala sa listahan — pananatilihin namin ang isinulat mo.",
        noCircumstances: "Ang mga programang para sa isa sa mga kategorya sa itaas ay lalabas na hindi kasalukuyang kwalipikado dahil sinabi mong walang naaangkop. Alisin ang check kung mas gusto mong hindi ito sagutin.",
      }
    : language === "BIS"
      ? {
          locationEmpty: "Wala sa lista — tipigan ang imong gisulat ug itugma sa nasudnong mga programa.",
          courseEmpty: "Wala sa lista — tipigan namo ang eksakto nimong gisulat ug itandi sa mga pulong sa matag provider.",
          schoolExtra: "apan makabukas kini og grant sa unibersidad",
          schoolEmpty: "Wala sa lista — tipigan namo ang imong gisulat.",
          noCircumstances: "Ang mga programa alang sa usa sa mga kategorya sa ibabaw ipakita nga dili karon eligible tungod kay miingon kang walay angay. Tangtanga ang check kon mas gusto nimo nga dili kini tubagon.",
        }
      : {
          locationEmpty: "Not in the list — we'll keep what you typed and match it against national programmes.",
          courseEmpty: "Not in the list — we'll keep exactly what you typed and compare it with each provider's wording.",
          schoolExtra: "but it unlocks university grants",
          schoolEmpty: "Not in the list — we'll keep what you typed.",
          noCircumstances: "Programmes for any category above will show as not currently eligible because you said none apply. Clear this choice if you would rather leave the question unanswered.",
        };

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

            <div className="mt-6 grid max-w-xs gap-2.5">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="citizenship">
                  {t("onboardingCitizenship")} <span className="t-micro text-ink-mute">— {t("optional")}</span>
                </Label>
                <InfoHint label={t("onboardingMoreInfo")}>
                  {t("onboardingCitizenshipHint")}
                </InfoHint>
              </div>
              <div className="relative">
                <button
                  id="citizenship"
                  type="button"
                  className="ring-brand t-body flex h-12 w-full items-center justify-between rounded-md border border-hairline bg-canvas px-3.5 text-left text-ink"
                  aria-haspopup="listbox"
                  aria-expanded={citizenshipOpen}
                  onClick={() => setCitizenshipOpen((open) => !open)}
                >
                  <span className="flex items-center gap-2">
                    {profile.citizenship === "Filipino" && (
                      <ReactCountryFlag countryCode="PH" svg aria-hidden="true" style={{ width: "1.25em", height: "1.25em" }} />
                    )}
                    {display(profile.citizenship || "Filipino")}
                  </span>
                  <ChevronDownIcon className="size-4 text-ink-mute" aria-hidden="true" />
                </button>
                {citizenshipOpen && (
                  <div
                    role="listbox"
                    aria-label={t("onboardingCitizenship")}
                    className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-hairline bg-canvas p-1.5 shadow-[0_12px_32px_-12px_rgba(14,15,12,0.22)]"
                  >
                    {CITIZENSHIP_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        role="option"
                        aria-selected={profile.citizenship === option}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left t-body hover:bg-canvas-soft"
                        onClick={() => {
                          setField("citizenship", option);
                          setCitizenshipOpen(false);
                        }}
                      >
                        {option === "Filipino" && (
                          <ReactCountryFlag countryCode="PH" svg aria-hidden="true" style={{ width: "1.25em", height: "1.25em" }} />
                        )}
                        {display(option)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {planning && (
              <Aside showInfo={false}>
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
                placeholder={language === "FIL" ? "hal. Iloilo City" : "e.g. Iloilo City"}
                emptyMessage={fieldCopy.locationEmpty}
              />
              {otherSelected && (
                <InfoHint label={t("onboardingMoreInfo")}>
                  {t("onboardingLocationCoverage")}
                </InfoHint>
              )}
            </div>
          </div>
        )}

        {/* ── 3 · Studies ── */}
        {step === 3 && (
          <div className="flex flex-col gap-9">
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
                emptyMessage={fieldCopy.courseEmpty}
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
                    — {t("optional")}, {fieldCopy.schoolExtra}
                  </span>
                </Label>
                <SearchableField
                  id="school"
                  items={schools.schools.map((school) => school.name)}
                  value={profile.school}
                  onValueChange={(value) => setField("school", value)}
                  placeholder={
                    language === "FIL"
                      ? "hal. Cebu Technological University"
                      : "e.g. Cebu Technological University"
                  }
                  itemContent={(name) => {
                    const school = schoolsByName.get(name);
                    if (!school) return name;

                    return (
                      <span className="flex min-w-0 items-center gap-3">
                        {schoolLogo(school.name) ? (
                          <Image
                            src={schoolLogo(school.name)!}
                            alt=""
                            width={32}
                            height={32}
                            className="size-8 flex-none rounded-full object-contain"
                          />
                        ) : (
                          <SchoolMark kind={school.kind} />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="t-body block truncate">{school.name}</span>
                          <span className="t-micro block truncate text-ink-faint group-data-highlighted:text-white/70">
                            {school.city} · {schoolKindLabels[school.kind]}
                          </span>
                        </span>
                      </span>
                    );
                  }}
                  emptyMessage={fieldCopy.schoolEmpty}
                />
                <InfoHint label={t("onboardingMoreInfo")}>
                  {schools.scope === "all"
                    ? language === "FIL"
                      ? `Ipinapakita ang lahat ng ${schools.schools.length} paaralan sa talaan namin.`
                      : `Showing all ${schools.schools.length} schools we hold.`
                    : language === "FIL"
                      ? `Ipinapakita ang ${schools.schools.length} paaralan ${schools.scope === "city" ? "sa" : "sa buong"} ${schools.place} — mag-type para hanapin ang lahat ng paaralan.`
                      : `Showing ${schools.schools.length} ${schools.scope === "city" ? "schools in" : "schools across"} ${schools.place} — type to search every school instead.`}
                </InfoHint>
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
            hintLabel={t("onboardingMoreInfo")}
          />
        )}

        {/* ── 5 · Household ── */}
        {step === 5 && (
          <div className="flex flex-col gap-8">
            <fieldset>
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

            <div>
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
                hintLabel={t("onboardingMoreInfo")}
              />
            </div>

            <div>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl border border-hairline px-4 py-3 text-left transition-colors hover:bg-canvas-soft"
                aria-expanded={circumstancesOpen}
                aria-controls="circumstances-options"
                onClick={() => setCircumstancesOpen((open) => !open)}
              >
                <span className="t-body-strong">{t("onboardingAddCircumstances")}</span>
                <ChevronDownIcon
                  className={`size-4 transition-transform ${circumstancesOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
              {circumstancesOpen && (
                <div id="circumstances-options" className="mt-4 rounded-xl border border-hairline bg-canvas-soft p-4">
                  <fieldset>
                    <legend className="t-body-strong">{t("onboardingCircumstances")}</legend>
                    <div className="mt-1 mb-3.5">
                      <InfoHint label={t("onboardingMoreInfo")}>
                        {t("onboardingCircumstancesHint")}
                      </InfoHint>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {CIRCUMSTANCE_CHIPS.map((option) => (
                        <ChoiceChip
                          key={option}
                          label={display(option)}
                          pressed={profile.chips.includes(option)}
                          onToggle={() => dispatch({ type: "TOGGLE_CHIP", value: option })}
                        />
                      ))}
                    </div>
                    <div className="mt-3.5 flex flex-wrap gap-2 border-t border-hairline pt-3.5">
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
                      <div className="mt-3.5">
                        <InfoHint label={t("onboardingMoreInfo")}>{fieldCopy.noCircumstances}</InfoHint>
                      </div>
                    )}
                  </fieldset>
                </div>
              )}
            </div>
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
            </div>

            <div className="grid gap-2.5">
              <Label htmlFor="notes">{t("onboardingOwnWords")}</Label>
              <Textarea
                id="notes"
                rows={6}
                className="rounded-lg border-hairline bg-canvas p-4 text-base"
                placeholder={profile.notes ? undefined : typingPlaceholder}
                value={profile.notes}
                onChange={(e) => setField("notes", e.target.value)}
              />
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
function Aside({ children, showInfo = true }: { children: React.ReactNode; showInfo?: boolean }) {
  return (
    <div className="mt-6 flex gap-3.5 rounded-lg border border-hairline bg-canvas-soft p-4">
      <span
        className="grid size-6 flex-none place-items-center rounded-full bg-met text-white"
        aria-hidden="true"
      >
        <CheckIcon className="size-3.5" strokeWidth={3} />
      </span>
      {showInfo ? (
        <InfoHint label="Show more information">{children}</InfoHint>
      ) : (
        <p className="t-caption max-w-[52ch] text-ink-mute text-pretty">{children}</p>
      )}
    </div>
  );
}

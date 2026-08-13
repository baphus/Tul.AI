# Onboarding revamp — design

**Status:** approved 2026-08-13 · **Feature refs:** PRD §12 (onboarding), §14 (research
moment), §19 (match buckets) · **Version:** v1.0.0

## Changelog

| Version | Date | Change |
| --- | --- | --- |
| v1.0.0 | 2026-08-13 | Initial design. Six-step onboarding, searchable course/school/location, band pickers, exclusive circumstance chips, work-driven research animation, ranked matches moved to `/matches`, auditable match percentage. |

---

## 1. Why

The onboarding conversation opens with "First, where are you studying?", which assumes
enrolment. A student securing funding *before* they commit to a school cannot answer it
honestly, and the flow has no path for them. Four further problems compound it: course and
school are bare text inputs against a six-item pill list; GWA and household size demand
free-text numbers where a band would do; the circumstance chips let "None" coexist with
"4Ps household"; and the research moment on `/matching` is five fixed `setTimeout` calls
that decide nothing while the ranked results crowd onto the same screen.

## 2. Decisions on record (AGENTS.md §10)

Five product-level judgment calls the PRD does not cover. Recorded here so the next agent
does not relitigate them.

### 2.1 The match percentage is auditable arithmetic, not a score

AGENTS.md §3 forbids unexplained AI confidence scores and names "97.8% match" as the
anti-pattern. The percentage shipped here is `met / total` over *published* requirements,
computed by the deterministic engine, rendered beside the raw count so a student can audit
it. It is not a prediction of award, and no model touches it.

Precedent: `requirementMetric()` in `lib/logic/format.ts` already computes and
`MatchMetric` already renders exactly this figure for the static card fields. This change
extends the same metric to the profile-derived `RankedMatch` path. The landing-page FAQ
entry "Why is there no match percentage?" was the outlier and is rewritten to define what
the number is and is not.

**`total === 0` yields `percent: null`, never 0%.** Most records in `data/scholarships.json`
publish no structured criteria (`minimum_gwa`, `eligible_courses`,
`geographic_requirements`, `income_requirements`, `special_categories` are `null`), so a
naive ratio would print a meaningless 0%. The UI states that the provider publishes nothing
checkable instead. The pre-existing `Math.max(1, card.total)` clamp in `requirementMetric`
is removed for this reason.

### 2.2 A GWA band that straddles a published minimum is Unknown

`eligibility.gwaMin` is a scalar; a band is an interval. Resolution order:

| Situation | State |
| --- | --- |
| exact `gwa` present | exact comparison, unchanged behaviour |
| band low ≥ `gwaMin` | `met` |
| band high < `gwaMin` | `not-met` |
| band spans `gwaMin` (90–94 against a 92 minimum) | `unknown` |

The fourth row is the §3-critical one: a straddling band is insufficient evidence, so it
must not become `not-met`. The detail line names the exact-GWA input as the way to resolve
it, which is what earns that optional field its place.

### 2.3 "None of these apply" is evidence; "Prefer not to say" is not

`matchScholarship` previously treated an empty chip list and "Prefer not to say"
identically as `withheld`. With exclusivity added, "None" becomes a distinct answer:

- **"None of these apply"** → `not-met`. The student affirmatively told us no listed
  circumstance applies, so a 4Ps-only programme genuinely does not fit.
- **"Prefer not to say" or nothing selected** → `unknown`. No evidence either way.

Visible consequence: ticking "None" sinks special-category programmes to "Not currently
eligible" rather than leaving them Possible. This is honest and is the distinction §3
exists to protect, but it is a behaviour change worth naming in review.

### 2.4 Quick messages that duplicate a structured field set the field, not prose

Step 6 offers quick messages. Three natural ones ("one of my parents works overseas",
"I'm the first in my family to go to college") duplicate values already modelled as
`CIRCUMSTANCE_CHIPS`. AGENTS.md §9 prefers reviewed structured fields over persisted
sensitive free text, so those chips **set the structured field and confirm it** rather than
appending prose to `notes`. Only genuinely unstructured messages reach the textarea.

Compliance note: had these written prose, the sensitive free text would need its own
deletion and minimisation story at ISO 27001 / DPTM assessment. Built in rather than
retrofitted.

### 2.5 Bands are the primary input; exact values stay optional

`gwaBand` and `householdBand` are added alongside `gwa` and `dependents` rather than
replacing them. Two reasons: `hydrateState` spreads `emptyProfile()` beneath the persisted
profile (`lib/logic/storage.ts`), so additive fields need no migration and no storage-key
bump; and a band is *coarser* than the exact figure, so a student who answers only the band
discloses strictly less personal data for the same matching power. Net data-minimisation
gain under ISO 27001 A.8.11 and DPTM.

## 3. Architecture

### 3.1 New modules

| Path | Purpose |
| --- | --- |
| `lib/reference/courses.ts` | ~120 programme names as `{ name, cluster }`, grouped for the dropdown |
| `lib/reference/schools.ts` | ~60 HEIs as `{ name, city, province, kind }` + `schoolsFor(location)` |
| `lib/reference/locations.ts` | Cities and provinces for the searchable location field |
| `lib/reference/bands.ts` | GWA and household-size bands with numeric bounds |
| `lib/logic/match-passes.ts` | The five research passes, as pure functions over real records |
| `components/ui/searchable-field.tsx` | Base UI `Autocomplete` wearing the design system |
| `components/app/band-picker.tsx` | Band cards + optional exact-value disclosure |
| `components/app/match-results.tsx` | The ranked list, moved off `/matching` |
| `app/(app)/matches/page.tsx` | The results route |

Reference data lives in `lib/reference/`, deliberately **not** in `lib/scholarships.ts`.
That module holds scholarship domain data carrying `verification` and `sourceTier`; input
vocabulary must not inherit those semantics or the §5 source-trust boundary blurs. These
lists are profile input options, not claims about any provider.

### 3.2 Profile shape — additive only

```ts
stage: string           // gains "Still planning to study"
gwaBand: string         // "95–100" | "90–94" | … | ""
gwa: string             // exact, optional — unchanged
householdBand: string   // "1–2" | "3–4" | … | "9 or more" | ""
dependents: string      // exact, optional — unchanged
```

No storage migration (see §2.5). `dependents`/`householdBand` are read by nothing in the
eligibility engine — only `INCOME_MIDPOINT` is — so they carry no eligibility risk and feed
ranking completeness only.

### 3.3 The six steps

| # | Question | Controls |
| --- | --- | --- |
| 1 | Where are you in your journey? | 5 cards incl. *Still planning to study*; year level inline when enrolled |
| 2 | Where are you based? | Searchable location + the 5 existing quick pills |
| 3 | What are you studying? | Course autocomplete (grouped) + quick pills; school autocomplete filtered by step 2 |
| 4 | What's your academic standing? | GWA band cards + collapsed exact-GWA disclosure |
| 5 | Tell us about your household | Income cards + household band + circumstance chips |
| 6 | Anything else? | Quick messages + free text |

Step 1 asks about the journey rather than the campus, which is the fix for the opening
problem. "Still planning to study" suppresses the school field on step 3 and rewords the
question to "What are you *planning* to study?" — a student with no school is never asked
for one.

Step 2 is reframed from *studying* to *based*: it now exists as much to filter the school
list as to satisfy residency requirements, and it must precede step 3 for that filter to
work.

Only steps 1–3 gate progress, and only on the two fields `isProfileReady` needs. Steps 4–6
never block; a blank answer becomes Unknown, never Not Met.

### 3.4 Routes

`ONBOARDING_STEPS` becomes 6. New `ROUTES.matches = "/matches"`.

- `/matching` — loading only. `router.replace(ROUTES.matches)` when the work lands, so
  Back does not re-run the animation.
- `/matches` — the ranked list, lifted wholesale out of `matching-run.tsx`. Primary CTA is
  `/discover`. Without a ready profile it degrades to the existing two-answers prompt.

### 3.5 The research animation

`runMatchPasses(cards, profile)` exposes five ordered passes, each a pure function over the
real record set returning `{ label, reviewed, hits }`. `MatchingRun` awaits them in
sequence, yielding to the browser between passes so it paints, and ticks counters from the
returned figures. A `MIN_STAGE_MS` floor keeps a fast machine from flashing; reduced-motion
collapses the floor to zero.

The five fixed 760 ms timers and the 900 ms safety fallback both go away — the sequence can
no longer desynchronise from the arithmetic, because it *is* the arithmetic.

Counters become real: records reviewed, requirements checked, unknowns found, programmes
with no conflict.

### 3.6 Visual language

The onboarding surface adopts the hero's language: a `bg-brand` lime band carrying
`DotGrid` (recoloured `#86d95a` → `#163300`, matching the landing hero) behind the progress
bar and question head, over the white answering surface. This is DESIGN.md's band → white
cards rhythm, not a full lime page.

Constraints held: body copy on lime uses `ink-deep`, never `ink-mute` (which falls to ~3:1
on lime and would fail WCAG 1.4.3); `rounded-xl` on cards and buttons; the CTA on lime is
`variant="onBrand"`, since DESIGN.md forbids a lime pill on a lime band; one accent only.

## 4. Testing

| File | Covers |
| --- | --- |
| `lib/logic/matching.test.ts` | four GWA-band branches; three chip states; `percent === null` at `total === 0` |
| `lib/logic/state.test.ts` | chip exclusivity in both directions |
| `lib/logic/validation.test.ts` | six-step `canAdvance`; "Still planning" not requiring a school |
| `lib/logic/format.test.ts` | `requirementMetric` returning `null` rather than 0% at `total === 0` |
| `lib/logic/match-passes.test.ts` | every record visited exactly once; counts reconcile |
| `lib/reference/reference.test.ts` | `schoolsFor` filtering; no duplicate names |

Per AGENTS.md §10, the eligibility-engine and verification-state changes here require tests
— a silent regression in §2.2 or §2.3 is a trust failure, not a bug.

## 5. Standards-readiness check

| Standard | Item | Status |
| --- | --- | --- |
| ISO 27001 A.8.11, DPTM | Data minimisation | **Improved.** Bands disclose less than exact figures for the same matching power (§2.5). |
| ISO 27001, DPTM | Sensitive free text | **Resolved in design.** Quick messages set structured fields rather than persisting prose (§2.4). |
| SOC 2 CC7.2 | Audit surface | **No change.** The percentage is derived at render, never stored. |
| ISO 9001 | Traceability | This document, versioned in-filename with a changelog. |
| AGENTS.md §3 | No invented confidence score | **Held.** `percent` is `met/total` over published criteria, `null` when nothing is checkable. |
| AGENTS.md §3 | Unknown never collapses to Not Met | **Held and extended.** §2.2 adds a new Unknown case rather than a new failure. |
| AGENTS.md §9 | Per-field justification | `gwaBand` / `householdBand` justified in §2.5; both replace finer-grained fields. |

## 6. Out of scope

No change to the swipe deck, the verification flow, the apply dialog, or the scholarship
data set. No autonomous application submission, no acceptance prediction, no new scraping
(AGENTS.md §4).

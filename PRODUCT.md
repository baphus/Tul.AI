# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Filipino students looking for credible education and career opportunities. Their
immediate job is to discover scholarships they may qualify for, understand the
requirements, and continue to the official provider to apply. Future opportunity
categories will support the same job beyond scholarships.

## Product Purpose

Tul.AI is a discovery and guidance layer that bridges students to verified,
relevant opportunities. Its north-star outcome is a student reaching a
source-backed opportunity and proceeding toward the official provider.

## Positioning

Tul.AI combines structured provider information with deterministic eligibility
matching, then explains the result in plain language. It does not make
eligibility or admissions decisions, and it is not an application portal.

## Operating Context

Students browse scholarships, build or edit a profile, review matching results,
save opportunities, and follow official application links. The public roadmap
explains the scholarship capability available today and the student opportunity
categories being explored next.

## Capabilities and Constraints

- Scholarship matching is in beta.
- Future categories are internships, grants and financial aid, student jobs,
  competitions, and mentorship; they are exploratory, not delivery promises.
- Eligibility is deterministic. Missing data must remain `Unknown`, never
  become `Not Eligible`.
- Every scholarship record retains verification status, source tier, and a
  verification timestamp internally. User-facing status and official sources
  remain visible; operational timestamp copy is intentionally absent from the UI.
- Applications and provider decisions stay on official provider sites.
- A roadmap feedback action uses a prefilled `hello@tul.ai` email rather than
  collecting student data in a new form.

## Brand Commitments

Tul.AI follows the existing Wise-inspired light-only system in `DESIGN.md`:
sage and white surfaces, near-black ink, a single lime CTA accent, Manrope and
Inter typography, and 24px card and button radii. The public roadmap is
student-first, restrained, editorial, and accessible.

## Evidence on Hand

- Product requirements: `PRD.md`
- Engineering and product constraints: `AGENTS.md`
- Design system: `DESIGN.md`
- Roadmap UX research: `docs/roadmap-ux-research-2026-08.md`
- Verified scholarship demo data: `lib/scholarships.ts`

No customer testimonials, delivery dates, or public commitments for future
opportunity categories are available. They must not be fabricated.

## Product Principles

1. AI assists; verified information decides.
2. Students stay in control and go to official providers to apply.
3. Make the opportunity landscape understandable without overpromising.
4. Treat privacy and incomplete information as first-class product concerns.
5. Show future direction as exploration, not a delivery contract.

## Accessibility & Inclusion

The experience is mobile-first and must support keyboard navigation, visible
focus states, semantic structure, adequate contrast, and reduced-motion
preferences.

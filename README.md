# Tul.AI

**Bridge to your next opportunity.** Tul.AI is an AI-powered opportunity discovery
platform for Filipino students, starting with scholarships and financial aid. It matches
students to programmes scattered across government agencies, universities, LGUs and
foundations, explains *why* a match exists against the published requirements, and hands
the student off to the official provider to apply.

> **AI assists. Verified information decides.** Matching is produced by a deterministic
> engine over structured data. The AI explains that result — it never decides eligibility,
> never invents a requirement, and never promises an outcome.

Product intent lives in [`PRD.md`](./PRD.md). Engineering rules live in
[`AGENTS.md`](./AGENTS.md). The visual language lives in [`DESIGN.md`](./DESIGN.md). Read
the one that governs what you're about to change.

## Getting started

```bash
bun install      # or npm install
npm run dev      # http://localhost:3000
```

No environment variables are required yet. Scholarship data is the verified demo set in
`lib/scholarships.ts`, served through `getScholarships()` — the seam to swap for an API or
Supabase read.

| Script | What it does |
| --- | --- |
| `npm run dev` | Next 16 + Turbopack dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm test` | Vitest over the pure logic in `lib/` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint 9 flat config |

Run lint, typecheck, test and build before opening a PR.

## Routes

**Marketing** (`app/(marketing)`) — public, prerendered:

| Route | Purpose |
| --- | --- |
| `/` | Landing: the problem, how it works, explainability, verification, FAQ |
| `/how-it-works` | Matching pipeline, the three requirement states, source tiers, boundaries |
| `/roadmap` | Scholarship matching today and the opportunity categories Tul.AI is exploring next |
| `/privacy` | Every field, why it's collected, and how to delete it |
| `/scholarships` | Directory with search, filter and sort |
| `/scholarships/[id]` | The full record — server-rendered and shareable |

**App** (`app/(app)`) — the student flow:

| Route | Purpose |
| --- | --- |
| `/onboarding?step=1…5` | The conversation: one question per screen |
| `/matching` | The research moment, then the ranked top matches for the profile |
| `/discover?card=<id>` | Swipe deck with the full record beside it |
| `/review` | Shortlist before applying, with cross-scholarship advice |
| `/saved` | Deadline tracking and per-application document checklists |
| `/profile` | View, change or delete everything stored |

## Layout of the code

```
app/(marketing)      public pages; header per page so the hero can float its nav
app/(app)            student flow, wrapped in TulAiProvider
components/site      chrome and marketing primitives (header, footer, teal CTA band)
components/scholarship  the record: card, detail, marks, badges, ask/verify/apply islands
components/app       deck, onboarding, review, saved, profile
components/ui        shadcn primitives (Base UI) — generated, avoid hand-editing
hooks                client store + media-query/date hooks
lib/logic            pure, tested logic: reducer, storage, routes, validation,
                     advisory, deadlines, answers, formatting
lib/scholarships.ts  domain types, the verified demo data and getScholarships()
```

Anything that can be a pure function in `lib/logic` should be, because that is the part
covered by tests. The eligibility and verification paths are where a silent regression is a
trust failure rather than a bug.

## Non-negotiables

These are enforced in review, not preference (see `AGENTS.md` §3):

- `Unknown` is never rendered or treated as `Not Eligible`.
- No unexplained AI confidence scores — only `Strong match`, `Good match`,
  `Possible match`, `Not currently eligible`, plus an auditable `x of y requirements met`.
- Every scholarship record carries a verification state, a `lastVerified` date and a source
  tier. Nothing is `Verified` on Tier 4 evidence alone.
- Generated copy never promises an award.
- The hand-off to the official provider stays explicit.

## State of the build

A working prototype of the student experience on demo data. There is no account system and
no server-side database: profile, shortlist and checklists live in the browser's local
storage. Future opportunity categories are described on `/roadmap` but not implemented.

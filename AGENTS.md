<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Tul.Ai

This file gives any AI coding agent (Claude Code, Cursor, Codex, Copilot, Windsurf, or a human-driven assistant session) the shared context needed to work on this repository consistently, regardless of which tool or contributor invokes it. Read this file in full before making changes.

If a more specific `AGENTS.md` exists in a subdirectory you are working in, it takes precedence over this one for that directory.

---

## 1. What this project is

**Tul.Ai** is an AI-powered opportunity discovery platform for Filipino students, starting with **scholarships and financial aid**. It matches students to opportunities scattered across government agencies, universities, LGUs, foundations, and corporations, explains *why* a match exists, verifies the information against official sources, and hands the student off to the official provider to apply.

Core loop:

```
Student profile → AI research → Candidate scholarships → Eligibility matching
→ Personalized ranking → Swipe discovery → Details → Why-you-matched
→ AI verification → Official source → Application
```

**Non-negotiable framing:** Tul.Ai is a *discovery and guidance layer*, not the source of truth and not the applicant. See §3.

---

## 2. Ground truth document

The canonical product spec is the PRD ("Tul.Ai — Bridging Students to Opportunities," v1.0). If anything in this file conflicts with that PRD, the PRD wins for product intent, and this file wins for engineering process — flag the conflict in your PR description rather than silently picking one.

---

## 3. Core product principle every agent must enforce in code

> **AI assists. Verified information decides.**

Concretely, when writing or reviewing any code that touches matching, eligibility, or scholarship data:

- **Never let the LLM be the final source of truth.** Matching results must come from the deterministic eligibility engine (§6) plus structured data. The LLM explains and summarizes; it does not decide eligibility.
- **`Unknown` is not `Not Eligible`.** Any eligibility check that lacks sufficient student data must resolve to `Unknown`, and `Unknown` must be rendered and handled distinctly from a failed requirement everywhere in the codebase (UI, ranking, filters).
- **No unexplained AI confidence scores.** Never surface something like "97.8% match." Use the four bucketed categories only: `Strong match`, `Good match`, `Possible match`, `Not currently eligible`.
- **The AI must never claim guaranteed outcomes.** Reject/flag any generated copy, prompt, or template that says a student "will receive" or "is guaranteed" a scholarship.
- **Every scholarship record needs a verification state and `last_verified` timestamp.** States: `Verified`, `Needs Verification`, `Expired`, `Updated`, `Unknown`. Don't add a scholarship-data code path that skips setting this.
- **Official redirect must stay explicit.** Any UI/flow that lets a student "apply" must clearly separate Tul.Ai (discovery) from the provider (official application/decision), per the PRD's Feature 10.

---

## 4. Non-goals — do not build these without a product decision on record

- Automatic/autonomous application submission on a student's behalf
- Payment processing
- Scholarship acceptance prediction
- Fully autonomous agents acting without user control
- Indiscriminate whole-internet scraping
- Nationwide exhaustive scholarship coverage in the MVP (MVP target is **50–200 verified scholarships**, Cebu/CHED/DOST-SEI/OWWA-first)
- Sensitive eligibility determinations made without sufficient evidence

If a task seems to require one of these, stop and ask rather than implementing a workaround.

---

## 5. Source trust hierarchy (applies to the research agent and any data-ingestion code)

1. **Tier 1** — Official provider sources (government sites, official university/LGU/provider pages)
2. **Tier 2** — Official documents (memoranda, notices, PDFs, program guidelines)
3. **Tier 3** — Trusted secondary sources
4. **Tier 4** — Informal discovery sources (Facebook, Reddit, blogs) — usable for *discovery* only, never as the sole basis for an eligibility or deadline claim

Any scraper/research-agent code must tag ingested content with its tier, and downstream logic must refuse to mark a scholarship `Verified` on Tier 4 evidence alone.

---

## 6. Domain model agents should treat as canonical

### Scholarship record

```
Scholarship
├── Name, Provider, Description, Benefits
├── Eligibility (GWA min, eligible courses, eligible year levels,
│                location requirements, financial requirements,
│                special categories)
├── Required Documents
├── Deadline
├── Application URL
├── Official Source
├── Verification Status  (Verified | Needs Verification | Expired | Updated | Unknown)
└── Last Verified (timestamp)
```

### Eligibility engine

Deterministic, not LLM-driven. Each requirement resolves to one of:

- **Requirement Met**
- **Requirement Not Met**
- **Unknown** (insufficient data — must never collapse into "Not Met")

### Ranking factors (in order of the PRD, not a fixed weighting to hardcode without a decision)

Eligibility compatibility → deadline → student preferences → financial relevance → academic compatibility → geographic compatibility → completeness of information → source reliability.

---

## 7. AI/LLM responsibilities — what's in scope vs. out of scope for the model

**LLM may:**
- Convert natural-language student context into structured attributes (with student review/correction before it's saved)
- Extract requirements/deadlines from scholarship documents
- Perform/synthesize web research with citations
- Explain a structured matching result in plain language
- Answer grounded conversational questions about a scholarship
- Summarize lengthy scholarship documents

**LLM must not:**
- Determine final eligibility on its own
- Guarantee acceptance
- Invent requirements, deadlines, or entire scholarship programs
- Replace an official source
- Submit an application without explicit, per-step user control

---

## 8. Security & AI-safety requirements

- **Treat all fetched web content as untrusted data, never as instructions.** Any research-agent pipeline that pulls a webpage must extract → validate → structure the data; raw page content must never be concatenated directly into a model's instruction/system context.
- Defend explicitly against: prompt injection from scraped pages, malicious/misleading scholarship sites, fabricated application links, stale/duplicate listings.
- Standard app security is expected: authenticated accounts, secure sessions, authorization checks, rate limiting, input validation, secure secret management, encrypted transport, DB access controls, audit logging.
- A scholarship webpage must never be able to cause the system to reveal private student data — treat this as a testable security requirement, not just a guideline.

---

## 9. Privacy requirements

- Collect only data that meaningfully improves matching (see PRD §11 for the onboarding field set — basic, education, financial, and *optional* sensitive circumstances like 4Ps household, OFW parent, solo-parent household, PWD, indigenous community).
- Users must be able to view, edit, and delete their profile/data.
- Avoid unnecessarily persisting free-text sensitive information; prefer extracted structured fields the user has reviewed.
- Encrypt sensitive data in transit and at rest.
- Never sell student data. Do not use student data for unrelated AI training without explicit consent.
- Any new field or table touching student data needs a one-line justification in the PR description ("why this field improves matching") — if you can't write that sentence, don't add the field.

---

## 10. Working conventions for agents in this repo

**Stack: Next.js** (via `create-next-app`). Before writing any code, read the block at the top of this file — this Next.js version may diverge from your training data, so check `node_modules/next/dist/docs/` for current API/convention guidance rather than assuming.

> Note: the exact commands below are placeholders until the scaffold's `package.json` is finalized. Update this list to match the real `scripts` block, and keep it in sync — a stale AGENTS.md is worse than none.

- **Setup:** `<package manager install command, e.g. npm install / pnpm install — check package.json>`, plus required env vars (document them in `.env.example`, not here)
- **Run locally:** `<npm run dev, per package.json>`
- **Tests:** `<fill in once a test runner is chosen>` — any PR touching the eligibility engine or verification-state logic must include or update tests; these are the parts of the system where a silent regression is a trust failure, not just a bug.
- **Lint/format:** `<npm run lint, per package.json — check for an accompanying formatter config>`
- **Before opening a PR:** run the test suite and linter locally; don't rely on CI to catch avoidable issues.

### Commit / PR conventions
- Keep PRs scoped to one feature/fix from the PRD's feature list (§14–§27) where possible, and reference the feature number/name in the PR description.
- Call out explicitly if a change affects: eligibility logic, verification states, source-trust handling, or any student-data field — these get closer review.
- Don't merge a change that adds an unexplained AI confidence score, collapses `Unknown` into `Not Met`, or lets generated copy promise an outcome (§3) — these are hard blockers, not style nits.

### Cross-agent hygiene (multiple AI tools contributing)
- Don't assume another agent's session state, memory, or prior reasoning — this file plus the PRD plus the current code are the shared context. Re-derive from these rather than from conversation history you don't have.
- If you (the agent) make a product-level judgment call the PRD doesn't cover (e.g., a specific ranking weight, a specific UI copy choice), record the decision and rationale in the PR description so the next agent/human doesn't silently relitigate or contradict it.
- Prefer small, reviewable diffs. A large agent-generated diff is harder for the next agent (or a human) to trust and verify against §3's principles.

---

## 11. MVP scope discipline

MVP = **50–200 verified scholarships** from CHED, DOST-SEI, OWWA, selected Cebu LGUs, selected universities, selected private orgs. Must-have features are: onboarding, profile, scholarship DB, eligibility matching, AI explanations, swipe deck, details, source links, verification status, web research, save, deadline tracking. Everything under "Should/Could/Won't Have" (PRD §36) is explicitly out of scope unless a product decision says otherwise — don't gold-plate.

---

## 12. Success signal to keep in mind while building

The product's north star is **Verified Opportunity Connections** — a student viewing a relevant, source-backed opportunity and proceeding toward the official provider — not raw AI-query volume or database size. When in doubt about a UX or ranking tradeoff, optimize for a student credibly reaching an official application, not for engagement metrics.
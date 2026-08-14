# Public roadmap UX research — 14 August 2026

Research scope: high-trust first-party design systems, accessibility standards, and
maintained public-roadmap examples. This brief is for replacing the marketing
`Institutions` page with a student-facing Tul.Ai roadmap. It is product-direction
communication, not a delivery commitment.

## Recommendation in one view

Build a calm, **outcome-led Now / Next / Later** page, not a densely scheduled
Gantt chart. Make the present promise precise — *scholarship discovery with
official-source verification* — then describe later opportunity categories as
exploratory directions. Each phase should say what a student will be able to do,
why it matters, and its plain-language state. Show a visible `Last updated` date
and a short statement that future directions may change.

This format directly supports Tul.Ai's product principle: it avoids implying that
an unbuilt matching category, a provider, or an outcome is guaranteed.

## Evidence-backed product and content decisions

| Decision | Evidence and application to Tul.Ai |
| --- | --- |
| Lead with a vision, priorities, progress, and the reason each item matters. | Atlassian defines product roadmaps as communicating vision, direction, priorities, and progress; it also advises connecting work to goals and showing only the detail the audience needs. [Product roadmap guide](https://www.atlassian.com/en/agile/product-management/product-roadmaps). Use a short intro such as “More verified paths forward for Filipino students,” then give every phase one student outcome and one supporting sentence. |
| Treat the roadmap as directional, not a calendar promise. | Atlassian describes agile roadmaps as dynamic and regularly updated. [Agile roadmaps](https://www.atlassian.com/agile/product-management/roadmaps). GitHub's public roadmap separates `exploring`, `in design`, `preview`, and `ga`, keeps exploratory work without a timeframe, and explicitly says its roadmap is subject to change and not a promise to deliver on a date. [GitHub public roadmap](https://github.com/github/roadmap). For Tul.Ai, use states such as **Available now**, **In discovery**, and **Future direction**; only add dates when they are evidence-backed and owned by the team. |
| Use outcome language, not internal feature labels. | The same Atlassian guidance calls for the “why” behind each item; GitHub attaches a release phase and feature area to every item so people can understand what it is and where it stands. [Atlassian](https://www.atlassian.com/en/agile/product-management/product-roadmaps), [GitHub](https://github.com/github/roadmap). Prefer “Find scholarships you can confidently pursue” over “Scholarship matching v1.” Future cards should name a student goal, e.g. “Discover internships,” rather than imply a committed system. |
| Keep the page scannable: a phase title and a short conclusion first, with optional detail. | Nielsen Norman Group recommends concise, scannable web writing with meaningful headings and the conclusion first. [Be Succinct](https://www.nngroup.com/articles/be-succinct-writing-for-the-web/). Use 3–4 phases, each with a brief headline, state, and a one- or two-sentence explanation; do not turn the page into a PRD. |
| Build a semantic vertical sequence that happens to look like a timeline. | W3C advises using semantic content structure; ordered lists communicate a sequence, and `section` / `article` suit grouped and self-contained content. [WAI content structure tutorial](https://www.w3.org/WAI/tutorials/page-structure/content/). Implement the phase rail as an ordered list in source order. A line, icons, or alternating cards are decoration—not the only way the order is conveyed. |
| Make status understandable without colour. | Carbon's status pattern says colour alone is insufficient and status should use at least two cues such as colour, shape, symbol, and text. [Carbon status indicators](https://carbondesignsystem.com/patterns/status-indicator-pattern/). Each phase needs an explicit text label (for example, “Available now”), plus a glyph; do not use Tul.Ai lime as a success state. Retain lime only for the primary CTA, in line with `DESIGN.md`. |
| Design mobile and keyboard interaction first. | WCAG requires content to reflow without loss of information/functionality at a 320-CSS-pixel viewport (equivalent to 400% zoom at 1280 px). [W3C reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow). It also requires visible keyboard focus. [W3C focus visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible). Use one vertical column at small widths; any card/link must remain a normal focusable link or button. Do not hide timeline detail behind hover. |
| Keep targets comfortably usable and avoid ornamental motion. | WCAG 2.2 sets a 24×24 CSS-pixel minimum target size, and recommends larger targets for important controls. [W3C target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). W3C says non-essential interaction-triggered animation must be disableable. [Animation from interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html). The existing design system's 48 px buttons meet the stronger practical bar; do not use scroll-jacking or continuously animated progress lines, and honor `prefers-reduced-motion`. |

## Proposed information architecture

1. **Hero — “Where Tul.Ai is going”**: one clear sentence: start with verified
   scholarships, then responsibly expand discovery to more student opportunities.
   A lime `Explore scholarships` CTA returns people to a present, usable action.
2. **Roadmap — Now / Next / Later**: an ordered vertical phase list with a visible
   state on every item.
   - **Now · Available now** — verified scholarship discovery, eligibility guidance,
     and official-provider handoff.
   - **Next · In discovery** — internships / grants / programmes only if these are
     genuine research directions; no invented launch window.
   - **Later · Future direction** — a broad category such as wider opportunity
     matching, described as intention rather than a specification.
3. **Trust note**: “Plans can change. We will publish a clear update when a new
   opportunity category is ready to use.” Include `Last updated: <date>`.
4. **Closing band**: a single CTA to discover today's verified scholarships—not a
   waitlist unless the product decision is to collect it with an explained purpose.

## Visual direction, constrained by `DESIGN.md`

- Use the existing sage hero, white phase cards, 24 px radii, hairline ink edges,
  Manrope display / Inter utility hierarchy, and near-black closing band.
- Let the page's distinctive moment be typographic and editorial: a large heavy
  headline, generous white space, and a simple vertical route line. Avoid noisy
  illustration, gradients, new accent colours, fake dashboards, or a horizontally
  scrolling timeline.
- Reserve lime for the main action and a restrained current-phase emphasis. Use the
  semantic status palette only as a secondary functional cue, always paired with
  words and a glyph.

## Award-quality review lens

The aim is a memorable, polished public page whose visual confidence never costs
clarity or accessibility. This is consistent with the Good Design Award jury's
published consideration of usability, understandability, and friendliness alongside
attractiveness. [Good Design Award jury tutorial (PDF)](https://assets.ctfassets.net/5md7dhlbngv9/4OMY7JdTWsscnMetGxqQjO/85ff2220977cdc2aec313cdf3e3d3b86/jury_members_tutorial2023en.pdf)

Before release, review at phone width and 400% zoom; use keyboard-only navigation;
test reduced motion; and ask at least a few Filipino students to answer, without
prompting: “What can I use today? What is only being considered? What should I do
next?” A successful page makes all three answers immediate.

## Decisions still needed

- Which named opportunity categories have passed enough discovery to be presented as
  “Next,” rather than as a generic future direction?
- Is the roadmap only a transparent statement of direction, or should it accept
  feedback / waitlist interest? If it collects interest, what minimal data and
  explicit purpose are justified under the project privacy requirements?
- Will the page have a real owner and update cadence? If not, do not display a
  misleading “last updated” timestamp or date-specific future milestones.

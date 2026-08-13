import { ArrowRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ClosingCta } from "@/components/site/closing-cta";
import {
  Container,
  Section,
  SectionHead,
} from "@/components/site/layout-primitives";
import { SiteHeader } from "@/components/site/site-header";
import { ROUTES } from "@/lib/logic/routes";

export const metadata: Metadata = {
  title: "For institutions",
  description:
    "How universities, LGUs and scholarship providers use Tul.AI to reach the students who actually qualify for their programmes.",
};

const FRICTION: [string, string][] = [
  ["Discovery", "The student never hears the programme exists."],
  ["Eligibility", "The student can't tell whether they qualify, so they don't apply."],
  ["Application", "The student finds it too late to gather documents."],
];

const AUDIENCES = [
  {
    id: "universities",
    label: "Universities",
    title: "Your guidance office stops answering the same question.",
    body: "Most of a counsellor's scholarship workload is eligibility triage — the same handful of questions, asked by hundreds of students. Publishing your programmes as structured records lets students self-serve the objective part and arrive with the question that actually needs a person.",
    points: [
      "Students discover your own grants alongside national ones",
      "Eligibility answered from your published criteria, not hearsay",
      "See which programmes students engage with, and where they stop",
      "No second portal for your team to maintain",
    ],
  },
  {
    id: "lgus",
    label: "LGUs",
    title: "Utilisation, not announcements.",
    body: "A city scholarship that no eligible resident hears about is a budget line that quietly under-delivers. Because matching runs on residency, income bracket and school, your programme reaches the residents who qualify rather than whoever happened to see the post.",
    points: [
      "Reach eligible residents across your own barangays",
      "Fewer missed applications, and fewer ineligible ones",
      "Publish the requirement set once, in your own words",
      "Measure utilisation rather than reach",
    ],
  },
  {
    id: "providers",
    label: "Foundations and providers",
    title: "More qualified applicants, fewer wasted ones.",
    body: "Reviewing applications from students who were never eligible costs your team more than it costs the student. Applicants see which requirements they meet and which they don't before they apply, so the pipeline you receive is closer to the one you wanted.",
    points: [
      "Define eligibility rules students can read plainly",
      "Publish official requirements and documents in one place",
      "Reach student populations you struggle to find",
      "Keep the application on your own site — always",
    ],
  },
];

const MODEL = [
  "Institutional dashboards, analytics and opportunity management, by subscription.",
  "Verified listings and provider tooling for scholarship programmes.",
  "Custom deployments for universities, LGUs and education organisations.",
  "Never: selling student personal data, or anything that trades student trust for revenue.",
];

export default function ForInstitutionsPage() {
  return (
    <>
      <SiteHeader tone="over" />

      <main id="main" className="flex-1">
        <section className="canvas-indigo pt-28 pb-16 sm:pt-32 md:pb-24">
          <Container>
            <h1 className="t-display-xxl max-w-[22ch] text-balance text-white">
              Your programme, in front of the students who qualify.
            </h1>
            <p className="t-body-lg mt-7 max-w-[62ch] text-on-dark-mute text-pretty">
              Tul.AI is a discovery layer, not a competing portal. Applications stay on your
              site and decisions stay yours — we make sure the right students find the
              programme in time, and understand what it asks of them.
            </p>

            <dl className="mt-16 grid gap-8 border-t border-hairline-dark/60 pt-8 md:grid-cols-3 md:gap-12">
              {FRICTION.map(([term, description]) => (
                <div key={term}>
                  <dt className="t-display-md text-white">{term} friction</dt>
                  <dd className="t-caption mt-2 text-on-dark-mute text-pretty">
                    {description}
                  </dd>
                </div>
              ))}
            </dl>
          </Container>
        </section>

        {AUDIENCES.map((audience, i) => (
          <Section
            key={audience.id}
            id={audience.id}
            tone={i % 2 === 1 ? "soft" : "canvas"}
            labelledBy={`${audience.id}-heading`}
          >
            <Container>
              <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
                <div className="lg:col-span-7">
                  <p className="t-caption text-ink-mute">{audience.label}</p>
                  <h2
                    id={`${audience.id}-heading`}
                    className="t-display-xl mt-3 max-w-[26ch] text-balance"
                  >
                    {audience.title}
                  </h2>
                  <p className="t-body-lg mt-6 max-w-[62ch] text-ink-mute text-pretty">
                    {audience.body}
                  </p>
                </div>

                <ul className="lg:col-span-5">
                  {audience.points.map((point, j) => (
                    <li
                      key={point}
                      className={`t-caption py-4 text-ink ${j === 0 ? "border-t border-hairline-dark/25" : ""} border-b border-hairline`}
                    >
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Container>
          </Section>
        ))}

        <Section labelledBy="model-heading">
          <Container>
            <SectionHead
              id="model-heading"
              title="Free for students. Paid for institutions."
              lead="The student experience should not be the thing that gets monetised — that is the fastest way to lose the trust the whole product depends on."
            />
            <ul className="mt-12">
              {MODEL.map((item, i) => (
                <li
                  key={item}
                  className={`t-body-lg max-w-[70ch] py-5 text-ink text-pretty ${i === 0 ? "border-t border-hairline" : ""} border-b border-hairline`}
                >
                  {item}
                </li>
              ))}
            </ul>
            <p className="t-caption mt-8 text-ink-mute">
              Institutional features are on the roadmap, not in this prototype. What you can
              try today is the student experience.
            </p>
            <Link
              href={ROUTES.onboarding}
              className="ring-brand t-body-strong mt-6 inline-flex items-center gap-2 rounded-xs text-indigo underline decoration-indigo/25 underline-offset-4"
            >
              Walk the student flow yourself
              <ArrowRightIcon className="size-4" aria-hidden="true" />
            </Link>
          </Container>
        </Section>

        <ClosingCta
          title="See what your students would see."
          body="The student flow runs on demo data — walk it end to end, then tell us what your programme needs."
          cta="Try the student experience"
          href={ROUTES.onboarding}
        />
      </main>
    </>
  );
}

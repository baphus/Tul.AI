import type { Metadata } from "next";

import { OnboardingHeader } from "@/components/app/app-header";
import { MatchingRun } from "@/components/app/matching-run";

export const metadata: Metadata = {
  title: "Matching your profile",
  description:
    "Tul.AI compares your profile against published opportunity requirements.",
};

export default function MatchingPage() {
  return (
    <>
      <OnboardingHeader />
      <main id="main" className="flex-1 px-5 sm:px-8">
        <MatchingRun />
      </main>
    </>
  );
}

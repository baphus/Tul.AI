import type { Metadata } from "next";

import { OnboardingHeader } from "@/components/app/app-header";
import { MatchResults } from "@/components/app/match-results";

export const metadata: Metadata = {
  title: "Your top matches",
  description:
    "Programmes ranked by the published requirements your profile already meets, with the soonest deadlines first. Unknowns are never counted as failures.",
};

export default function MatchesPage() {
  return (
    <>
      <OnboardingHeader />
      <main id="main" className="flex-1 px-5 sm:px-8">
        <MatchResults />
      </main>
    </>
  );
}

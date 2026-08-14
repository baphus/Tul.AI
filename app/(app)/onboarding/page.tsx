import type { Metadata } from "next";

import { OnboardingHeader } from "@/components/app/app-header";
import { OnboardingFlow } from "@/components/app/onboarding-flow";
import { parseStep } from "@/lib/logic/routes";

export const metadata: Metadata = {
  title: "Build your profile",
  description:
    "Five questions to match you against published scholarship requirements. Only two are required, and a blank answer is treated as unknown rather than unmet.",
};

export default async function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  const params = await searchParams;
  const step = parseStep(params.step);

  return (
    <>
      <OnboardingHeader />
      <main id="main" className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-[46rem] flex-1 flex-col px-5 pt-4 sm:px-8 lg:max-w-[68rem]">
          <OnboardingFlow step={step} />
        </div>
      </main>
    </>
  );
}

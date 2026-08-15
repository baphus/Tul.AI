import { describe, expect, it } from "vitest";

import { DATA } from "@/lib/scholarships";

describe("published scholarship assistance", () => {
  const requestedRecords = [
    "gbf-iskolar-ni-juan-tech-voc-certification-scholarship-program-1",
    "asian-development-bank-japan-scholarship-program-adb-jsp-12",
    "panasonic-college-scholarship-asia-philippines-2",
    "mercury-drug-foundation-inc-mdfi-pharmacy-scholarship-11",
    "aboitiz-future-leaders-scholarship-program-15",
    "sm-foundation-college-scholarship-program-3",
    "ched-merit-scholarship-program-cmsp-ay-2026-2027-39",
    "security-bank-foundation-scholarships-internal-external-and-regalo-mo-ki-19",
    "mdfi-gawad-talino-scholarship-21",
    "megaworld-foundation-scholarship-program-31",
    "amcham-foundation-scholarship-program-32",
    "cebuana-lhuillier-foundation-inc-clfi-nationwide-scholarship-program-29",
    "shell-unlad-sa-pasada-usp-scholarship-program-33",
    "ched-sikap-l-scholarship-legal-education-track-38",
    "cebu-technological-university-internally-funded-scholarships-43",
  ];

  it("has visible provider-published support for every reported record", () => {
    const records = requestedRecords.map((id) => DATA.find((card) => card.id === id));

    expect(records).toHaveLength(15);
    expect(records.every((card) => Boolean(card?.assistance))).toBe(true);
  });

  it("keeps prose-only packages visible instead of rendering them as zero pesos", () => {
    const adb = DATA.find((card) => card.id === "asian-development-bank-japan-scholarship-program-adb-jsp-12");

    expect(adb).toMatchObject({
      amount: 0,
      amountNote: "provider-published support",
      assistance: "Full tuition",
    });
    expect(adb?.benefits).toContain("Monthly subsistence/living allowance");
  });

  it("uses the published CMSP annual maximum when an amount is available", () => {
    const cmsp = DATA.find((card) => card.id === "ched-merit-scholarship-program-cmsp-ay-2026-2027-39");

    expect(cmsp).toMatchObject({ amount: 120000, amountNote: "published benefit" });
  });

  it("keeps Megaworld's published current call distinct from expected annual renewals", () => {
    const megaworld = DATA.find((card) => card.id === "megaworld-foundation-scholarship-program-31");

    expect(megaworld).toMatchObject({ expectedNextCycle: false, verification: "Verified", deadlineIso: "2026-09-01" });
  });
});

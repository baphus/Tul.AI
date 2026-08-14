import { describe, expect, it } from "vitest";

import { cardForId } from "@/lib/logic/routes";
import { DATA } from "@/lib/scholarships";
import {
  cardIndexOf,
  clampStep,
  ONBOARDING_STEPS,
  parseCardId,
  parseStep,
  ROUTES,
} from "./routes";

describe("route builders", () => {
  it("addresses a scholarship by id", () => {
    expect(ROUTES.scholarship(DATA[0].id)).toBe(`/scholarships/${DATA[0].id}`);
    expect(ROUTES.discoverCard(DATA[1].id)).toBe(`/discover?card=${DATA[1].id}`);
  });

  it("escapes anything unusual in a card id", () => {
    expect(ROUTES.discoverCard("a b&c")).toBe("/discover?card=a%20b%26c");
  });

  it("clamps a built onboarding step", () => {
    expect(ROUTES.onboardingStep(0)).toBe("/onboarding?step=1");
    expect(ROUTES.onboardingStep(3)).toBe("/onboarding?step=3");
    expect(ROUTES.onboardingStep(99)).toBe(`/onboarding?step=${ONBOARDING_STEPS}`);
  });
});

describe("clampStep", () => {
  it("keeps a step inside the questionnaire", () => {
    expect(clampStep(-1)).toBe(1);
    expect(clampStep(1)).toBe(1);
    expect(clampStep(ONBOARDING_STEPS + 4)).toBe(ONBOARDING_STEPS);
    expect(clampStep(2.7)).toBe(2);
    expect(clampStep(Number.NaN)).toBe(1);
  });
});

describe("parseStep", () => {
  it("reads a valid step", () => {
    expect(parseStep("3")).toBe(3);
    expect(parseStep(["4"])).toBe(4);
  });

  it("falls back to the first question on junk or absence", () => {
    expect(parseStep(undefined)).toBe(1);
    expect(parseStep("")).toBe(1);
    expect(parseStep("banana")).toBe(1);
    expect(parseStep("0")).toBe(1);
    expect(parseStep("100")).toBe(ONBOARDING_STEPS);
  });
});

describe("parseCardId", () => {
  it("accepts a known scholarship id", () => {
    expect(parseCardId(DATA[2].id)).toBe(DATA[2].id);
    expect(parseCardId([DATA[0].id])).toBe(DATA[0].id);
  });

  it("rejects an unknown id so a stale URL closes the pane", () => {
    expect(parseCardId("not-a-scholarship")).toBeNull();
    expect(parseCardId(undefined)).toBeNull();
    expect(parseCardId("")).toBeNull();
  });
});

describe("cardIndexOf", () => {
  it("maps an id to its deck position", () => {
    DATA.forEach((card, i) => expect(cardIndexOf(card.id)).toBe(i));
  });

  it("returns -1 for nothing or an unknown id", () => {
    expect(cardIndexOf(null)).toBe(-1);
    expect(cardIndexOf("nope")).toBe(-1);
  });
});

describe("cardForId", () => {
  it("keeps the selected scholarship when the rendered collection is reordered", () => {
    const cards = [DATA[1], DATA[0]];
    const selected = cardForId(cards, DATA[0].id);

    expect(selected?.id).toBe(DATA[0].id);
  });
});

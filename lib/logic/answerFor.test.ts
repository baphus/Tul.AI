import { describe, expect, it } from "vitest";
import { DATA } from "@/lib/scholarships";
import { answerFor } from "./answerFor";

const CHED = DATA[0];

describe("answerFor", () => {
  it("answers about holding two scholarships", () => {
    const a = answerFor("Can I hold another scholarship at the same time?", CHED);
    expect(a.text).toContain("second government-funded");
    expect(a.src).toBe(CHED.sources[0].name);
  });

  it("answers about the deadline", () => {
    const a = answerFor("What happens if I miss the deadline?", CHED);
    expect(a.text).toContain(CHED.deadline);
    expect(a.src).toBe(CHED.sources[0].name);
  });

  it("answers about money release", () => {
    const a = answerFor("How is the money paid out?", CHED);
    expect(a.text).toContain("through your school");
  });

  it("refuses to estimate chances (no confidence score)", () => {
    const a = answerFor("What are my chances?", CHED);
    expect(a.text).toContain("can’t estimate your chances");
    expect(a.src).toBeNull();
  });

  it("answers about required documents", () => {
    const a = answerFor("What documents do I need?", CHED);
    expect(a.text).toContain(CHED.needs[0]);
  });

  it("defers to the provider when it cannot ground the answer", () => {
    const a = answerFor("Can I apply in Tagalog?", CHED);
    expect(a.text).toContain("couldn’t find that");
    expect(a.src).toBeNull();
  });
});

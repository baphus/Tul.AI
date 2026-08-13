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
    expect(a.text).toContain("PSA birth certificate");
  });

  it("answers about the amount", () => {
    const a = answerFor("How much is the assistance?", CHED);
    expect(a.text).toContain("₱60,000");
    expect(a.src).toBe(CHED.sources[0].name);
  });

  it("answers about what the programme covers", () => {
    const a = answerFor("What does it cover?", CHED);
    expect(a.text).toBe("Tuition support plus a book and living allowance");
    expect(a.src).toBe(CHED.sources[0].name);
  });

  it("answers about renewal", () => {
    const a = answerFor("Is this renewable?", CHED);
    expect(a.text).toBe("Reviewed every semester against your grades");
  });

  it("answers how to apply", () => {
    const a = answerFor("How do I apply?", CHED);
    expect(a.text).toContain("ched.gov.ph");
    expect(a.text).toContain("PSA birth certificate");
  });

  it("answers whether the record is verified", () => {
    const a = answerFor("Is this verified?", CHED);
    expect(a.text).toContain("Verified");
    expect(a.text).toContain(CHED.lastVerified);
  });

  it("answers who the provider is", () => {
    const a = answerFor("Who offers this?", CHED);
    expect(a.text).toContain("CHED");
    expect(a.text).toContain("ched.gov.ph");
  });

  it("defers to the provider when it cannot ground the answer", () => {
    const a = answerFor("Can I apply in Tagalog?", CHED);
    expect(a.text).toContain("couldn’t find that");
    expect(a.src).toBeNull();
  });
});

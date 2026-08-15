import { describe, expect, it } from "vitest";
import { DATA } from "@/lib/scholarships";
import { answerFor } from "./answerFor";

const CHED = DATA.find((c) => c.id.includes("tulong-dunong-program")) ?? DATA[0];

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
    expect(a.text).toContain("can't estimate your chances");
    expect(a.src).toBeNull();
  });

  it("answers about required documents", () => {
    const a = answerFor("What documents do I need?", CHED);
    expect(a.text).toContain(CHED.needs[0]);
  });

  it("answers about the amount", () => {
    const a = answerFor("How much is the assistance?", CHED);
    expect(a.text).toContain("₱");
    expect(a.src).toBe(CHED.sources[0].name);
  });

  it("answers about how to apply", () => {
    const a = answerFor("How do I apply?", CHED);
    expect(a.text).toContain(CHED.host);
    expect(a.text).toContain(CHED.needs[0]);
  });

  it("answers whether the record is verified", () => {
    const a = answerFor("Is this verified?", CHED);
    expect(a.text).toContain(CHED.verification);
    expect(a.text).toContain(CHED.lastVerified);
  });

  it("answers who the provider is", () => {
    const a = answerFor("Who offers this?", CHED);
    expect(a.text).toContain(CHED.provider);
    expect(a.text).toContain(CHED.host);
  });

  it("answers evaluation questions like 'is this a good scholarship?'", () => {
    const a = answerFor("is this a good scholarship?", CHED);
    expect(a.text).toContain("is a scholarship offering");
    expect(a.src).toBe(CHED.sources[0].name);
  });

  it("answers eligibility questions like 'is this for OFW parents only?'", () => {
    const a = answerFor("is this for OFW parents only?", CHED);
    expect(a.text).toContain("Published eligibility criteria");
    expect(a.src).toBe(CHED.sources[0].name);
  });

  it("directs students to the provider when an answer needs confirmation", () => {
    const a = answerFor("Can I apply in Tagalog?", CHED);
    expect(a.text).toContain("contact " + CHED.provider + " directly");
    expect(a.src).toBeNull();
  });

  it("uses the selected language for the deterministic fallback", () => {
    expect(answerFor("What is the deadline?", CHED, "FIL").text).toContain("inilathalang rekord");
    expect(answerFor("What is the deadline?", CHED, "BIS").text).toContain("gipatik nga rekord");
  });
});

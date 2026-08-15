import { describe, expect, it } from "vitest";

import { DATA } from "@/lib/scholarships";
import { emptyProfile, type Profile } from "./state";
import { chatFor, CHAT_SUGGESTIONS } from "./chat";

const DEMO: Profile = {
  ...emptyProfile(),
  name: "Josephus",
  city: "Cebu City",
  stage: "College Student",
  school: "Cebu Technological University",
  course: "BS Information Systems",
  year: "1st Year",
  gwa: "94.5",
};

describe("chatFor — named programme eligibility", () => {
  it("reports a match from the eligibility engine", () => {
    const reply = chatFor("Am I eligible for DOST?", DEMO, DATA);
    expect(reply.text).toContain("DOST-SEI");
    expect(reply.text).toContain("Undergraduate");
  });

  it("names the hard conflicts instead of guessing", () => {
    const reply = chatFor("Am I eligible for CHED Merit?", { ...DEMO, gwa: "80" }, DATA);
    expect(reply.text).toContain("GWA");
    expect(reply.text).toContain("published requirement");
  });

  it("points at unknowns, never counts them as failures", () => {
    const shsStudent: Profile = { ...DEMO, stage: "Grade 12", year: "Grade 12" };
    const reply = chatFor("Am I eligible for OWWA?", shsStudent, DATA);
    expect(reply.text).toContain("unknown");
    expect(reply.text).not.toContain("not eligible");
  });

  it("matches a colloquial name for a programme", () => {
    const reply = chatFor("Can I apply for the Cebu scholarship?", DEMO, DATA);
    expect(reply.text).toContain("Cebu");
  });

  it("routes factual questions through the per-card rule set", () => {
    const reply = chatFor("When does DOST close?", DEMO, DATA);
    expect(reply.text).toContain("Sep 17, 2026");
  });
});

describe("chatFor — profile-wide questions", () => {
  it("lists the top matches ranked from the profile", () => {
    const reply = chatFor("What can I apply for?", DEMO, DATA);
    expect(reply.text).toContain("CHED");
    expect(reply.text).toContain("match");
  });

  it("asks for onboarding answers before matching", () => {
    const reply = chatFor("What can I apply for?", emptyProfile(), DATA);
    expect(reply.text).toContain("where you're studying");
  });

  it("reports the soonest deadlines among open programmes", () => {
    const reply = chatFor("Which scholarship closes soonest?", DEMO, DATA);
    expect(reply.text).toContain("Inquirer Foundation");
    expect(reply.text).toContain("Jul 31, 2026");
  });

  it("never estimates chances", () => {
    const reply = chatFor("What are my chances?", DEMO, DATA);
    expect(reply.text).toContain("can't estimate");
    expect(reply.text).toContain("programmes");
  });

  it("echoes the profile answers for verification", () => {
    const reply = chatFor("What do you know about me?", DEMO, DATA);
    expect(reply.text).toContain("Cebu City");
    expect(reply.text).toContain("BS Information Systems");
  });
});

describe("chatFor — manners and edge cases", () => {
  it("greets warmly", () => {
    const reply = chatFor("hello", DEMO, DATA);
    expect(reply.text).toContain("Hi!");
  });

  it("improves with an OFW chip in the profile", () => {
    const shsStudent: Profile = { ...DEMO, stage: "Grade 12", year: "Grade 12" };
    const shsOfw: Profile = { ...shsStudent, chips: ["OFW parent"] };
    const before = chatFor("Am I eligible for OWWA?", shsStudent, DATA);
    const after = chatFor("Am I eligible for OWWA?", shsOfw, DATA);
    expect(after.text).toContain("strong match");
    expect(after.text).not.toBe(before.text);
  });

  it("answers an unsupported question with its capability note", () => {
    const reply = chatFor("tell me a joke", DEMO, DATA);
    expect(reply.text).toContain("published records only");
  });

  it("offers suggestion chips", () => {
    expect(CHAT_SUGGESTIONS).toHaveLength(4);
  });

  it("uses Filipino and Bisaya for no-model replies", () => {
    expect(chatFor("Am I eligible for DOST?", DEMO, DATA, "FIL").text).toContain("batay sa iyong sinagutan");
    expect(chatFor("Am I eligible for DOST?", DEMO, DATA, "BIS").text).toContain("base sa imong mga tubag");
  });
});

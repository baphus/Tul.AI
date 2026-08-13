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

const OFW: Profile = {
  ...DEMO,
  chips: ["OFW parent"],
};

describe("chatFor — named programme eligibility", () => {
  it("reports a strong match from the eligibility engine", () => {
    const reply = chatFor("Am I eligible for DOST?", DEMO, DATA);
    expect(reply.text).toContain("strong match");
    expect(reply.text).toContain("DOST-SEI Undergraduate Scholarship");
  });

  it("names the hard conflicts instead of guessing", () => {
    const reply = chatFor("Am I eligible for the CTU grant?", { ...DEMO, gwa: "80" }, DATA);
    expect(reply.text).toContain("GWA");
    expect(reply.text).toContain("published requirement");
  });

  it("points at unknowns, never counts them as failures", () => {
    const reply = chatFor("Am I eligible for OWWA?", DEMO, DATA);
    expect(reply.text).toContain("unknown");
    expect(reply.text).not.toContain("not eligible");
  });

  it("matches a colloquial name for a programme", () => {
    const reply = chatFor("Can I apply for the Cebu City scholarship?", DEMO, DATA);
    expect(reply.text).toContain("Higher Education Assistance");
  });

  it("routes factual questions through the per-card rule set", () => {
    const reply = chatFor("When does DOST close?", DEMO, DATA);
    expect(reply.text).toContain("Sept. 15, 2026");
  });
});

describe("chatFor — profile-wide questions", () => {
  it("lists the top matches ranked from the profile", () => {
    const reply = chatFor("What can I apply for?", DEMO, DATA);
    expect(reply.text).toContain("CHED Merit Scholarship Program");
    expect(reply.text).toContain("Strong match");
  });

  it("asks for onboarding answers before matching", () => {
    const reply = chatFor("What can I apply for?", emptyProfile(), DATA);
    expect(reply.text).toContain("where you're studying");
  });

  it("reports the soonest deadlines among open programmes", () => {
    const reply = chatFor("Which scholarship closes soonest?", DEMO, DATA);
    expect(reply.text).toContain("Cebu City Government");
    expect(reply.text).toContain("Aug. 22, 2026");
  });

  it("never estimates chances", () => {
    const reply = chatFor("What are my chances?", DEMO, DATA);
    expect(reply.text).toContain("can't estimate");
    expect(reply.text).toContain("3 of 6");
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
    const before = chatFor("Am I eligible for OWWA?", DEMO, DATA);
    const after = chatFor("Am I eligible for OWWA?", OFW, DATA);
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
});

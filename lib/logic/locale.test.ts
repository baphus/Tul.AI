import { describe, expect, it } from "vitest";

import { requestedLanguage, responseLanguageInstruction } from "./locale";

describe("locale contract", () => {
  it("accepts only the three supported response languages", () => {
    expect(requestedLanguage("ENG")).toBe("ENG");
    expect(requestedLanguage("FIL")).toBe("FIL");
    expect(requestedLanguage("BIS")).toBe("BIS");
    expect(requestedLanguage("ceb")).toBe("ENG");
  });

  it("keeps Filipino and Bisaya explicitly distinct in AI instructions", () => {
    expect(responseLanguageInstruction("FIL")).toContain("not Bisaya/Cebuano");
    expect(responseLanguageInstruction("BIS")).toContain("not Filipino/Tagalog");
  });
});

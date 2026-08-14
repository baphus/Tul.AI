import { describe, expect, it } from "vitest";

import { resolveAiProvider, resolveOpenAiModel } from "./ai-config";

describe("OpenAI configuration", () => {
  it("uses OpenAI when it is the configured local provider", () => {
    expect(resolveAiProvider({ OPENAI_API_KEY: "test-key" })).toBe("openai");
  });

  it("prefers OpenAI when no provider is explicitly chosen", () => {
    expect(
      resolveAiProvider({ OPENAI_API_KEY: "openai-key", GEMINI_API_KEY: "legacy-key" })
    ).toBe("openai");
  });

  it("uses the documented cost-sensitive OpenAI model by default", () => {
    expect(resolveOpenAiModel({})).toBe("gpt-5.6-luna");
  });
});

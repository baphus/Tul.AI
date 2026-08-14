import { describe, expect, it } from "vitest";

import { generateTulAIJson, resolveAiProvider, resolveOpenAiModel } from "./ai-config";

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

  it("uses JSON-object output for structured OpenAI requests", async () => {
    const originalFetch = globalThis.fetch;
    let requestBody: Record<string, unknown> | undefined;
    globalThis.fetch = async (_input, init) => {
      requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(
        JSON.stringify({ choices: [{ message: { content: '{"answer":"generated"}' } }] }),
        { status: 200 }
      );
    };

    const originalKey = process.env.OPENAI_API_KEY;
    const originalProvider = process.env.AI_PROVIDER;
    process.env.OPENAI_API_KEY = "test-key";
    process.env.AI_PROVIDER = "openai";

    try {
      await expect(generateTulAIJson<{ answer: string }>("Return an answer.")).resolves.toMatchObject({
        success: true,
        data: { answer: "generated" },
      });
      expect(requestBody).toMatchObject({ response_format: { type: "json_object" } });
    } finally {
      globalThis.fetch = originalFetch;
      if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = originalKey;
      if (originalProvider === undefined) delete process.env.AI_PROVIDER;
      else process.env.AI_PROVIDER = originalProvider;
    }
  });
});

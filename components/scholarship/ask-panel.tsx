"use client";

import { ArrowUpIcon } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { answerFor, SUGGESTIONS, type Answer } from "@/lib/logic/answerFor";
import { useTulAiOptional } from "@/hooks/use-tul-ai";
import { useLanguage } from "@/lib/logic/language";
import type { Scholarship } from "@/lib/scholarships";

interface Entry {
  q: string;
  a: Answer | null;
}

/**
 * Grounded Q&A about one scholarship. Every answer is composed from the
 * published record — and when the record doesn't cover the question, the answer
 * says so and points at the provider instead of guessing (AGENTS.md §7).
 *
 * Self-contained: the conversation belongs to this surface, not to global state.
 */
export function AskPanel({ card }: { card: Scholarship }) {
  const [thread, setThread] = useState<Entry[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const language = useLanguage();
  useTulAiOptional();

  const ask = useCallback(
    (question: string) => {
      const q = question.trim();
      if (!q || pending) return;
      setThread((current) => [...current, { q, a: null }]);
      setInput("");
      setPending(true);
      // Always ask the grounded API — it answers with the scholarly record via
      // the LLM when configured and falls back to the deterministic rule set,
      // so a typed question is never limited to the suggestion bubbles.
      fetch("/api/ai/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, cardId: card.id, language }),
      })
        .then((r) => r.json())
        .then((json) => {
          const ans = (json?.answer as Answer | null) ?? answerFor(q, card);
          setThread((current) =>
            current.map((entry, i) => (i === current.length - 1 ? { ...entry, a: ans } : entry))
          );
        })
        .catch(() => {
          const ans = answerFor(q, card);
          setThread((current) =>
            current.map((entry, i) => (i === current.length - 1 ? { ...entry, a: ans } : entry))
          );
        })
        .finally(() => setPending(false));
    },
    [card, language, pending]
  );

  return (
    <div>
      <h2 className="t-display-lg" id="ask">
        Ask about this one
      </h2>
      <p className="t-body mt-2 text-ink-mute text-pretty">
        Answers use the published record. For current facts, Tul.AI may research the
        provider&apos;s official sources and show citations; anything it can&apos;t confirm stays unknown.
      </p>

      {thread.length > 0 && (
        <div className="mt-6 flex flex-col gap-4" aria-live="polite">
          {thread.map((entry, i) => (
            <div key={`${i}-${entry.q}`} className="flex flex-col gap-2.5">
              <p className="t-caption max-w-[85%] self-end rounded-lg rounded-br-xs bg-ink px-4 py-3 text-white">
                {entry.q}
              </p>
              {entry.a && (
                <div className="max-w-[90%] self-start rounded-lg rounded-bl-xs border border-hairline bg-canvas px-4 py-3.5 [animation:rise_260ms_cubic-bezier(.2,.8,.3,1)_both]">
                  <p className="t-caption text-ink">{entry.a.text}</p>
                  {entry.a.src ? (
                    <p className="t-micro mt-3 flex items-center gap-2 border-t border-hairline pt-2.5 text-ink-mute">
                      <span className="size-1.5 rounded-full bg-met" aria-hidden="true" />
                      Source: {entry.a.src}
                    </p>
                  ) : (
                    <p className="t-micro mt-3 border-t border-hairline pt-2.5 text-ink-mute">
                      Not stated in the published information.
                    </p>
                  )}
                  {entry.a.citations?.length ? (
                    <ul className="t-micro mt-2 space-y-1 text-ink-mute">
                      {entry.a.citations.map((citation) => (
                        <li key={citation.url}><a className="ring-brand underline underline-offset-2 hover:text-ink" href={citation.url} target="_blank" rel="noreferrer">{citation.title}</a></li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              )}
            </div>
          ))}
          {pending && (
            <div className="flex w-fit items-center gap-1.5 self-start rounded-lg rounded-bl-xs border border-hairline bg-canvas px-4 py-3.5">
              <span className="sr-only">Looking that up…</span>
              {[0, 0.15, 0.3].map((delay) => (
                <span
                  key={delay}
                  className="size-1.5 rounded-full bg-ink-mute motion-safe:[animation:breathe_1s_ease-in-out_infinite]"
                  style={{ animationDelay: `${delay}s` }}
                  aria-hidden="true"
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {SUGGESTIONS.map((question) => (
          <button
            key={question}
            type="button"
            disabled={pending}
            onClick={() => ask(question)}
            className="ring-brand t-caption rounded-full border border-hairline bg-canvas px-3.5 py-2 text-left text-ink-mute transition-colors hover:border-hairline-dark/30 hover:text-ink disabled:opacity-50"
          >
            {question}
          </button>
        ))}
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <Input
          className="h-11 rounded-sm border-hairline bg-canvas px-3"
          placeholder="Ask anything about this scholarship"
          aria-label="Ask a question about this scholarship"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button
          type="submit"
          size="icon-lg"
          className="size-11 flex-none rounded-md"
          aria-label="Send question"
          disabled={!input.trim() || pending}
        >
          <ArrowUpIcon />
        </Button>
      </form>
    </div>
  );
}

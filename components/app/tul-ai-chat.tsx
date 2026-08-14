"use client";

import { ArrowUpIcon, MessageCircleIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CHAT_SUGGESTIONS, chatFor } from "@/lib/logic/chat";
import type { Answer } from "@/lib/logic/answerFor";
import { useLanguage } from "@/lib/logic/language";
import type { RankedMatch } from "@/lib/logic/matching";
import type { Scholarship } from "@/lib/scholarships";
import { useTulAi } from "@/hooks/use-tul-ai";

interface Entry {
  q: string;
  a: Answer | null;
  origin?: "ai" | "published-record";
}

/**
 * The floating "Ask Tul.AI" widget — a small chatbot that answers from the
 * student's own onboarding answers and the published records.
 *
 * The API gives the model a deterministic match result and the published records
 * to explain. Eligibility and match buckets remain deterministic; when the model
 * is unavailable, the same grounded result is shown without an AI claim.
 */
export function TulAiChat({
  complete,
  matches,
  matchedCards,
}: {
  complete: boolean;
  matches: RankedMatch[];
  matchedCards: Scholarship[];
}) {
  const { state } = useTulAi();
  const language = useLanguage();
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState<Entry[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const requestInFlight = useRef(false);
  const [seenMatchGreeting, setSeenMatchGreeting] = useState(
    () => typeof window !== "undefined" && window.sessionStorage.getItem("tul-ai:chat-match-seen") === "1"
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const profile = state.profile;
  const matchGreeting = completionGreeting(matches);

  /* Keep the latest exchange in view. */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread, pending, open]);

  const ask = useCallback(
    (question: string) => {
      const q = question.trim();
      if (!q || pending || requestInFlight.current) return;
      requestInFlight.current = true;
      setThread((current) => [...current, { q, a: null }]);
      setInput("");
      setPending(true);

      fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, profile, language }),
      })
        .then(async (r) => ({ ok: r.ok, json: await r.json() }))
        .then(({ json }) => {
          const ans = (json?.answer as Answer | null) ?? chatFor(q, profile, matchedCards);
          setThread((current) =>
            current.map((entry, i) =>
              i === current.length - 1
                ? { ...entry, a: ans, origin: json?.answerOrigin === "ai" ? "ai" : "published-record" }
                : entry
            )
          );
        })
        .catch(() => {
          const ans = chatFor(q, profile, matchedCards);
          setThread((current) =>
            current.map((entry, i) =>
              i === current.length - 1
                ? { ...entry, a: ans, origin: "published-record" }
                : entry
            )
          );
        })
        .finally(() => {
          requestInFlight.current = false;
          setPending(false);
        });
    },
    [language, matchedCards, pending, profile]
  );

  if (!complete) return null;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !seenMatchGreeting) {
      window.sessionStorage.setItem("tul-ai:chat-match-seen", "1");
      setSeenMatchGreeting(true);
    }
  };

  return (
    <>
      {/* Launcher */}
      <div className="fixed right-5 bottom-5 z-50 flex items-center gap-2 sm:right-8 sm:bottom-8">
        {!seenMatchGreeting && !open && (
          <span className="t-caption-strong max-w-48 rounded-xl border border-hairline bg-canvas px-3 py-2 text-ink shadow-[0_10px_30px_-8px_rgba(14,15,12,0.22)]">
            You&apos;ve found your matches
          </span>
        )}
        <Button
          type="button"
          size="icon-lg"
          aria-label={open ? "Close Ask Tul.AI" : "Ask Tul.AI about your matches"}
          aria-expanded={open}
          onClick={toggle}
          className="size-13 rounded-full shadow-[0_10px_30px_-8px_rgba(14,15,12,0.35)]"
        >
          {open ? <XIcon /> : <MessageCircleIcon />}
        </Button>
      </div>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Ask Tul.AI"
          className="fixed right-5 bottom-22 z-50 flex max-h-[70vh] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-ink bg-canvas shadow-[0_20px_60px_-15px_rgba(14,15,12,0.4)] [animation:rise_260ms_cubic-bezier(.2,.8,.3,1)_both] sm:right-8 sm:bottom-24"
        >
          <header className="flex items-center gap-3 border-b border-hairline bg-canvas-soft px-4 py-3.5">
            <span className="grid size-8 flex-none place-items-center rounded-full bg-ink text-white">
              <MessageCircleIcon className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="t-caption-strong text-ink">Ask Tul.AI</p>
              <p className="t-micro text-ink-mute">Published records, with cited live research when needed</p>
            </div>
          </header>

          <div ref={scrollRef} className="sc flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {thread.length === 0 && (
              <div className="t-caption max-w-[90%] self-start rounded-lg rounded-bl-xs border border-hairline bg-canvas px-3.5 py-2.5 text-ink [animation:rise_260ms_cubic-bezier(.2,.8,.3,1)_both]">
                <p>{matchGreeting}</p>
              </div>
            )}
            {thread.map((entry, i) => (
              <div key={`${i}-${entry.q || entry.a?.text}`} className="flex flex-col gap-2">
                {entry.q && (
                  <p className="t-caption max-w-[85%] self-end rounded-lg rounded-br-xs bg-ink px-3.5 py-2.5 text-white">
                    {entry.q}
                  </p>
                )}
                {entry.a && (
                  <div className="t-caption max-w-[90%] self-start rounded-lg rounded-bl-xs border border-hairline bg-canvas px-3.5 py-2.5 text-ink [animation:rise_260ms_cubic-bezier(.2,.8,.3,1)_both]">
                    <p>{entry.a.text}</p>
                    <p className="t-micro mt-2 border-t border-hairline pt-2 text-ink-mute">
                      {entry.origin === "ai"
                        ? "AI response grounded in your published matches"
                        : "Published-match answer — AI is unavailable right now"}
                    </p>
                    {entry.a.src && (
                      <p className="t-micro mt-2 text-ink-mute">
                        Source: {entry.a.src}
                      </p>
                    )}
                    {entry.a.citations?.length ? (
                      <ul className="t-micro mt-2 space-y-1 text-ink-mute">
                        {entry.a.citations.map((citation) => (
                          <li key={citation.url}>
                            <a className="ring-brand underline underline-offset-2 hover:text-ink" href={citation.url} target="_blank" rel="noreferrer">{citation.title}</a>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                )}
              </div>
            ))}

            {pending && (
              <div className="flex w-fit items-center gap-1.5 self-start rounded-lg rounded-bl-xs border border-hairline bg-canvas px-3.5 py-2.5">
                <span className="sr-only">Thinking…</span>
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

          {thread.length === 0 && (
            <div className="flex flex-wrap gap-2 border-t border-hairline bg-canvas px-4 pt-3">
              {CHAT_SUGGESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  disabled={pending}
                  onClick={() => ask(question)}
                  className="ring-brand t-caption rounded-full border border-hairline bg-canvas px-3 py-1.5 text-left text-ink-mute transition-colors hover:border-hairline-dark/30 hover:text-ink disabled:opacity-50"
                >
                  {question}
                </button>
              ))}
            </div>
          )}

          <form
            className="flex gap-2 border-t border-hairline bg-canvas p-3"
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
          >
            <Input
              className="h-10 flex-1 rounded-md border-hairline bg-canvas px-3"
              placeholder="Ask about scholarships…"
              aria-label="Ask Tul.AI a question"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button
              type="submit"
              size="icon-lg"
              className="size-10 flex-none rounded-md"
              aria-label="Send question"
              disabled={!input.trim() || pending}
            >
              <ArrowUpIcon />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}

function completionGreeting(matches: RankedMatch[]): string {
  const strong = matches.filter((match) => match.tone === "strong").length;
  const good = matches.filter((match) => match.tone === "good").length;
  const possible = matches.filter((match) => match.tone === "possible").length;
  const total = matches.length;

  if (total === 0) {
    return "You’ve finished your current list. No eligible or possible matches appeared in this verified set yet. I can help you review your profile or research broader opportunities—without treating a search result as a confirmed match.";
  }

  const buckets = [
    strong ? `${strong} strong` : null,
    good ? `${good} good` : null,
    possible ? `${possible} possible` : null,
  ].filter(Boolean);
  return `You’ve found ${total} match${total === 1 ? "" : "es"}: ${buckets.join(", ")}. Ask me to clarify any match or research scholarship questions. Provider sources still decide eligibility, deadlines, and applications.`;
}

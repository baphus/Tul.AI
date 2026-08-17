"use client";

import { MailIcon } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const EMAIL = "hello@tul.ai";

const TOPICS = [
  "Report a wrong or expired detail",
  "Suggest a scholarship",
  "Publish with Tul.AI",
  "A question about my data",
  "Feedback or a bug",
  "Something else",
] as const;

const fieldClass = "h-12 rounded-md border-hairline bg-canvas-soft px-4 text-ink";

/**
 * The prototype has no accounts and no inbox backend, so submitting composes a
 * pre-filled email to hello@tul.ai in the visitor's own mail client. Nothing is
 * sent, stored or tracked by Tul.AI itself.
 */
export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<string>(TOPICS[0]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Enter a valid email so we can reply.");
      return;
    }
    if (!trimmedMessage) {
      setError("Tell us what's on your mind.");
      return;
    }
    setError(null);

    const body = [
      name.trim() ? `Name: ${name.trim()}` : null,
      `Email: ${trimmedEmail}`,
      `Topic: ${topic}`,
      "",
      trimmedMessage,
    ]
      .filter((line): line is string => line !== null)
      .join("\n");

    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(
      `${topic} — via Tul.AI`
    )}&body=${encodeURIComponent(body)}`;
  };

  return (
    <form
      className="flex flex-col gap-5 rounded-xl border border-ink bg-canvas p-6 sm:p-8"
      onSubmit={submit}
      noValidate
      aria-label="Contact form"
    >
      <div className="flex items-center gap-3">
        <MailIcon className="size-5 text-ink" aria-hidden="true" />
        <p className="t-display-md">Send us a message</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2.5">
          <Label htmlFor="contact-name">Name</Label>
          <Input
            id="contact-name"
            autoComplete="name"
            className={fieldClass}
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid gap-2.5">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            type="email"
            autoComplete="email"
            className={fieldClass}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={error ? undefined : false}
          />
        </div>
      </div>

      <div className="grid gap-2.5">
        <Label htmlFor="contact-topic">What is this about?</Label>
        <select
          id="contact-topic"
          className="ring-brand t-body h-12 rounded-md border border-hairline bg-canvas-soft px-3.5 text-ink"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        >
          {TOPICS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2.5">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          rows={6}
          className="rounded-md border-hairline bg-canvas-soft p-4 text-base"
          placeholder="Tell us what's on your mind — a deadline that moved, a scholarship we're missing, or anything else."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className="t-micro text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <Button type="submit" className="h-12 rounded-md px-6">
          Send message
        </Button>
        <p className="t-caption text-ink-mute text-pretty">
          This opens your email app with the message ready to send. Tul.AI doesn&apos;t
          store or track anything from this form.
        </p>
      </div>
    </form>
  );
}
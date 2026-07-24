"use client";

import { useState } from "react";

import { classifySingle } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  /** "user": minimal ack only. "admin": adds a technical detail line for the Try It Live panel. */
  variant?: "user" | "admin";
  /** Called after a successful submit, so a parent dashboard can refetch. */
  onSuccess?: () => void;
};

export function ReviewForm({ variant = "user", onSuccess }: Props) {
  const [text, setText] = useState("");
  const [ack, setAck] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) {
      setError("Please write something before submitting.");
      return;
    }
    setLoading(true);
    setError(null);
    setAck(null);
    try {
      const result = await classifySingle(text);
      setAck(result.acknowledgement_message);
      setText("");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (ack && variant === "user") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-green-100 bg-green-50 px-4 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-2xl text-white">
          ✓
        </div>
        <p className="font-medium text-foreground">Thanks for the feedback!</p>
        <p className="max-w-sm text-sm text-muted-foreground">{ack}</p>
        <Button
          type="button"
          className="mt-1 bg-white text-foreground border border-border hover:bg-muted hover:opacity-100"
          onClick={() => setAck(null)}
        >
          Share another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        rows={4}
        placeholder="Share your feedback about EatSure..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={loading}
      />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit"}
        </Button>
        {variant === "admin" && (
          <span className="text-xs text-muted-foreground">
            Posts to the same live pipeline as the User view — result appears in the charts below.
          </span>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {ack && variant === "admin" && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-foreground">{ack}</p>
      )}
    </form>
  );
}

"use client";

import { useState } from "react";

import { classifySingle } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  /** "user": minimal ack only. "admin": adds a technical detail line for the Try It Live panel. */
  variant?: "user" | "admin";
};

export function ReviewForm({ variant = "user" }: Props) {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
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
      {ack && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-foreground">{ack}</p>
      )}
    </form>
  );
}

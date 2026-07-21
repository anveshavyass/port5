"use client";

import { useState } from "react";

import { askChat, type ChatResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ChatPanel() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<ChatResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await askChat(question);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat is unavailable right now.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardTitle>Ask about your feedback</CardTitle>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder='e.g. "reviews where customers are angry about refunds"'
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Asking..." : "Ask"}
        </Button>
      </form>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {result && (
        <div className="mt-4 space-y-3">
          <p className="text-sm">{result.answer}</p>
          {result.matched_reviews.length > 0 && (
            <ul className="space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
              {result.matched_reviews.map((r, i) => (
                <li key={r.id ?? i}>
                  [{r.category}, {r.sentiment}] {r.review_text}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}

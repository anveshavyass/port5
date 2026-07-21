"use client";

import type { Review } from "@/lib/api";
import { Card, CardTitle } from "@/components/ui/card";

const SENTIMENT_BADGE: Record<string, string> = {
  positive: "bg-green-100 text-green-800",
  neutral: "bg-zinc-100 text-zinc-700",
  negative: "bg-red-100 text-red-800",
};

const URGENCY_BADGE: Record<string, string> = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

export function ReviewsTable({ reviews }: { reviews: Review[] }) {
  return (
    <Card>
      <CardTitle>Reviews ({reviews.length})</CardTitle>
      <div className="max-h-[420px] overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-background text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-2 py-2">Date</th>
              <th className="px-2 py-2">Review</th>
              <th className="px-2 py-2">Category</th>
              <th className="px-2 py-2">Sentiment</th>
              <th className="px-2 py-2">Urgency</th>
              <th className="px-2 py-2">Key phrase</th>
              <th className="px-2 py-2">Source</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.id} className="border-t border-border align-top">
                <td className="whitespace-nowrap px-2 py-2 text-muted-foreground">
                  {r.review_date ?? "—"}
                </td>
                <td className="max-w-sm px-2 py-2">
                  {r.review_text}
                  {!r.is_relevant && (
                    <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500">
                      quarantined: {r.irrelevance_reason}
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-2 py-2">{r.category}</td>
                <td className="px-2 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SENTIMENT_BADGE[r.sentiment] ?? ""}`}>
                    {r.sentiment}
                  </span>
                </td>
                <td className="px-2 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${URGENCY_BADGE[r.urgency] ?? ""}`}>
                    {r.urgency}
                  </span>
                </td>
                <td className="max-w-xs px-2 py-2 text-muted-foreground">{r.key_phrase ?? "—"}</td>
                <td className="whitespace-nowrap px-2 py-2 text-muted-foreground">{r.source}</td>
              </tr>
            ))}
            {reviews.length === 0 && (
              <tr>
                <td colSpan={7} className="px-2 py-6 text-center text-muted-foreground">
                  No reviews yet. Run the classification pipeline to populate this table.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

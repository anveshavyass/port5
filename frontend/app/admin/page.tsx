"use client";

import { useEffect, useState } from "react";

import { getAggregates, getReviews, getSummary, type Aggregates, type Review, type SummaryResponse } from "@/lib/api";
import { Card, CardTitle } from "@/components/ui/card";
import { ReviewForm } from "@/components/ReviewForm";
import {
  CategoryBar,
  RatingSentimentAgreement,
  SentimentDonut,
  TopThemes,
  UrgencyBreakdown,
  WeeklyVolumeTrend,
} from "@/components/Charts";
import { ReviewsTable } from "@/components/ReviewsTable";
import { ChatPanel } from "@/components/ChatPanel";

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="text-center">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </Card>
  );
}

function formatWeekLabel(week: string): string {
  const date = new Date(`${week}T00:00:00`);
  return `Week of ${date.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })}`;
}

export default function AdminPage() {
  const [aggregates, setAggregates] = useState<Aggregates | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [weeklySummary, setWeeklySummary] = useState<SummaryResponse | null>(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);

  useEffect(() => {
    Promise.all([getAggregates(), getSummary(), getReviews()])
      .then(([a, s, r]) => {
        setAggregates(a);
        setSummary(s);
        setReviews(r);
        const weeks = a.weekly_volume.map((w) => w.week);
        if (weeks.length > 0) setSelectedWeek(weeks[weeks.length - 1]);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard data."));
  }, []);

  useEffect(() => {
    if (!selectedWeek) return;
    setWeeklyLoading(true);
    getSummary(selectedWeek)
      .then(setWeeklySummary)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load weekly summary."))
      .finally(() => setWeeklyLoading(false));
  }, [selectedWeek]);

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-red-600">{error}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Check that the FastAPI backend is running and reachable at the configured API base URL.
        </p>
      </main>
    );
  }

  if (!aggregates) {
    return <main className="p-8 text-center text-muted-foreground">Loading dashboard...</main>;
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <h1 className="text-xl font-semibold">PulseAI — EatSure Feedback Intelligence (Admin)</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Total Reviews" value={String(aggregates.total_reviews)} />
        <KpiCard label="Avg Rating" value={aggregates.avg_rating != null ? `${aggregates.avg_rating}★` : "—"} />
        <KpiCard label="% Negative" value={`${aggregates.pct_negative}%`} />
        <KpiCard label="Top Category" value={aggregates.top_category ?? "—"} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SentimentDonut data={aggregates.sentiment_counts} />
        <CategoryBar data={aggregates.category_counts} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <RatingSentimentAgreement data={aggregates.rating_sentiment_agreement} />
        <WeeklyVolumeTrend data={aggregates.weekly_volume} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <UrgencyBreakdown data={aggregates.urgency_counts} />
        <TopThemes data={aggregates.category_counts} />
      </div>

      <Card>
        <CardTitle>Overall Insight Summary</CardTitle>
        <p className="whitespace-pre-line text-sm leading-relaxed">{summary?.summary}</p>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <CardTitle>Weekly Insight Summary</CardTitle>
          <select
            className="rounded-md border bg-background px-2 py-1 text-sm"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
          >
            {aggregates.weekly_volume.map((w) => (
              <option key={w.week} value={w.week}>
                {formatWeekLabel(w.week)} ({w.count})
              </option>
            ))}
          </select>
        </div>
        {weeklyLoading ? (
          <p className="text-sm text-muted-foreground">Generating summary...</p>
        ) : (
          <p className="whitespace-pre-line text-sm leading-relaxed">{weeklySummary?.summary}</p>
        )}
      </Card>

      <Card>
        <CardTitle>Try It Live</CardTitle>
        <ReviewForm variant="admin" />
      </Card>

      <ReviewsTable reviews={reviews} />

      <ChatPanel />
    </main>
  );
}

"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { Aggregates } from "@/lib/api";
import { Card, CardTitle } from "@/components/ui/card";

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#16a34a",
  neutral: "#a1a1aa",
  negative: "#dc2626",
};

const URGENCY_COLORS: Record<string, string> = {
  low: "#60a5fa",
  medium: "#f59e0b",
  high: "#dc2626",
};

const CATEGORY_COLOR = "#4f46e5";

export function SentimentDonut({ data }: { data: Aggregates["sentiment_counts"] }) {
  return (
    <Card>
      <CardTitle>Sentiment Split</CardTitle>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="sentiment"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
          >
            {data.map((entry) => (
              <Cell key={entry.sentiment} fill={SENTIMENT_COLORS[entry.sentiment] ?? "#94a3b8"} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function CategoryBar({ data }: { data: Aggregates["category_counts"] }) {
  return (
    <Card>
      <CardTitle>Category Breakdown (review count)</CardTitle>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} />
          <YAxis type="category" dataKey="category" width={140} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="count" fill={CATEGORY_COLOR} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function RatingSentimentAgreement({ data }: { data: Aggregates["rating_sentiment_agreement"] }) {
  const byRating = new Map<number, Record<string, number>>();
  for (const row of data) {
    const entry = byRating.get(row.rating) ?? {};
    entry[row.sentiment] = row.count;
    byRating.set(row.rating, entry);
  }
  const chartData = Array.from(byRating.entries())
    .sort(([a], [b]) => a - b)
    .map(([rating, sentiments]) => ({ rating: `${rating}★`, ...sentiments }));

  return (
    <Card>
      <CardTitle>Rating vs Sentiment Agreement</CardTitle>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="rating" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="positive" stackId="s" fill={SENTIMENT_COLORS.positive} />
          <Bar dataKey="neutral" stackId="s" fill={SENTIMENT_COLORS.neutral} />
          <Bar dataKey="negative" stackId="s" fill={SENTIMENT_COLORS.negative} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function WeeklyVolumeTrend({ data }: { data: Aggregates["weekly_volume"] }) {
  return (
    <Card>
      <CardTitle>Weekly Volume Trend</CardTitle>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke={CATEGORY_COLOR} strokeWidth={2} dot />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function UrgencyBreakdown({ data }: { data: Aggregates["urgency_counts"] }) {
  return (
    <Card>
      <CardTitle>Urgency Breakdown</CardTitle>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="urgency" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count">
            {data.map((entry) => (
              <Cell key={entry.urgency} fill={URGENCY_COLORS[entry.urgency] ?? "#94a3b8"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

const CATEGORY_SUMMARIES: Record<string, string> = {
  "General Praise": "Most reviews are simple 5★ satisfaction with no specific complaint, matching the app's real rating skew.",
  "Delivery Experience": "Late, delayed, or incomplete deliveries are the most common operational complaint.",
  "Customer Support": "Unresponsive or scripted support replies frustrate customers seeking help.",
  "App & Ordering": "UI bugs and login/ordering friction affect a meaningful share of users.",
  "Payments & Refunds": "Stuck payments and refund disputes are rarer but high-stakes when they occur.",
  "Pricing & Fees": "Surge pricing and fee complaints are situational rather than structural.",
  "Food Quality": "Specific bad-dish complaints occur less often than service-level issues.",
  "Account & Onboarding": "Genuinely rare in real EatSure feedback — only a handful of cases exist.",
};

export function TopThemes({ data }: { data: Aggregates["category_counts"] }) {
  const top3 = data.slice(0, 3);
  return (
    <Card>
      <CardTitle>Top Recurring Themes</CardTitle>
      <ol className="space-y-3 text-sm">
        {top3.map((theme, i) => (
          <li key={theme.category}>
            <div className="flex items-center justify-between">
              <span className="font-medium">
                <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                {theme.category}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{theme.count}</span>
            </div>
            <p className="mt-0.5 pl-5 text-xs text-muted-foreground">
              {CATEGORY_SUMMARIES[theme.category] ?? "No summary available for this category."}
            </p>
          </li>
        ))}
        {top3.length === 0 && <p className="text-sm text-muted-foreground">No themes yet.</p>}
      </ol>
    </Card>
  );
}

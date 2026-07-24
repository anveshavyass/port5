"use client";

import {
  Area,
  AreaChart,
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

// Fixed categorical order + validated palette (dataviz skill, palette.md).
// Slots are assigned in this order and never cycled/reused for other charts.
const CATEGORY_ORDER = [
  "General Praise",
  "Delivery Experience",
  "Customer Support",
  "App & Ordering",
  "Payments & Refunds",
  "Pricing & Fees",
  "Food Quality",
  "Account & Onboarding",
];

const CATEGORY_TREND_COLORS: Record<string, string> = {
  "General Praise": "#2a78d6",
  "Delivery Experience": "#eb6834",
  "Customer Support": "#1baf7a",
  "App & Ordering": "#eda100",
  "Payments & Refunds": "#e87ba4",
  "Pricing & Fees": "#008300",
  "Food Quality": "#4a3aa7",
  "Account & Onboarding": "#e34948",
};

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

export function CategoryTrend({ data }: { data: Aggregates["category_counts_by_week"] }) {
  const byWeek = new Map<string, Record<string, number>>();
  const seenCategories = new Set<string>();
  for (const row of data) {
    const entry = byWeek.get(row.week) ?? {};
    entry[row.category] = row.count;
    byWeek.set(row.week, entry);
    seenCategories.add(row.category);
  }
  const categories = CATEGORY_ORDER.filter((c) => seenCategories.has(c));
  const chartData = Array.from(byWeek.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([week, counts]) => {
      const filled: Record<string, number> = {};
      for (const category of categories) filled[category] = counts[category] ?? 0;
      return { week, ...filled };
    });

  return (
    <Card>
      <CardTitle>Category Trend (weekly)</CardTitle>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {categories.map((category) => (
            <Area
              key={category}
              type="monotone"
              dataKey={category}
              stackId="cat"
              stroke={CATEGORY_TREND_COLORS[category] ?? "#94a3b8"}
              fill={CATEGORY_TREND_COLORS[category] ?? "#94a3b8"}
              fillOpacity={0.75}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function SentimentTrend({ data }: { data: Aggregates["sentiment_counts_by_week"] }) {
  const byWeek = new Map<string, Record<string, number>>();
  for (const row of data) {
    const entry = byWeek.get(row.week) ?? {};
    entry[row.sentiment] = row.count;
    byWeek.set(row.week, entry);
  }
  const chartData = Array.from(byWeek.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([week, counts]) => ({
      week,
      positive: counts.positive ?? 0,
      neutral: counts.neutral ?? 0,
      negative: counts.negative ?? 0,
    }));

  return (
    <Card>
      <CardTitle>Sentiment Trend (weekly)</CardTitle>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area type="monotone" dataKey="positive" stackId="sent" stroke={SENTIMENT_COLORS.positive} fill={SENTIMENT_COLORS.positive} fillOpacity={0.75} />
          <Area type="monotone" dataKey="neutral" stackId="sent" stroke={SENTIMENT_COLORS.neutral} fill={SENTIMENT_COLORS.neutral} fillOpacity={0.75} />
          <Area type="monotone" dataKey="negative" stackId="sent" stroke={SENTIMENT_COLORS.negative} fill={SENTIMENT_COLORS.negative} fillOpacity={0.75} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function RatingDistribution({ data }: { data: Aggregates["rating_counts"] }) {
  const chartData = data.map((row) => ({ rating: `${row.rating}★`, count: row.count }));
  return (
    <Card>
      <CardTitle>Rating Distribution</CardTitle>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="rating" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill={CATEGORY_COLOR} radius={[4, 4, 0, 0]} />
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

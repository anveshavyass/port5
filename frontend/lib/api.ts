const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error("Could not reach the PulseAI backend. Is it running?");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? `Request failed (${response.status})`);
  }

  return response.json();
}

export type UserAckResponse = {
  category: string;
  acknowledgement_message: string;
};

export function classifySingle(review_text: string) {
  return request<UserAckResponse>("/classify/single", {
    method: "POST",
    body: JSON.stringify({ review_text }),
  });
}

export type CategoryCount = { category: string; count: number };
export type SentimentCount = { sentiment: string; count: number };
export type UrgencyCount = { urgency: string; count: number };
export type WeeklyVolume = { week: string; count: number };
export type RatingSentimentRow = { rating: number; sentiment: string; count: number };
export type ThemeCount = { key_phrase: string; count: number };

export type Aggregates = {
  week: string | null;
  total_reviews: number;
  relevant_reviews: number;
  avg_rating: number | null;
  pct_negative: number;
  top_category: string | null;
  category_counts: CategoryCount[];
  sentiment_counts: SentimentCount[];
  urgency_counts: UrgencyCount[];
  weekly_volume: WeeklyVolume[];
  rating_sentiment_agreement: RatingSentimentRow[];
  top_themes: ThemeCount[];
};

export function getAggregates() {
  return request<Aggregates>("/aggregate");
}

export type SummaryResponse = {
  summary: string;
  aggregates: Aggregates;
};

export function getSummary(week?: string) {
  return request<SummaryResponse>(week ? `/summary?week=${week}` : "/summary");
}

export type Review = {
  id: number;
  review_date: string | null;
  rating: number | null;
  review_text: string;
  sentiment: string;
  urgency: string;
  category: string;
  is_relevant: boolean;
  irrelevance_reason: string | null;
  key_phrase: string | null;
  source: string;
  created_at: string;
};

export function getReviews() {
  return request<Review[]>("/reviews");
}

export type ChatResponse = {
  answer: string;
  query_type: string;
  matched_reviews: Partial<Review>[];
};

export function askChat(question: string) {
  return request<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}

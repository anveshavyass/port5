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

export type UploadResult = { inserted: number; failed: number; total: number };

export async function uploadReviews(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/classify/upload`, {
      method: "POST",
      body: formData,
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

export type CategoryCount = { category: string; count: number };
export type SentimentCount = { sentiment: string; count: number };
export type UrgencyCount = { urgency: string; count: number };
export type WeeklyVolume = { week: string; count: number };
export type RatingSentimentRow = { rating: number; sentiment: string; count: number };
export type ThemeCount = { key_phrase: string; count: number };
export type CategoryByWeek = { week: string; category: string; count: number };
export type SentimentByWeek = { week: string; sentiment: string; count: number };
export type RatingCount = { rating: number; count: number };

export type Aggregates = {
  week: string | null;
  total_reviews: number;
  avg_rating: number | null;
  pct_negative: number;
  top_category: string | null;
  category_counts: CategoryCount[];
  sentiment_counts: SentimentCount[];
  urgency_counts: UrgencyCount[];
  weekly_volume: WeeklyVolume[];
  rating_sentiment_agreement: RatingSentimentRow[];
  top_themes: ThemeCount[];
  category_counts_by_week: CategoryByWeek[];
  sentiment_counts_by_week: SentimentByWeek[];
  rating_counts: RatingCount[];
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
  matched_count: number;
  matched_reviews: Partial<Review>[];
};

export function askChat(question: string) {
  return request<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}

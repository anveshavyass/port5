from db import queries


def build_aggregates(week: str | None = None) -> dict:
    """Numbers only -- no LLM calls here. The summary service narrates these,
    it never recomputes them, so the numbers a stakeholder reads always match
    what's actually in the database.

    `week` (a week-start date, e.g. "2025-01-06") scopes every count below to
    that ISO week. `weekly_volume` is always computed over the whole dataset
    regardless -- it's the trend chart and the source of the week picker's
    options, so it must never shrink to a single week itself."""
    reviews = queries.get_all_reviews(week=week)
    relevant = [r for r in reviews if r["is_relevant"]]

    total = len(reviews)
    ratings = [r["rating"] for r in relevant if r["rating"] is not None]
    negative = [r for r in relevant if r["sentiment"] == "negative"]

    category_counts = queries.get_category_counts(week=week)
    top_category = category_counts[0]["category"] if category_counts else None

    return {
        "week": week,
        "total_reviews": total,
        "relevant_reviews": len(relevant),
        "avg_rating": round(sum(ratings) / len(ratings)) if ratings else None,
        "pct_negative": round(100 * len(negative) / len(relevant), 1) if relevant else 0.0,
        "top_category": top_category,
        "category_counts": category_counts,
        "sentiment_counts": queries.get_sentiment_counts(week=week),
        "urgency_counts": queries.get_urgency_counts(week=week),
        "weekly_volume": queries.get_weekly_volume(),
        "rating_sentiment_agreement": queries.get_rating_sentiment_agreement(week=week),
        "top_themes": queries.get_top_key_phrases(limit=10, week=week),
    }

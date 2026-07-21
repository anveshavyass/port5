from db.connection import get_cursor

INSERT_REVIEW = """
    INSERT INTO reviews (
        review_date, rating, review_text, sentiment, urgency, category,
        key_phrase, source, embedding
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    RETURNING id
"""


def insert_review(row: dict) -> int:
    with get_cursor() as cur:
        cur.execute(
            INSERT_REVIEW,
            (
                row.get("review_date"),
                row.get("rating"),
                row["review_text"],
                row["sentiment"],
                row["urgency"],
                row["category"],
                row.get("key_phrase"),
                row.get("source", "seeded"),
                row.get("embedding"),
            ),
        )
        return cur.fetchone()["id"]


def get_all_reviews(limit: int = 1000, week: str | None = None) -> list[dict]:
    clause = "AND date_trunc('week', review_date)::date = %s" if week else ""
    params: list = ([week] if week else []) + [limit]
    with get_cursor() as cur:
        cur.execute(
            f"""
            SELECT id, review_date, rating, review_text, sentiment, urgency,
                   category, key_phrase, source, created_at
            FROM reviews
            WHERE TRUE {clause}
            ORDER BY review_date NULLS LAST, id
            LIMIT %s
            """,
            params,
        )
        return cur.fetchall()


def get_category_counts(week: str | None = None) -> list[dict]:
    clause = "AND date_trunc('week', review_date)::date = %s" if week else ""
    params = [week] if week else []
    with get_cursor() as cur:
        cur.execute(
            f"""
            SELECT category, COUNT(*) AS count
            FROM reviews
            WHERE TRUE {clause}
            GROUP BY category
            ORDER BY count DESC
            """,
            params,
        )
        return cur.fetchall()


def get_sentiment_counts(week: str | None = None) -> list[dict]:
    clause = "AND date_trunc('week', review_date)::date = %s" if week else ""
    params = [week] if week else []
    with get_cursor() as cur:
        cur.execute(
            f"""
            SELECT sentiment, COUNT(*) AS count
            FROM reviews
            WHERE TRUE {clause}
            GROUP BY sentiment
            ORDER BY count DESC
            """,
            params,
        )
        return cur.fetchall()


def get_urgency_counts(week: str | None = None) -> list[dict]:
    clause = "AND date_trunc('week', review_date)::date = %s" if week else ""
    params = [week] if week else []
    with get_cursor() as cur:
        cur.execute(
            f"""
            SELECT urgency, COUNT(*) AS count
            FROM reviews
            WHERE TRUE {clause}
            GROUP BY urgency
            ORDER BY count DESC
            """,
            params,
        )
        return cur.fetchall()


def get_weekly_volume() -> list[dict]:
    with get_cursor() as cur:
        cur.execute(
            """
            SELECT date_trunc('week', review_date)::date AS week,
                   COUNT(*) AS count
            FROM reviews
            WHERE review_date IS NOT NULL
            GROUP BY week
            ORDER BY week
            """
        )
        return cur.fetchall()


def get_rating_sentiment_agreement(week: str | None = None) -> list[dict]:
    """Cross-tab of star rating vs LLM-detected sentiment, for the
    'do ratings match the tone of the text' chart."""
    clause = "AND date_trunc('week', review_date)::date = %s" if week else ""
    params = [week] if week else []
    with get_cursor() as cur:
        cur.execute(
            f"""
            SELECT rating, sentiment, COUNT(*) AS count
            FROM reviews
            WHERE rating IS NOT NULL {clause}
            GROUP BY rating, sentiment
            ORDER BY rating, sentiment
            """,
            params,
        )
        return cur.fetchall()


def get_top_key_phrases(limit: int = 10, week: str | None = None) -> list[dict]:
    clause = "AND date_trunc('week', review_date)::date = %s" if week else ""
    params = ([week] if week else []) + [limit]
    with get_cursor() as cur:
        cur.execute(
            f"""
            SELECT key_phrase, COUNT(*) AS count
            FROM reviews
            WHERE key_phrase IS NOT NULL AND key_phrase != '' {clause}
            GROUP BY key_phrase
            ORDER BY count DESC, key_phrase
            LIMIT %s
            """,
            params,
        )
        return cur.fetchall()


def vector_search(embedding: list[float], limit: int = 8) -> list[dict]:
    with get_cursor() as cur:
        cur.execute(
            """
            SELECT id, review_date, rating, review_text, sentiment, urgency,
                   category, key_phrase,
                   embedding <=> %s::vector AS distance
            FROM reviews
            ORDER BY embedding <=> %s::vector
            LIMIT %s
            """,
            (embedding, embedding, limit),
        )
        return cur.fetchall()


def filter_reviews(category: str | None = None, sentiment: str | None = None,
                    urgency: str | None = None, limit: int = 50) -> list[dict]:
    clauses = ["TRUE"]
    params: list = []
    if category:
        clauses.append("category = %s")
        params.append(category)
    if sentiment:
        clauses.append("sentiment = %s")
        params.append(sentiment)
    if urgency:
        clauses.append("urgency = %s")
        params.append(urgency)
    where = " AND ".join(clauses)
    params.append(limit)
    with get_cursor() as cur:
        cur.execute(
            f"""
            SELECT id, review_date, rating, review_text, sentiment, urgency,
                   category, key_phrase
            FROM reviews
            WHERE {where}
            ORDER BY review_date DESC NULLS LAST
            LIMIT %s
            """,
            params,
        )
        return cur.fetchall()

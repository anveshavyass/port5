CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    review_date DATE,
    rating SMALLINT,
    review_text TEXT NOT NULL,
    sentiment TEXT NOT NULL,
    urgency TEXT NOT NULL,
    category TEXT NOT NULL,
    key_phrase TEXT,
    source TEXT NOT NULL DEFAULT 'seeded',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_category ON reviews (category);
CREATE INDEX IF NOT EXISTS idx_reviews_sentiment ON reviews (sentiment);
CREATE INDEX IF NOT EXISTS idx_reviews_date ON reviews (review_date);

-- Embeddings live in Milvus (collection "reviews", id matches reviews.id),
-- not in Postgres -- see backend/db/milvus_client.py.

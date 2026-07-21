CREATE EXTENSION IF NOT EXISTS vector;

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
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_category ON reviews (category);
CREATE INDEX IF NOT EXISTS idx_reviews_sentiment ON reviews (sentiment);
CREATE INDEX IF NOT EXISTS idx_reviews_date ON reviews (review_date);

-- IVFFlat index for cosine similarity search over embeddings.
-- Requires ANALYZE after the initial bulk load for the planner to use it well.
CREATE INDEX IF NOT EXISTS idx_reviews_embedding ON reviews
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

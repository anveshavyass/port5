"""One-off migration: copy embeddings already sitting in Postgres's
`reviews.embedding` column into Milvus, so the existing seeded rows don't
need to be re-embedded via OpenAI. Run once, then drop the Postgres column:

    python scripts/migrate_embeddings_to_milvus.py
    docker exec -i pulseai-postgres psql -U pulseai -d pulseai \\
        -c "ALTER TABLE reviews DROP COLUMN embedding;"
"""
from config import MILVUS_COLLECTION
from db import milvus_client
from db.connection import get_cursor


def _parse_pgvector(raw: str) -> list[float]:
    """psycopg2 has no pgvector type adapter -- it comes back as the
    literal text form, e.g. "[0.01,0.02,...]"."""
    return [float(x) for x in raw.strip("[]").split(",")]


def run() -> None:
    with get_cursor() as cur:
        cur.execute("SELECT id, embedding FROM reviews WHERE embedding IS NOT NULL")
        rows = cur.fetchall()

    print(f"Found {len(rows)} rows with an embedding to migrate.")
    milvus_client.ensure_collection()
    for row in rows:
        milvus_client.upsert_embedding(row["id"], _parse_pgvector(row["embedding"]))

    print(f"Migrated {len(rows)} embeddings into Milvus collection '{MILVUS_COLLECTION}'.")


if __name__ == "__main__":
    run()

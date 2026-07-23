from pymilvus import MilvusClient

from config import MILVUS_COLLECTION, MILVUS_URI

EMBEDDING_DIM = 1536

_client: MilvusClient | None = None


def _get_client() -> MilvusClient:
    global _client
    if _client is None:
        _client = MilvusClient(uri=MILVUS_URI)
    return _client


def ensure_collection() -> None:
    """Create the `reviews` collection if it doesn't exist yet: id (matches
    the Postgres row id) + embedding only -- all other review fields stay in
    Postgres, which remains the source of truth."""
    client = _get_client()
    if client.has_collection(MILVUS_COLLECTION):
        return
    client.create_collection(
        collection_name=MILVUS_COLLECTION,
        dimension=EMBEDDING_DIM,
        primary_field_name="id",
        id_type="int",
        vector_field_name="embedding",
        metric_type="COSINE",
        auto_id=False,
    )


def upsert_embedding(review_id: int, embedding: list[float]) -> None:
    ensure_collection()
    client = _get_client()
    client.upsert(
        collection_name=MILVUS_COLLECTION,
        data=[{"id": review_id, "embedding": embedding}],
    )


def search(embedding: list[float], limit: int = 8) -> list[dict]:
    """Nearest-neighbor search. Returns [{"id": ..., "distance": ...}, ...]
    ranked by similarity (COSINE distance, closer to 1.0 = more similar)."""
    ensure_collection()
    client = _get_client()
    results = client.search(
        collection_name=MILVUS_COLLECTION,
        data=[embedding],
        limit=limit,
        output_fields=[],
    )
    return [{"id": hit["id"], "distance": hit["distance"]} for hit in results[0]]

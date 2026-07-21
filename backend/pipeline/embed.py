from openai import OpenAI

from config import EMBEDDING_MODEL, OPENAI_API_KEY

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=OPENAI_API_KEY)
    return _client


def embed_text(text: str) -> list[float]:
    client = _get_client()
    response = client.embeddings.create(model=EMBEDDING_MODEL, input=text)
    return response.data[0].embedding

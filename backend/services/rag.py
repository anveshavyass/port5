from enum import Enum

from openai import OpenAI
from pydantic import BaseModel

from config import CLASSIFY_MODEL, OPENAI_API_KEY, SUMMARY_MODEL
from db import queries
from pipeline.embed import embed_text

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=OPENAI_API_KEY)
    return _client


class QueryType(str, Enum):
    aggregation = "aggregation"  # "how many negative reviews about delivery"
    semantic = "semantic"        # "reviews where customer is angry about refunds"


class QueryFilters(BaseModel):
    category: str | None = None
    sentiment: str | None = None
    urgency: str | None = None


class RoutedQuery(BaseModel):
    query_type: QueryType
    filters: QueryFilters


ROUTER_SYSTEM_PROMPT = """Classify the user's question about a customer
feedback database into a query type and extract any structured filters.

- query_type "aggregation": the question asks for a count, breakdown, or
  exact filter match (category/sentiment/urgency are explicit or clearly
  implied). Example: "how many negative delivery reviews".
- query_type "semantic": the question describes a theme, feeling, or topic
  in open language that requires matching meaning, not an exact filter.
  Example: "reviews where customers seem confused about pricing".

Extract filters ONLY when explicitly stated or unambiguous:
category is one of: Delivery Experience, Food Quality, App & Ordering,
Payments & Refunds, Pricing & Fees, Customer Support, Account & Onboarding,
General Praise. sentiment is one of: positive, neutral, negative.
urgency is one of: low, medium, high.
"""


def _route_query(question: str) -> RoutedQuery:
    client = _get_client()
    completion = client.beta.chat.completions.parse(
        model=CLASSIFY_MODEL,
        messages=[
            {"role": "system", "content": ROUTER_SYSTEM_PROMPT},
            {"role": "user", "content": question},
        ],
        response_format=RoutedQuery,
    )
    return completion.choices[0].message.parsed


ANSWER_SYSTEM_PROMPT = """You answer a CX team member's question about
customer feedback using ONLY the reviews provided below. Never invent a
review or a detail not present in the given rows. If no rows are given,
say so plainly instead of guessing. Keep the answer to a few sentences,
citing specific reviews where useful."""


def answer_query(question: str) -> dict:
    """Router: SQL-filter question vs semantic-search question -> retrieve
    matching rows via SQL filter or pgvector similarity -> LLM composes the
    final answer strictly from the retrieved rows (never from its own
    training knowledge of EatSure)."""
    routed = _route_query(question)

    if routed.query_type == QueryType.aggregation:
        rows = queries.filter_reviews(
            category=routed.filters.category,
            sentiment=routed.filters.sentiment,
            urgency=routed.filters.urgency,
            limit=50,
        )
    else:
        embedding = embed_text(question)
        rows = queries.vector_search(embedding, limit=8)

    if not rows:
        return {
            "answer": "No reviews match that query.",
            "query_type": routed.query_type.value,
            "matched_reviews": [],
        }

    context = "\n".join(
        f"- [{r['category']}, {r['sentiment']}] {r['review_text']}" for r in rows
    )

    client = _get_client()
    completion = client.chat.completions.create(
        model=SUMMARY_MODEL,
        messages=[
            {"role": "system", "content": ANSWER_SYSTEM_PROMPT},
            {"role": "user", "content": f"Question: {question}\n\nMatching reviews:\n{context}"},
        ],
    )

    return {
        "answer": completion.choices[0].message.content,
        "query_type": routed.query_type.value,
        "matched_reviews": rows,
    }

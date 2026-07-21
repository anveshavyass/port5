from openai import OpenAI

from config import OPENAI_API_KEY, SUMMARY_MODEL
from services.aggregate import build_aggregates

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=OPENAI_API_KEY)
    return _client


SUMMARY_SYSTEM_PROMPT = """You write a customer feedback summary for a VP of
CX at a food delivery app (EatSure). You are given pre-computed aggregate
numbers -- counts, percentages, top themes -- and the exact time period they
cover. Do not invent numbers that aren't given to you, and do not claim a
narrower or wider period than the one you were told.

Write 3-5 short paragraphs:
1. Overall volume and sentiment split for the stated period.
2. The top 2-3 recurring themes, named specifically (e.g. "delivery delays"
   or "refund processing time"), not vague ("customer issues").
3. Anything urgent that needs action.
4. One concrete, actionable recommendation a VP could greenlight today.

Be direct and specific. No filler, no generic advice like "improve
communication." Reference the actual numbers you were given.
"""


def generate_weekly_summary(week: str | None = None) -> dict:
    """Numbers are computed entirely in aggregate.py (pandas/SQL) --
    the LLM only narrates the numbers it's handed, so the summary can
    never disagree with what's actually in the database.

    `week` scopes the summary to a single week (its start date, e.g.
    "2025-01-06"); omit it for an overall summary across the whole dataset."""
    aggregates = build_aggregates(week=week)
    period_label = f"the week starting {week}" if week else "the entire dataset (all time)"

    if aggregates["relevant_reviews"] == 0:
        return {
            "summary": f"No relevant reviews found for {period_label}.",
            "aggregates": aggregates,
        }

    client = _get_client()
    completion = client.chat.completions.create(
        model=SUMMARY_MODEL,
        messages=[
            {"role": "system", "content": SUMMARY_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Time period: {period_label}\nAggregate data for this period:\n{aggregates}",
            },
        ],
    )

    return {
        "summary": completion.choices[0].message.content,
        "aggregates": aggregates,
    }

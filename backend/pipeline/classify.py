from enum import Enum

from openai import OpenAI
from pydantic import BaseModel

from config import CLASSIFY_MODEL, OPENAI_API_KEY
from pipeline.few_shot_examples import FEW_SHOT_EXAMPLES

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=OPENAI_API_KEY)
    return _client


class Sentiment(str, Enum):
    positive = "positive"
    neutral = "neutral"
    negative = "negative"


class Urgency(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class Category(str, Enum):
    delivery_experience = "Delivery Experience"
    food_quality = "Food Quality"
    app_and_ordering = "App & Ordering"
    payments_and_refunds = "Payments & Refunds"
    pricing_and_fees = "Pricing & Fees"
    customer_support = "Customer Support"
    account_and_onboarding = "Account & Onboarding"
    general_praise = "General Praise"


class Classification(BaseModel):
    sentiment: Sentiment
    urgency: Urgency
    category: Category
    key_phrase: str


SYSTEM_PROMPT = """You are a customer feedback classifier for EatSure, a food
delivery app. Classify each review into structured fields. Follow these rules:

- Judge sentiment and category from the review TEXT ONLY. Never assume a star
  rating -- you are not given one, and should not need one.
- Abusive or angry TONE does not change the underlying category. An angry
  customer describing a real problem should still be classified by that
  problem, not by their tone.
- If a review mentions multiple issues, pick the category for the DOMINANT
  harm: money stuck (Payments & Refunds) outweighs a late delivery; a food
  safety issue (Food Quality) outweighs a UI complaint.
- General Praise is reserved for reviews with POSITIVE or NEUTRAL sentiment
  and no actionable complaint. A review with negative sentiment must NEVER be
  classified as General Praise, even if it is too short or vague to name a
  specific domain (e.g. "Worst", "Very bad service, don't use this app"). A
  vague negative review with no specific domain signal defaults to Customer
  Support, since it is read as a general complaint about the service.
- Every review gets a real category, sentiment, and urgency -- even spam,
  gibberish, or a single unrelated word. Make a best-effort call rather than
  refusing to classify.
- key_phrase is a short (3-6 word) extractive summary of the core complaint or
  praise, in the reviewer's own words where possible. It must never be empty
  -- if the review has no distinct phrase to extract (emoji-only, a single
  generic word), use the review text itself as key_phrase instead.
- urgency reflects how quickly a human should act: high = money/safety/app-
  breaking, medium = a real but non-urgent complaint, low = cosmetic or praise.
"""


def _build_few_shot_messages() -> list[dict]:
    messages = []
    for ex in FEW_SHOT_EXAMPLES:
        messages.append({"role": "user", "content": ex["review"]})
        messages.append({"role": "assistant", "content": Classification(**ex["output"]).model_dump_json()})
    return messages


_FEW_SHOT_MESSAGES = _build_few_shot_messages()


def classify_review(review_text: str) -> Classification:
    """Classify a single review. Deterministic wrapper around one OpenAI
    structured-output call -- no free-text parsing, no regex."""
    client = _get_client()
    completion = client.beta.chat.completions.parse(
        model=CLASSIFY_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            *_FEW_SHOT_MESSAGES,
            {"role": "user", "content": review_text},
        ],
        response_format=Classification,
    )
    result = completion.choices[0].message.parsed
    if not result.key_phrase.strip():
        result.key_phrase = review_text.strip()
    return result

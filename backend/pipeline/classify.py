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


class IrrelevanceReason(str, Enum):
    spam = "spam"
    gibberish = "gibberish"
    one_word = "one_word"
    promo_content = "promo_content"


class Classification(BaseModel):
    sentiment: Sentiment
    urgency: Urgency
    category: Category
    is_relevant: bool
    irrelevance_reason: IrrelevanceReason | None
    key_phrase: str | None


SYSTEM_PROMPT = """You are a customer feedback classifier for EatSure, a food
delivery app. Classify each review into structured fields. Follow these rules:

- Judge sentiment and category from the review TEXT ONLY. Never assume a star
  rating -- you are not given one, and should not need one.
- Abusive or angry TONE does not make a review irrelevant. An angry customer
  describing a real problem is still relevant; classify the problem itself.
- If a review mentions multiple issues, pick the category for the DOMINANT
  harm: money stuck (Payments & Refunds) outweighs a late delivery; a food
  safety issue (Food Quality) outweighs a UI complaint.
- Mark is_relevant=False ONLY for spam, gibberish, a single unrelated word, or
  promotional content -- never just because the review is short and negative.
- key_phrase is a short (3-6 word) extractive summary of the core complaint or
  praise, in the reviewer's own words where possible. Leave it null when
  is_relevant is False.
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
    return completion.choices[0].message.parsed

"""M5B1 / M5S2: run the same input twice and compare the structured output.

Requires a live OPENAI_API_KEY -- skipped otherwise so the suite still runs
cleanly in an environment without credentials configured.
"""
import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

pytestmark = pytest.mark.skipif(
    not os.environ.get("OPENAI_API_KEY"), reason="OPENAI_API_KEY not set"
)

SAMPLE_REVIEWS = [
    "Delivery takes more than an hour every time and the app never updates the status.",
    "Good food, excellent work team, always on time!",
    "My refund has been stuck for 12 days, nobody responds on chat support.",
]


@pytest.mark.parametrize("review_text", SAMPLE_REVIEWS)
def test_classification_is_consistent_on_rerun(review_text):
    from pipeline.classify import classify_review

    first = classify_review(review_text)
    second = classify_review(review_text)

    assert first.category == second.category
    assert first.sentiment == second.sentiment
    assert first.urgency == second.urgency

"""M5B2 / M5B3: blank input, very long input, non-English input, and a bad
API key should all be handled gracefully -- meaningful output or a clean
error, never a crash.
"""
import os
import sys

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from main import app  # noqa: E402

client = TestClient(app)

LIVE_KEY = pytest.mark.skipif(
    not os.environ.get("OPENAI_API_KEY"), reason="OPENAI_API_KEY not set"
)


def test_blank_review_returns_422_not_a_crash():
    response = client.post("/classify/single", json={"review_text": "   "})
    assert response.status_code == 422
    assert "empty" in response.json()["detail"].lower()


def test_blank_chat_question_returns_422_not_a_crash():
    response = client.post("/chat", json={"question": ""})
    assert response.status_code == 422


@LIVE_KEY
def test_very_long_review_is_classified_not_rejected():
    from pipeline.classify import classify_review

    long_review = (
        "The delivery was late again. " * 200
    )  # ~1200 words, well past a typical review length
    result = classify_review(long_review)
    assert result.category is not None
    assert result.sentiment is not None


@LIVE_KEY
def test_non_english_review_still_classifies():
    from pipeline.classify import classify_review

    hinglish_review = "Bhai delivery bahut late hoti hai, ek ghanta lag gaya aaj bhi."
    result = classify_review(hinglish_review)
    assert result.category is not None


def test_classification_with_invalid_api_key_returns_502_not_crash(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "sk-invalid-key-for-testing")
    import config
    import pipeline.classify as classify_module

    monkeypatch.setattr(config, "OPENAI_API_KEY", "sk-invalid-key-for-testing")
    classify_module._client = None  # force the client to rebuild with the bad key

    response = client.post("/classify/single", json={"review_text": "Great app!"})
    assert response.status_code == 502
    assert "detail" in response.json()

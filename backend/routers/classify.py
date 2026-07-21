from datetime import date

import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from db.queries import insert_review
from pipeline.classify import classify_review
from pipeline.clean import load_and_clean
from pipeline.embed import embed_text
from pipeline.run_pipeline import build_embedding_source

router = APIRouter()


class SingleReviewRequest(BaseModel):
    review_text: str


class UserAckResponse(BaseModel):
    category: str
    acknowledgement_message: str


class BatchClassifyRequest(BaseModel):
    csv_path: str


@router.post("/classify")
def classify_batch(payload: BatchClassifyRequest):
    """Runs the same batch pipeline as `python pipeline/run_pipeline.py`,
    over an arbitrary CSV path on the server, for re-running ingestion
    from the admin UI instead of a terminal. Long-running -- intended for
    small re-ingest batches, not the initial 120-row seed load."""
    try:
        df = load_and_clean(payload.csv_path)
    except (FileNotFoundError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    inserted, failed = 0, 0
    for _, row in df.iterrows():
        try:
            classification = classify_review(row["Review"])
            embedding = embed_text(build_embedding_source(row["Review"], classification.key_phrase))
            insert_review({
                "review_date": row["Date"],
                "rating": None if pd.isna(row["Rating"]) else int(row["Rating"]),
                "review_text": row["Review"],
                "sentiment": classification.sentiment.value,
                "urgency": classification.urgency.value,
                "category": classification.category.value,
                "is_relevant": classification.is_relevant,
                "irrelevance_reason": classification.irrelevance_reason.value if classification.irrelevance_reason else None,
                "key_phrase": classification.key_phrase,
                "source": "seeded",
                "embedding": embedding,
            })
            inserted += 1
        except Exception:
            failed += 1

    return {"inserted": inserted, "failed": failed, "total": len(df)}


@router.post("/classify/single", response_model=UserAckResponse)
def classify_single(payload: SingleReviewRequest):
    """Live input from the User view. Runs through the same classification
    function as the batch pipeline, stores the full result (tagged
    source='live_input'), but returns only what the end user needs: their
    category and a plain-English acknowledgement. Sentiment, urgency, and
    key_phrase are stored and only ever surfaced in the Admin view."""
    text = payload.review_text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="Review text cannot be empty.")

    try:
        classification = classify_review(text)
        embedding = embed_text(build_embedding_source(text, classification.key_phrase))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Classification service unavailable: {exc}")

    insert_review({
        "review_date": date.today(),
        "rating": None,
        "review_text": text,
        "sentiment": classification.sentiment.value,
        "urgency": classification.urgency.value,
        "category": classification.category.value,
        "is_relevant": classification.is_relevant,
        "irrelevance_reason": classification.irrelevance_reason.value if classification.irrelevance_reason else None,
        "key_phrase": classification.key_phrase,
        "source": "live_input",
        "embedding": embedding,
    })

    return UserAckResponse(
        category=classification.category.value,
        acknowledgement_message=(
            f"Thanks — we've logged this under \"{classification.category.value}\". "
            "Our team will look into it."
        ),
    )

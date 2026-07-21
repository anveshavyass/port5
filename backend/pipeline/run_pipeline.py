"""Batch orchestrator: CSV -> clean -> classify -> embed -> Postgres.

Usage:
    python pipeline/run_pipeline.py --input ../data/eatsure_reviews_sample.csv
"""
import argparse
import sys
import time

import pandas as pd

from db.queries import insert_review
from pipeline.classify import classify_review
from pipeline.clean import load_and_clean
from pipeline.embed import embed_text


def build_embedding_source(review_text: str, key_phrase: str | None) -> str:
    """Embed the key_phrase alongside the raw text so semantic search matches
    on the distilled complaint, not just surface wording."""
    if key_phrase:
        return f"{review_text}\n\nKey issue: {key_phrase}"
    return review_text


def run(input_path: str) -> None:
    df = load_and_clean(input_path)
    print(f"Loaded {len(df)} cleaned rows from {input_path}")

    succeeded = 0
    failed = 0

    for i, row in df.iterrows():
        review_text = row["Review"]
        try:
            classification = classify_review(review_text)
            embedding = embed_text(build_embedding_source(review_text, classification.key_phrase))

            insert_review({
                "review_date": row["Date"],
                "rating": None if pd.isna(row["Rating"]) else int(row["Rating"]),
                "review_text": review_text,
                "sentiment": classification.sentiment.value,
                "urgency": classification.urgency.value,
                "category": classification.category.value,
                "key_phrase": classification.key_phrase,
                "source": "seeded",
                "embedding": embedding,
            })
            succeeded += 1
        except Exception as exc:
            failed += 1
            print(f"[row {i}] FAILED: {exc}", file=sys.stderr)

        if (i + 1) % 20 == 0:
            print(f"...{i + 1}/{len(df)} processed")
            time.sleep(0.2)  

    print(f"Done. {succeeded} inserted, {failed} failed out of {len(df)}.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Path to the reviews CSV")
    args = parser.parse_args()
    run(args.input)

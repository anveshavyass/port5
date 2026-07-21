import pandas as pd

REQUIRED_COLUMNS = ["Date", "Rating", "Review"]


def load_and_clean(csv_path: str) -> pd.DataFrame:
    """Cleaning funnel: strip whitespace/HTML noise, drop empty or duplicate
    reviews, coerce types. Deliberately does NOT drop short/weird reviews
    (one-word, emoji-only, non-English) -- those are the relevance gate's
    job at classification time, not the cleaning step's."""
    df = pd.read_csv(csv_path)
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset missing required columns: {missing}")

    df["Review"] = df["Review"].astype(str).str.strip()
    df = df[df["Review"].str.len() > 0]
    df = df[~df["Review"].str.lower().isin(["nan", "none"])]

    df = df.drop_duplicates(subset=["Review", "Date"])
    df["Date"] = pd.to_datetime(df["Date"], errors="coerce").dt.date
    df["Rating"] = pd.to_numeric(df["Rating"], errors="coerce")

    return df.reset_index(drop=True)

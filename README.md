# PulseAI — EatSure Feedback Intelligence Dashboard

## Problem statement

Product and CX teams receive hundreds of customer reviews every week. Reading them manually is slow and subjective. PulseAI automatically categorises feedback, detects sentiment, surfaces recurring themes, and generates a weekly insight summary — for **EatSure's CX team**, using real Google Play reviews of the EatSure app.

## What it does

1. Ingests EatSure app reviews (real Google Play data).
2. Classifies each review with an LLM into **sentiment**, **urgency**, and one of **8 CX categories** — using structured JSON output, not free text.
3. Stores every review + its classification in Postgres.
4. Embeds review themes into the same Postgres instance (pgvector) for semantic search.
5. Aggregates counts, recurring themes, and rating-vs-sentiment agreement.
6. Generates a weekly narrative summary (numbers computed by pandas, narrated by the LLM).
7. Serves all of it on a dashboard with two views: a **User view** (submit a review, get a simple acknowledgement) and an **Admin view** (full analytics, charts, weekly summary, RAG chat).

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Classification / summary / RAG answers | **OpenAI GPT-4o / GPT-4o-mini**, Structured Outputs (`response_format: json_schema`) + Pydantic | Only LLM key available; structured outputs guarantee parseable JSON, no regex-parsing of free text |
| Embeddings | **OpenAI `text-embedding-3-small`** | Cheap, fast, same vendor as classification |
| Database | **Postgres + pgvector** | One database for structured columns *and* embeddings — no second vector DB to keep in sync |
| DB access | **`psycopg2`, plain SQL, parameterized queries** (no ORM) | At this scale an ORM adds a layer with nothing to abstract — pgvector similarity search is raw SQL anyway (`ORDER BY embedding <=> %s`), so keeping everything in plain SQL avoids mixing two query styles. Parameterized (`%s` placeholders, never string interpolation) to rule out SQL injection |
| Backend | **FastAPI** (Python) | Same language as the pipeline, async, easy to test |
| Frontend | **Next.js + Tailwind + shadcn/ui + Recharts** | Dashboard is the right interface for an analytics use case (not a generic chat-only or CLI tool); real charts, not a data-app wrapper |
| Secrets | `.env` (git-ignored) | No hardcoded keys anywhere in source |

## Workflow

```
 dataset-2.csv (346k rows, 9 apps)
        │  filter: App_Name == "EatSure QuickiES Food Delivery"
        ▼
 data/eatsure_reviews_sample.csv  (120 rows, real EatSure reviews,
                                    one contiguous 20-week window)
        │
        ▼
 ①  CLEANING (pandas)
     strip noise, dedupe, drop empty rows
        │
        ▼
 ②  CLASSIFICATION (OpenAI, one call per review)
     input: review text ONLY (rating is withheld —
     see "Design decision: rating independence" below)
     output: sentiment, urgency, category, is_relevant,
             irrelevance_reason, key_phrase
        │
        ▼
 ③  POSTGRES  →  reviews table (raw + classification columns)
        │
        ▼
 ④  EMBEDDING (OpenAI) → pgvector column on the same table
        │
   ┌────┴─────────────────────────┐
   ▼                              ▼
 ⑤ AGGREGATION (pandas/SQL)     ⑥ RAG QUERY ENGINE
   counts by category/            router: SQL-aggregation question
   sentiment/week, rating-vs-     vs semantic-search question →
   sentiment agreement            SQL filter OR pgvector similarity
   │                              search → LLM composes answer from
   ▼                              retrieved rows only
 ⑦ WEEKLY SUMMARY                       │
   pandas computes numbers,             │
   LLM narrates only                    │
   │                                    │
   └──────────────┬─────────────────────┘
                  ▼
         NEXT.JS DASHBOARD
   ┌──────────────────┬───────────────────────────────┐
   │   USER VIEW       │        ADMIN VIEW              │
   │  submit a review  │  charts + weekly summary +     │
   │  → simple ack     │  RAG chat + full record table  │
   └──────────────────┴───────────────────────────────┘
                  │
         FastAPI serves all of it
   /classify  /classify/single  /aggregate  /summary  /chat
```

### Design decision: rating independence

The LLM classifies sentiment from **review text only** — the star rating is never in the prompt. If the model saw the rating, it would anchor to it (1–2★→negative, 4–5★→positive), which turns "AI sentiment analysis" into a rule that just copies the star rating. Keeping the two independent lets the dashboard show a genuine **rating-vs-sentiment agreement chart** at classification time. The training/demo *dataset*, however, deliberately **excludes** reviews where the rating and the text obviously disagree (see Dataset section below) — those were removed so the sample reads as realistic, not as a stress-test of edge cases baked into the ground truth.

## Taxonomy

Grounded in real review content sampled from the dataset, not invented categories:

| Category | Signal example from real data |
|---|---|
| Delivery Experience | "delivery takes 1 hour", "disappearing delivery persons" |
| Food Quality | "semi-cooked", "single green pea in the biryani" |
| App & Ordering | "UI is so buggy", "cannot login on two devices" |
| Payments & Refunds | "payment returned", "gift card rejected" |
| Pricing & Fees | "high prices", "shows double the cost vs Zomato" |
| Customer Support | "keep chatting with bots", "customer service too bad" |
| Account & Onboarding | "not available pincode", login/device issues |
| General Praise | "good food", "excellent work", no actionable complaint |

Plus a **relevance gate** (`is_relevant` + `irrelevance_reason`: spam / gibberish / one_word / promo_content) — low-signal reviews ("👍", "Nice") are tagged and quarantined, never silently dropped.

## Dataset

- Source: Google Play reviews for the EatSure app, filtered from a 9-app Kaggle dataset by `App_Name == "EatSure QuickiES Food Delivery"`.
- File: [`data/eatsure_reviews_sample.csv`](data/eatsure_reviews_sample.csv) — **120 rows**, one real contiguous window (last 20 weeks of the source data).
- Columns: `Date, Rating, Review` only.
- **Category counts are proportional to real frequency, not forced equal** — scaled down to a 120-row total but keeping the same relative shape (floored at 5 so rare categories are still represented, capped at 25 so the two most common categories don't crowd out everything else):

  | Category | Rows |
  |---|---|
  | General Praise | 25 |
  | Delivery Experience | 23 |
  | Food Quality | 8 |
  | Pricing & Fees | 8 |
  | App & Ordering | 6 |
  | Customer Support | 7 |
  | Payments & Refunds | 7 |
  | Account & Onboarding | 5 (rare in real EatSure feedback — only ~24 such reviews exist in the entire 20-week window) |
  | Unlabeled edge cases + general fill | 31 |

- **Rating/sentiment mismatches removed**: any review with a 4–5★ rating paired with clearly negative language, or a 1–2★ rating paired with clearly positive language, was filtered out (54 such rows removed from the 20-week pool), using a negation-aware check so genuinely positive lines like "Eatsure will **never** disappoint" aren't miscounted as negative. What's left is a sample where rating and text agree, matching how most real feedback actually reads.
- **Natural rating skew preserved**: 5★=59, 1★=44, 4★=12, 3★=4, 2★=1 — this mirrors the real EatSure distribution in this window (2★/3★ are genuinely rare; the app's feedback is bimodal love-it-or-hate-it), not an artifact of sampling. At this smaller size, 2★ drops to a single row — flag this to your mentor as a known consequence of shrinking a naturally rare-rating dataset, not a bug.
- Edge cases still deliberately present, at modest non-uniform counts (not padded to round numbers): 5 one-word reviews, 6 very-long reviews (>300 chars), 5 Hindi/Hinglish reviews, 3 emoji-only reviews — so edge-case handling is still demonstrably tested, just without forcing artificial parity across types.

## Repo structure

```
Port_5/
├── README.md
├── .env.example
├── .gitignore
├── data/
│   └── eatsure_reviews_sample.csv
├── notebooks/
│   └── PulseAI_EatSure_Pipeline.ipynb      # cleaning/exploration notebook
├── backend/
│   ├── main.py                             # FastAPI app entry
│   ├── requirements.txt
│   ├── config.py                           # loads .env
│   ├── db/
│   │   ├── init_db.sql                     # CREATE EXTENSION vector; schema
│   │   ├── connection.py                   # psycopg2 connection helper
│   │   └── queries.py                      # plain, parameterized SQL: insert, select, aggregate, vector search
│   ├── pipeline/
│   │   ├── clean.py                        # cleaning funnel
│   │   ├── few_shot_examples.py            # deliberate few-shot set
│   │   ├── classify.py                     # OpenAI structured-output call
│   │   ├── embed.py                        # text-embedding-3-small
│   │   └── run_pipeline.py                 # batch orchestrator (CLI entry)
│   ├── services/
│   │   ├── aggregate.py                    # counts, weekly grouping, rating-vs-sentiment
│   │   ├── summary.py                      # weekly narrative generator
│   │   └── rag.py                          # query router + retrieval + answer synthesis
│   └── routers/
│       ├── classify.py    # POST /classify (batch), POST /classify/single (live input)
│       ├── aggregate.py   # GET  /aggregate
│       ├── summary.py     # GET  /summary
│       └── chat.py        # POST /chat
├── frontend/                                # kept flat — 3 pages, 4 components, done
│   ├── package.json
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                        # redirects to /user by default
│   │   ├── user/page.tsx                   # User view — submit a review, get an ack
│   │   └── admin/page.tsx                  # Admin view — composes the 4 components below
│   ├── components/
│   │   ├── ReviewForm.tsx                  # used by /user (simple) and /admin (Try It Live)
│   │   ├── Charts.tsx                      # all 6 charts, one file, one export per chart
│   │   ├── ReviewsTable.tsx                # full record list, all classification fields
│   │   └── ChatPanel.tsx                   # RAG query box
│   └── lib/api.ts                          # fetch wrappers to FastAPI
└── tests/
    ├── test_consistency.py                 # same input twice, compare output
    └── test_edge_cases.py                  # blank / very long / non-English / bad key
```

## Dashboard layout

Two views, two audiences: `/user` for anyone submitting feedback (no explanation needed — M5C2), `/admin` for the CX team doing analysis (full detail — M5C3: dashboard format fits the analytics context).

### User view (`/user`)

```
┌──────────────────────────────────────────────────────────────────┐
│  Share your feedback about EatSure                                │
├──────────────────────────────────────────────────────────────────┤
│  [ paste or type your review here                            ]   │
│                                                                    │
│                                          [ Submit ]                │
├──────────────────────────────────────────────────────────────────┤
│  Thanks — we've logged this under "Delivery Experience".          │
│  Our team will look into it.                                      │
└──────────────────────────────────────────────────────────────────┘
```

Deliberately minimal — the user sees only a plain-English acknowledgement (category label + a thank-you), never raw JSON, urgency scores, or internal fields. That's the "necessary for user" output: confirmation their feedback was understood and logged, nothing an ops team would need instead.

### Admin view (`/admin`)

```
┌──────────────────────────────────────────────────────────────────┐
│  PulseAI — EatSure Feedback Intelligence (Admin)                  │
├──────────────────────────────────────────────────────────────────┤
│  KPI ROW: Total Reviews │ Avg Rating │ % Negative │ Top Category  │
├───────────────────────────────┬──────────────────────────────────┤
│ Sentiment Split (donut)       │  Category Breakdown (bar)        │
├───────────────────────────────┼──────────────────────────────────┤
│ Rating vs Sentiment Agreement │  Weekly Volume Trend (line)      │
│ (grouped bar)                 │                                   │
├───────────────────────────────┼──────────────────────────────────┤
│ Urgency Breakdown (stacked)   │  Top Recurring Themes (ranked)   │
├───────────────────────────────┴──────────────────────────────────┤
│  Weekly Insight Summary (narrative card, AI-generated)            │
├──────────────────────────────────────────────────────────────────┤
│  Reviews Table — full fields: sentiment, urgency, category,       │
│  key_phrase, is_relevant, source (seeded / live_input), timestamp │
├──────────────────────────────────────────────────────────────────┤
│  Chat: "give me reviews where customer is angry about refunds"    │
│  [ RAG-powered query box + response ]                             │
└──────────────────────────────────────────────────────────────────┘
```

Every chart is labeled with a title and axis units so a non-technical CX stakeholder can read it without explanation.

**How the two views connect**: `ReviewForm.tsx` (rendered on `/user`, and reused as a "Try It Live" panel on `/admin`) posts to `POST /classify/single` with just the raw text — no rating, keeping the same rating-independence rule as the batch pipeline. The backend runs it through the same classification function used in the batch job, writes the full result to the same `reviews` table (tagged `source: 'live_input'` so it's distinguishable from the seeded dataset), but the API response sent back to the user route is trimmed to just `{category, acknowledgement_message}` — the rest (`sentiment`, `urgency`, `key_phrase`, `is_relevant`) is stored and only surfaced in the admin `ReviewsTable.tsx` and charts. This is also your best live demo moment for the mentor: submit as "user," then switch to `/admin` and show the same review already reflected in the charts (directly satisfies M5C1: "run the real use case").

## Setup

```bash
# backend
cd backend
cp ../.env.example .env        # fill in OPENAI_API_KEY, DATABASE_URL
pip install -r requirements.txt
psql $DATABASE_URL -f db/init_db.sql
python pipeline/run_pipeline.py --input ../data/eatsure_reviews_sample.csv
uvicorn main:app --reload

# frontend
cd frontend
npm install
npm run dev
```

`.env.example`:
```
OPENAI_API_KEY=
DATABASE_URL=postgresql://user:password@localhost:5432/pulseai
```

## Testing & reliability

- **Consistency**: rerun the same 10 reviews twice, 5 minutes apart, diff the JSON — documented match rate.
- **Edge cases**: blank input, 2000-word review, non-English review — each must return a meaningful response, not crash.
- **API failure**: invalid API key / disconnected network — UI shows an error state, backend doesn't crash.
- **No hardcoded secrets**: all keys in `.env`, `.env` is git-ignored.
- **Classification accuracy** *(fill in once run against the pipeline)*: hand-label a held-out subset of `eatsure_reviews_sample.csv`, compare against LLM output, report % agreement per category and overall — this directly addresses the mentor's blind-input accuracy test.

## Known limitations

- Sentiment/sarcasm/negation are the most likely source of misclassification at inference time — the *dataset* excludes obvious rating/text mismatches, but the live classifier will still encounter them in real traffic (e.g. via the "Try It Live" panel), so this remains a real failure mode worth naming in the demo.
- "Account & Onboarding" is genuinely rare in real EatSure feedback (~24 matches in the entire 20-week window) — represented at a floor of 8 rows rather than its true proportional share, so it's slightly over-represented relative to real frequency in order to guarantee test coverage.

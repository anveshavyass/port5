"""Deliberately chosen few-shot examples for the classification prompt.

Each example was picked to teach the model a specific rule that a generic
example would not, rather than just showing "one example per category":

1. Delivery Experience, negative, high urgency -- teaches that a *time*
   complaint ("1 hour late") belongs to delivery, not "General" complaint.
2. Food Quality, negative, medium urgency -- teaches specificity: "semi-cooked
   biryani" is Food Quality even though the user is also annoyed at the app.
3. Payments & Refunds, negative, high urgency -- teaches the "dominant harm"
   rule: money stuck is scored more urgent than a late delivery, and abusive
   tone in the review text must not soften the classification.
4. App & Ordering, negative, low urgency -- teaches that UI bugs are a
   distinct category from customer support complaints about *people*.
5. General Praise, positive, low urgency -- teaches the "no actionable
   complaint" signal so praise isn't force-fit into a complaint category.
6. General Praise, neutral, low urgency -- teaches that even a low-content,
   near-gibberish review still gets a best-effort real classification, and
   that key_phrase falls back to the review text itself rather than being
   left blank when there's no distinct phrase to extract.
7. Customer Support, negative, low urgency -- teaches that a vague negative
   review with no specific domain signal ("Worst") is NOT General Praise --
   negative sentiment is never praise, and a generic complaint defaults to
   Customer Support rather than being force-fit elsewhere.
"""

FEW_SHOT_EXAMPLES = [
    {
        "review": "Delivery takes more than 1 hour every single time, and the "
                   "delivery person just disappears with no updates.",
        "output": {
            "sentiment": "negative",
            "urgency": "high",
            "category": "Delivery Experience",
            "key_phrase": "1 hour delivery delay",
        },
    },
    {
        "review": "Ordered chicken biryani, got semi-cooked rice with just one "
                   "green pea in it. App wouldn't even let me report it properly.",
        "output": {
            "sentiment": "negative",
            "urgency": "medium",
            "category": "Food Quality",
            "key_phrase": "semi-cooked food",
        },
    },
    {
        "review": "This is absolutely ridiculous, you scammers took my money and "
                   "the refund has been 'processing' for 12 days. Give me my money back now.",
        "output": {
            "sentiment": "negative",
            "urgency": "high",
            "category": "Payments & Refunds",
            "key_phrase": "refund stuck 12 days",
        },
    },
    {
        "review": "The app UI is so buggy, it logs me out mid-order and I can't "
                   "use it on two devices at once.",
        "output": {
            "sentiment": "negative",
            "urgency": "low",
            "category": "App & Ordering",
            "key_phrase": "buggy app UI",
        },
    },
    {
        "review": "Good food, excellent work team, always on time!",
        "output": {
            "sentiment": "positive",
            "urgency": "low",
            "category": "General Praise",
            "key_phrase": "positive experience overall",
        },
    },
    {
        "review": "asdf ok nice 👍",
        "output": {
            "sentiment": "neutral",
            "urgency": "low",
            "category": "General Praise",
            "key_phrase": "asdf ok nice 👍",
        },
    },
    {
        "review": "Worst",
        "output": {
            "sentiment": "negative",
            "urgency": "low",
            "category": "Customer Support",
            "key_phrase": "Worst",
        },
    },
]

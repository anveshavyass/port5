import os

from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
DATABASE_URL = os.environ.get("DATABASE_URL", "")

CLASSIFY_MODEL = "gpt-4o-mini"
SUMMARY_MODEL = "gpt-4o"
EMBEDDING_MODEL = "text-embedding-3-small"

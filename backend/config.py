import os

from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
DATABASE_URL = os.environ.get("DATABASE_URL", "")
MILVUS_URI = os.environ.get("MILVUS_URI", "http://localhost:19530")
MILVUS_COLLECTION = "reviews"

CLASSIFY_MODEL = "gpt-4o-mini"
SUMMARY_MODEL = "gpt-4o"
EMBEDDING_MODEL = "text-embedding-3-small"

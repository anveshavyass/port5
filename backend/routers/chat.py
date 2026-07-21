from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.rag import answer_query

router = APIRouter()


class ChatRequest(BaseModel):
    question: str


@router.post("/chat")
def chat(payload: ChatRequest):
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="Question cannot be empty.")
    try:
        return answer_query(question)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Chat service unavailable: {exc}")

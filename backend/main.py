from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import aggregate, chat, classify, summary

app = FastAPI(title="PulseAI — EatSure Feedback Intelligence")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(classify.router)
app.include_router(aggregate.router)
app.include_router(summary.router)
app.include_router(chat.router)


@app.get("/health")
def health():
    return {"status": "ok"}

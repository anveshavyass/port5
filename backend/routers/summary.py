from fastapi import APIRouter

from services.summary import generate_weekly_summary

router = APIRouter()


@router.get("/summary")
def get_summary(week: str | None = None):
    return generate_weekly_summary(week=week)

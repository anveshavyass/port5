from fastapi import APIRouter

from db.queries import get_all_reviews
from services.aggregate import build_aggregates

router = APIRouter()


@router.get("/aggregate")
def get_aggregate():
    return build_aggregates()


@router.get("/reviews")
def list_reviews(limit: int = 1000):
    return get_all_reviews(limit=limit)

"""Recommendation route for ML-based chapter recommendations."""

from typing import Annotated
from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy.orm import Session

from app.routes.auth import db_dependency
from app.routes.users import user_dependency
from app.ml.service.recommendation_service import get_recommendations

router = APIRouter(
    prefix="/insights",
    tags=["ML Recommendations"]
)


@router.get("/")
def get_chapter_recommendations(
    db: db_dependency,
    user: user_dependency,
    course_id: Annotated[int, Query(gt=0, description="Course ID to get recommendations for")]
):
    """
    Get ML-based chapter recommendations for the authenticated user for a specific course.
    
    Args:
        course_id: The ID of the course to get chapter recommendations for
    
    Returns recommendations sorted by priority:
    - revise_urgent: Highest priority
    - practice_more: Medium-high priority
    - on_track: Medium priority
    - mastered: Lower priority
    """
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")
    
    try:
        recommendations = get_recommendations(db=db, user_id=user.get("id"), course_id=course_id)
        return {
            "recommendations": recommendations,
            "count": len(recommendations)
        }
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML model not available. Please train the model first."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating recommendations: {str(e)}"
        )


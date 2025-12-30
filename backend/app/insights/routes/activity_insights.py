from typing import Annotated
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session

from app.routes.auth import db_dependency
from app.routes.users import user_dependency
from app.insights.services.activity_time_tracker import get_activity_time_by_chapter
from app.models import Chapters, Courses

router = APIRouter(
    prefix="/insights",
    tags=["Insights"]
)


@router.get("/activity-time")
def activity_time_insights(
    db: db_dependency, 
    user: user_dependency, 
    course_id: Annotated[int, Query(gt=0)],
    activity_type: Annotated[str, Query()] = "summary"
):
    """ Chapter-wise time spent for a given activity type (summary | ask | mcq) """
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")
    
    # Verify that the course exists and belongs to the user
    course = db.query(Courses).filter(Courses.id == course_id, Courses.owner_id == user.get('id')).first()
    
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    
    try:
        return get_activity_time_by_chapter(db=db, owner_id=user.get("id"), course_id=course_id, activity_type=activity_type)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
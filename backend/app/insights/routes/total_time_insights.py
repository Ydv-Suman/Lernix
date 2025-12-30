from typing import Annotated
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.routes.auth import db_dependency
from app.routes.users import user_dependency
from app.insights.services.total_time_spent import get_total_time_spent_by_course

router = APIRouter(
    prefix="/insights",
    tags=["Insights"]
)


@router.get("/total-time")
def total_time_insights(
    db: db_dependency, 
    user: user_dependency
):
    """ Returns course-wise total time spent on all activities (summary, ask, mcq) """
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")
    
    try:
        return get_total_time_spent_by_course(db=db, owner_id=user.get("id"))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


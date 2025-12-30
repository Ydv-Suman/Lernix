from typing import Annotated
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.routes.auth import db_dependency
from app.routes.users import user_dependency
from app.models.mcq_attempt import MCQAttempt
from app.models.chapters import Chapters
from app.models.courses import Courses

router = APIRouter(
    prefix="/insights",
    tags=["Insights"]
)


@router.get("/mcq-attempts")
def mcq_attempts_insights(
    db: db_dependency, 
    user: user_dependency,
    course_id: Annotated[int, Query(gt=0)]
):
    """ Returns chapter-wise MCQ attempts and scores for a given course """
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")
    
    # Verify that the course exists and belongs to the user
    course = db.query(Courses).filter(Courses.id == course_id, Courses.owner_id == user.get('id')).first()
    
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    
    # Get all chapters for the course
    chapters = db.query(Chapters).filter(Chapters.course_id == course_id).all()
    
    # Get MCQ attempts grouped by chapter
    results = (db.query(
            Chapters.id.label("chapter_id"),
            Chapters.chapter_title.label("chapter_name"),
            func.count(MCQAttempt.id).label("attempts"),
            func.avg(MCQAttempt.score_percentage).label("avg_score"),
            func.max(MCQAttempt.attempted_at).label("last_attempt")
        )
        .outerjoin(
            MCQAttempt,
            (MCQAttempt.chapter_id == Chapters.id) &
            (MCQAttempt.user_id == user.get('id')) &
            (MCQAttempt.course_id == course_id)
        )
        .filter(
            Chapters.course_id == course_id
        )
        .group_by(
            Chapters.id,
            Chapters.chapter_title
        )
        .order_by(Chapters.id)
        .all()
    )
    
    return [
        {
            "chapter_id": row.chapter_id,
            "chapter_name": row.chapter_name,
            "attempts": row.attempts or 0,
            "avg_score": round(row.avg_score, 2) if row.avg_score else 0,
            "last_attempt": row.last_attempt.isoformat() if row.last_attempt else None
        }
        for row in results
    ]


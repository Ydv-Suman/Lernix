from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.models.learning_sessions import LearningSessions
from app.models.chapters import Chapters


def get_activity_time_by_chapter(db: Session, owner_id: int, course_id: int, activity_type: str):
    """ Returns chapter-wise total time spent for a given activity: summary | ask | mcq | view_content """
    
    # Normalize activity_type - handle both "ask" and "ask_question"
    if activity_type == "ask":
        activity_types = ["ask", "ask_question"]
    else:
        activity_types = [activity_type]
    
    # Validate activity_type
    valid_activity_types = ("summary", "ask", "ask_question", "mcq", "view_content")
    if activity_type not in valid_activity_types:
        raise ValueError(f"activity_type must be one of {valid_activity_types}, got: {activity_type}")

    results = (db.query(
            Chapters.id.label("chapter_id"),
            Chapters.chapter_title.label("chapter_name"),
            func.coalesce(
                func.sum(LearningSessions.duration_seconds), 0
            ).label("time_spent_seconds")
        )
        .outerjoin(
            LearningSessions,
            and_(
                LearningSessions.chapter_id == Chapters.id,
                LearningSessions.owner_id == owner_id,
                LearningSessions.course_id == course_id,
                LearningSessions.activity_type.in_(activity_types),
                LearningSessions.is_valid == True
            )
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
            "time_spent_seconds": row.time_spent_seconds
        }
        for row in results
    ]

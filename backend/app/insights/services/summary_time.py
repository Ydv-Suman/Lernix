from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.models.learning_sessions import LearningSessions
from app.models.chapters import Chapters


def get_summary_time_by_chapter(db: Session, owner_id: int, course_id: int):
    """ Returns chapter-wise total time spent on summarization """

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
                LearningSessions.activity_type == "summary",
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

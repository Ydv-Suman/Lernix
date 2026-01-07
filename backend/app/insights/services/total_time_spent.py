from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.learning_sessions import LearningSessions
from app.models.courses import Courses


def get_total_time_spent_by_course(db: Session, owner_id: int):
    """
    Returns course-wise total time spent on all activities (summary, ask, mcq, view_content).
    Calculates directly from learning_sessions table.
    
    Args:
        db: Database session
        owner_id: ID of the user/owner
        
    Returns:
        List of dictionaries containing course_id, course_title, and total_time_spent_seconds
    """
    
    results = (db.query(
            Courses.id.label("course_id"),
            Courses.title.label("course_title"),
            func.coalesce(
                func.sum(LearningSessions.duration_seconds), 0
            ).label("total_time_spent_seconds")
        )
        .outerjoin(
            LearningSessions,
            (LearningSessions.course_id == Courses.id) & 
            (LearningSessions.owner_id == owner_id) &
            (LearningSessions.activity_type.in_(["summary", "ask", "ask_question", "mcq", "view_content"])) &
            (LearningSessions.is_valid == True)
        )
        .filter(
            Courses.owner_id == owner_id
        )
        .group_by(Courses.id, Courses.title)
        .order_by(Courses.id)
        .all()
    )
    
    return [
        {
            "course_id": row.course_id,
            "course_title": row.course_title,
            "total_time_spent_seconds": row.total_time_spent_seconds
        }
        for row in results
    ]
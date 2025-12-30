from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.course_time_totals import CourseTimeTotals
from app.models.courses import Courses


def get_total_time_spent_by_course(db: Session, owner_id: int):
    """
    Returns course-wise total time spent on all activities (summary, ask, mcq).
    Uses the course_time_totals table for fast retrieval.
    
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
                CourseTimeTotals.total_time_spent_seconds, 0
            ).label("total_time_spent_seconds")
        )
        .outerjoin(
            CourseTimeTotals,
            (CourseTimeTotals.course_id == Courses.id) & 
            (CourseTimeTotals.owner_id == owner_id)
        )
        .filter(
            Courses.owner_id == owner_id
        )
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
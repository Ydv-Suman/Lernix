from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.course_time_totals import CourseTimeTotals
from app.models.learning_sessions import LearningSessions


def update_course_time_total(db: Session, owner_id: int, course_id: int, duration_seconds: int, is_add: bool = True):
    """
    Updates the course time total when a learning session is created, updated, or deleted.
    
    Args:
        db: Database session
        owner_id: ID of the user/owner
        course_id: ID of the course
        duration_seconds: Duration in seconds to add or subtract
        is_add: If True, add the duration; if False, subtract it
    """
    # Get or create the course time total record
    course_total = db.query(CourseTimeTotals).filter(
        CourseTimeTotals.owner_id == owner_id,
        CourseTimeTotals.course_id == course_id
    ).first()
    
    if course_total is None:
        # Create new record if it doesn't exist
        course_total = CourseTimeTotals(
            owner_id=owner_id,
            course_id=course_id,
            total_time_spent_seconds=0
        )
        db.add(course_total)
    
    # Update the total
    if is_add:
        course_total.total_time_spent_seconds += duration_seconds
    else:
        course_total.total_time_spent_seconds = max(0, course_total.total_time_spent_seconds - duration_seconds)
    
    db.commit()
    db.refresh(course_total)


def recalculate_course_time_total(db: Session, owner_id: int, course_id: int):
    """
    Recalculates the course time total from all valid learning sessions.
    Useful for data integrity checks or fixing inconsistencies.
    
    Args:
        db: Database session
        owner_id: ID of the user/owner
        course_id: ID of the course
    """
    # Calculate total from all valid sessions
    total = db.query(
        func.coalesce(func.sum(LearningSessions.duration_seconds), 0)
    ).filter(
        LearningSessions.owner_id == owner_id,
        LearningSessions.course_id == course_id,
        LearningSessions.activity_type.in_(["summary", "ask", "ask_question", "mcq"]),
        LearningSessions.is_valid == True
    ).scalar()
    
    # Get or create the course time total record
    course_total = db.query(CourseTimeTotals).filter(
        CourseTimeTotals.owner_id == owner_id,
        CourseTimeTotals.course_id == course_id
    ).first()
    
    if course_total is None:
        course_total = CourseTimeTotals(
            owner_id=owner_id,
            course_id=course_id,
            total_time_spent_seconds=total
        )
        db.add(course_total)
    else:
        course_total.total_time_spent_seconds = total
    
    db.commit()
    db.refresh(course_total)


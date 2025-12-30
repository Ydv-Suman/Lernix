from sqlalchemy import Column, Integer, ForeignKey, DateTime, func, UniqueConstraint
from app.database import Base


class CourseTimeTotals(Base):
    """Stores aggregated total time spent per course for all activities (summary, ask, mcq)."""

    __tablename__ = "course_time_totals"

    id                      = Column(Integer, primary_key=True, index=True)
    owner_id                = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    course_id               = Column(Integer, ForeignKey("courses.id"), nullable=False, index=True)
    total_time_spent_seconds = Column(Integer, default=0, nullable=False)
    created_at              = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at              = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Unique constraint to ensure one record per course per owner
    __table_args__ = (
        UniqueConstraint('owner_id', 'course_id', name='uq_owner_course'),
    )


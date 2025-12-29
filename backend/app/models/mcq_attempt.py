from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, func
from app.database import Base


class MCQAttempt(Base):
    """ Stores MCQ performance per attempt. Used for chapter-wise score graphs, insights, and ML. """

    __tablename__ = "mcq_attempts"

    id                  = Column(Integer, primary_key=True, index=True)
    user_id             = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id           = Column(Integer, ForeignKey("courses.id"), nullable=False)
    chapter_id          = Column(Integer, ForeignKey("chapters.id"), nullable=False)
    total_questions     = Column(Integer, nullable=False)
    correct_answers     = Column(Integer, nullable=False)
    score_percentage    = Column(Float, nullable=False)
    time_spent_seconds  = Column(Integer, nullable=True)
    attempted_at        = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


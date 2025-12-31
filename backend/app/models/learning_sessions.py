from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, func
from app.database import Base


class LearningSessions(Base):
    """ Tracks intentional learning activity time per chapter. This is the foundation for progress analytics and ML. """

    __tablename__ = "learning_sessions"

    id                  = Column(Integer, primary_key=True, index=True)
    owner_id            = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id           = Column(Integer, ForeignKey("courses.id"), nullable=False)
    chapter_id          = Column(Integer, ForeignKey("chapters.id"), nullable=False)
    activity_type       = Column(String(50), nullable=False)
    session_start       = Column(DateTime(timezone=True), nullable=False)
    session_end         = Column(DateTime(timezone=True), nullable=False)
    duration_seconds    = Column(Integer, nullable=False)
    is_valid            = Column(Boolean, default=True, nullable=False)
    created_at          = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at          = Column(DateTime(timezone=True), nullable=False)


from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base


class Chapters(Base):
    """Chapters belonging to courses."""

    __tablename__ = "chapters"

    id                  = Column(Integer, primary_key=True, index=True)
    chapter_title       = Column(String(255), nullable=False)
    chapter_description = Column(String(1000), nullable=True)
    course_id           = Column(Integer, ForeignKey("courses.id"), nullable=False)
    owner_id            = Column(Integer, ForeignKey("users.id"), nullable=False)


from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from app.database import Base


class ChapterFiles(Base):
    """Chapter files uploaded by users."""

    __tablename__ = "chapter_files"

    id          = Column(Integer, primary_key=True, index=True)
    file_name   = Column(String(255), nullable=False)
    file_path   = Column(String(500), nullable=False)
    file_type   = Column(String(50), nullable=False)
    mime_type   = Column(String(100), nullable=False)
    file_size   = Column(Integer, nullable=False)

    owner_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    chapter_id  = Column(Integer, ForeignKey("chapters.id"), nullable=False)
    course_id   = Column(Integer, ForeignKey("courses.id"), nullable=False)

    uploaded_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


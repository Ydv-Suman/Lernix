"""ORM models for users, courses, and chapters."""

from app.database import Base
from sqlalchemy import Column, ForeignKey, Null, String, Integer, Boolean, UniqueConstraint, DateTime, func


class Users(Base):
    """User account with identity and auth fields."""

    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String(255), unique=True, nullable=False)
    username        = Column(String(100), unique=True, nullable=False)
    first_name      = Column(String(100), nullable=False)
    mid_init        = Column(String(1), nullable=True)
    last_name       = Column(String(100), nullable=False)
    phone_number    = Column(String(20), nullable=False)
    active_status   = Column(Boolean, nullable=False, default=True)
    hashed_password = Column(String(255), nullable=False)

    

class Courses(Base):
    """Courses created by users, one-to-many with chapters."""

    __tablename__ = "courses"

    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String(255), unique=True, nullable=False)
    description = Column(String(1000), nullable=True)
    owner_id    = Column(Integer, ForeignKey("users.id"), nullable=False)



class Chapters(Base):
    """Chapters belonging to courses."""

    __tablename__ = "chapters"

    id                  = Column(Integer, primary_key=True, index=True)
    chapter_title       = Column(String(255), nullable=False)
    chapter_description = Column(String(1000), nullable=True)
    course_id           = Column(Integer, ForeignKey("courses.id"), nullable=False)
    owner_id            = Column(Integer, ForeignKey("users.id"), nullable=False)


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

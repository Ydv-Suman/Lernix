from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base


class Courses(Base):
    """Courses created by users, one-to-many with chapters."""

    __tablename__ = "courses"

    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String(255), unique=True, nullable=False)
    description = Column(String(1000), nullable=True)
    owner_id    = Column(Integer, ForeignKey("users.id"), nullable=False)


from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base


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


from database import Base
from sqlalchemy import Column, ForeignKey, Null, String, Integer, Boolean, UniqueConstraint

class Users(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String(255), unique=True)
    username        = Column(String(100), unique=True)
    first_name      = Column(String(100))
    mid_init        = Column(String(1), nullable=True)
    last_name       = Column(String(100))
    phone_number    = Column(String(20), default=Null)
    active_status   = Column(Boolean, default=True)
    hashed_password = Column(String(255))
    

class Courses(Base):
    __tablename__ = "courses"

    id              = Column(Integer, primary_key=True, index=True)
    title           = Column(String(255), unique=True, nullable=False)
    description     = Column(String(1000), nullable=True)
    owner_id        = Column(Integer, ForeignKey("users.id"))
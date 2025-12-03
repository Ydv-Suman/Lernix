from database import Base
from sqlalchemy import Column, Null, String, Integer, Boolean, UniqueConstraint

class Users(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String, unique=True)
    username        = Column(String, unique=True)
    first_name      = Column(String)
    mid_init        = Column(String, nullable=True)
    last_name       = Column(String)
    phone_number    = Column(String, default=Null)
    active_status   = Column(Boolean, default=True)
    hashed_password = Column(String)
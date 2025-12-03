from fastapi import APIRouter, Depends, status
from typing import Annotated, List
from sqlalchemy.orm import Session
from pydantic import BaseModel

from model import Users
from .auth import get_db

router = APIRouter(
    prefix='/user',
    tags=['user']
)


db_dependency = Annotated[Session, Depends(get_db)]


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    first_name: str
    mid_init: str | None
    last_name: str
    phone_number: str | None
    active_status: bool

    class Config:
        from_attributes = True


@router.get('/', response_model=List[UserResponse], status_code=status.HTTP_200_OK)
def get_all_users(db: db_dependency):
    users = db.query(Users).all()
    return users
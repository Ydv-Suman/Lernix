from fastapi import APIRouter, Depends, status
from typing import Annotated
from sqlalchemy.orm import Session
from sqlalchemy.sql.functions import user

from database import SessionLocal, Base
from model import Users
from auth import get_db

router = APIRouter(
    prefix='/user',
    tags=['user']
)


db_dependency = Annotated[Session,  Depends(get_db)]

@router.get('/')
def get_user(db:db_dependency):
from typing import Annotated
from fastapi import APIRouter, Depends, status, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import SessionLocal
from model import Users

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)


class CreateUserRequest(BaseModel):
    email: str
    username: str
    first_name: str
    last_name: str
    phone_number: str
    password: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

# get current user


# create new Users
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_new_user(create_user_request: CreateUserRequest, db: db_dependency):

    # Create DB model instance
    new_user = Users(
        email=create_user_request.email,
        username=create_user_request.username,
        first_name=create_user_request.first_name,
        last_name=create_user_request.last_name,
        phone_number=create_user_request.phone_number,
        password=create_user_request.password
    )

    # Save user
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully", "user_id": new_user.id}

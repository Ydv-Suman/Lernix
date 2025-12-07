from datetime import time, timedelta, timezone
import datetime
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, status, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import jwt, JWTError

import os
from dotenv import load_dotenv

from database import SessionLocal
from model import Users

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

load_dotenv()

SECRETKEY = os.getenv("SECRETKEY")
ALGORITHM = os.getenv("ALGORITHM")

if not SECRETKEY:
    raise ValueError("SECRETKEY environment variable is not set")
if not ALGORITHM:
    raise ValueError("ALGORITHM environment variable is not set")

# Type assertions for type checker after runtime validation
assert SECRETKEY is not None
assert ALGORITHM is not None

bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
outh2_bearer = OAuth2PasswordBearer(tokenUrl='auth/token')


class CreateUserRequest(BaseModel):
    email: str
    username: str
    first_name: str
    last_name: str
    phone_number: str
    password: str


class Token(BaseModel):
    access_token:str
    token_type: str


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]


# create new Users
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_new_user(create_user_request: CreateUserRequest, db: db_dependency):
    # Check if email already exists
    existing_user = db.query(Users).filter(Users.email == create_user_request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username already exists
    existing_user = db.query(Users).filter(Users.username == create_user_request.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Create DB model instance
    new_user = Users(
        email=create_user_request.email,
        username=create_user_request.username,
        first_name=create_user_request.first_name,
        last_name=create_user_request.last_name,
        phone_number=create_user_request.phone_number,
        hashed_password=bcrypt_context.hash(create_user_request.password)
    )

    # Save user
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {"message": "User created successfully", "user_id": new_user.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create user. Please check your input."
        )


def authenticate_user(username:str, password:str, db):
    user = db.query(Users).filter(Users.username==username).first()
    if not user:
        return None
    if not bcrypt_context.verify(password, user.hashed_password):
        return None
    return user

def create_access_token(username: str, user_id:int, expires_delta:timedelta):
    encode = {'sub': username, 'id':user_id}
    expires = datetime.datetime.now(timezone.utc) + expires_delta
    encode.update({'exp': expires})
    return jwt.encode(encode, SECRETKEY, algorithm=ALGORITHM)


async def get_current_user(token: Annotated[str, Depends(outh2_bearer)]):
    try:
        payload = jwt.decode(token, SECRETKEY, algorithms=[ALGORITHM])
        username: Optional[str] = payload.get('sub')
        user_id: Optional[int] = payload.get('id')
        if username is None or user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='could not validate user')
        return {'username':username, 'id':user_id}
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='could not validate user')
        


@router.post('/token', response_model=Token)
def login_for_access_token(db: db_dependency, form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
       raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='could not validate user')
    token = create_access_token(user.username, user.id, timedelta(minutes=20))  # type: ignore
    return {'access_token': token, 'token_type': 'bearer'}
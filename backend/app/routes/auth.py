from datetime import timedelta, timezone
import datetime
from typing import Annotated, Optional, cast
from fastapi import APIRouter, Depends, status, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import jwt, JWTError

import os
from dotenv import load_dotenv

from app.database import SessionLocal
from app.model import Users

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
    mid_init: str | None = None
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
@router.post("/create", status_code=status.HTTP_201_CREATED)
def create_new_user(create_user_request: CreateUserRequest, db: db_dependency):
    """Register a new user ensuring unique email and username."""
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
        mid_init=create_user_request.mid_init if create_user_request.mid_init else None,
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
    # Type narrowing: SECRETKEY and ALGORITHM are guaranteed to be str by runtime checks above
    secret_key = cast(str, SECRETKEY)
    algorithm = cast(str, ALGORITHM)
    return jwt.encode(encode, secret_key, algorithm=algorithm)


async def get_current_user(token: Annotated[str, Depends(outh2_bearer)]):
    try:
        # Type narrowing: SECRETKEY and ALGORITHM are guaranteed to be str by runtime checks above
        secret_key = cast(str, SECRETKEY)
        algorithm = cast(str, ALGORITHM)
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        username: Optional[str] = payload.get('sub')
        user_id: Optional[int] = payload.get('id')
        if username is None or user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='could not validate user')
        return {'username':username, 'id':user_id}
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='could not validate user')
        


@router.post('/token', response_model=Token)
def login_for_access_token(db: db_dependency, form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    """Authenticate with username/password and return a bearer token."""
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
       raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='could not validate user')
    token = create_access_token(user.username, user.id, timedelta(minutes=20))  # type: ignore
    return {'access_token': token, 'token_type': 'bearer'}



#

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login_user(login_request: LoginRequest, db: db_dependency):
    """Authenticate by email and password and return a JWT plus user details."""
    user = db.query(Users).filter(Users.email == login_request.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Ensure user.hashed_password, user.username, user.id are values, not SQLAlchemy Column objects
    hashed_password = getattr(user, "hashed_password", None)
    username = getattr(user, "username", None)
    user_id = getattr(user, "id", None)

    if hashed_password is None or username is None or user_id is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not bcrypt_context.verify(login_request.password, hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Generate JWT token
    token = create_access_token(str(username), int(user_id), timedelta(minutes=20))

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name
        }
    }


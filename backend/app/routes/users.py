from fastapi import APIRouter, Depends, status, HTTPException, Path
from typing import Annotated, List
from passlib.context import CryptContext  # type: ignore[reportMissingImports]
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.models import Users
from .auth import get_db, get_current_user

router = APIRouter(
    prefix='/user',
    tags=['user']
)


db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(get_current_user)]
bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')


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


@router.get('/', response_model=UserResponse, status_code=status.HTTP_200_OK)
def get_users(db: db_dependency, user:user_dependency):
    """Return the authenticated user's profile details."""
    if user is None :
        raise HTTPException(status_code=401, detail="Authentication Failed")
    user_obj = db.query(Users).filter(Users.id == user.get('id')).first()
    if user_obj is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user_obj





## delete the use
@router.delete('/deleteuser/{user_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_user(db: db_dependency, user:user_dependency):
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")
    
    user_obj = db.query(Users).filter(Users.id == user.get('id')).first()
    
    if user_obj is None:
        raise HTTPException(status_code=404, detail="User Not Found")
    
    db.delete(user_obj)
    db.commit()
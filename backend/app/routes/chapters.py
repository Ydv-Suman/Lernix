from fastapi import APIRouter, HTTPException, status

from model import Chapters, Users
from .auth import db_dependency
from .users import user_dependency

router = APIRouter(
    prefix='/chapter',
    tags=['chapter']
)

@router.get('/', status_code=status.HTTP_200_OK)
def view_chapter(db:db_dependency, user:user_dependency):
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")
    chapters = db.query(Chapters).filter(Chapters.chapter_id==user.get('id')).all()
    return Chapters
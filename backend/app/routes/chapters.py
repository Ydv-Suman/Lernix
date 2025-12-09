from typing import Annotated
from fastapi import APIRouter, HTTPException, status, Path
from pydantic import BaseModel

from model import Chapters, Users, Courses
from .auth import db_dependency
from .users import user_dependency

router = APIRouter(
    prefix='/chapter',
    tags=['chapter']
)


class CreateChapterRequest(BaseModel):
    title: str
    description: str



class UserResponse(BaseModel):
    id: int
    chapter_title: str
    chapter_description: str

    class Config:
        from_attributes = True

@router.get('/', status_code=status.HTTP_200_OK)
def view_all_chapter(db:db_dependency, user:user_dependency):
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")
    chapters = db.query(Chapters).filter(Chapters.owner_id == user.get('id')).all()
    return chapters


@router.get('/course/{course_id}', status_code=status.HTTP_200_OK)
def get_course_chapters(db: db_dependency, user: user_dependency, course_id: Annotated[int, Path(gt=0)]):
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")
    
    # Verify that the course exists and belongs to the user
    course = db.query(Courses).filter(Courses.id == course_id,Courses.owner_id == user.get('id')).first()
    
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found" )
    
    # Get all chapters for this course
    chapters = db.query(Chapters).filter(Chapters.course_id == course_id).all()
    return chapters



@router.post('/course/{course_id}', status_code=status.HTTP_201_CREATED)
def add_chapter_to_course(db: db_dependency,  user: user_dependency,  course_id: Annotated[int, Path(gt=0)], add_chapter: CreateChapterRequest):
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")
    
    # Verify that the course exists and belongs to the user
    course = db.query(Courses).filter(Courses.id == course_id).filter(Courses.owner_id == user.get('id')).first()
    
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found" )
    
    # Check if chapter title already exists
    existing_chapter = db.query(Chapters).filter(Chapters.chapter_title == add_chapter.title).first()
    if existing_chapter:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Chapter title already exists" )
    
    # Create the new chapter
    new_chapter = Chapters(
        chapter_title=add_chapter.title,
        chapter_description=add_chapter.description,
        course_id=course_id,
        owner_id=user.get('id')
    )
    
    try:
        db.add(new_chapter)
        db.commit()
        db.refresh(new_chapter)
        return {"message": "Chapter added to course successfully","chapter_id": new_chapter.id,"course_id": course_id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to add chapter to course: {str(e)}" )



@router.put('/updateChapter/{chapter_id}', status_code=status.HTTP_202_ACCEPTED)
def update_chapter(db:db_dependency, user:user_dependency, chapter_id: Annotated[int, Path(gt=0)], update_chapter: CreateChapterRequest):
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")
    chapter = db.query(Chapters).filter(Chapters.id == chapter_id).filter(Chapters.owner_id == user.get('id')).first()
    if chapter is None:
        raise HTTPException(status_code=404, detail="Chapter not found")
    try:
        chapter.chapter_title = update_chapter.title
        chapter.chapter_description = update_chapter.description
        db.commit()
        db.refresh(chapter)
        return {"message": "Chapter updated successfully", "chapter_id": chapter.id, "title": chapter.chapter_title}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to update chapter: {str(e)}" )


@router.delete('/deleteChapter/{chapter_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_chapter_from_course(db:db_dependency, user:user_dependency, chapter_id: Annotated[int, Path(gt=0)]):
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")
    chapter = db.query(Chapters).filter(Chapters.id == chapter_id).filter(Chapters.owner_id==user.get('id')).first()
    if chapter is None:
        raise HTTPException(status_code=404, detail="Chapter Not Found")
    db.delete(chapter)
    db.commit()
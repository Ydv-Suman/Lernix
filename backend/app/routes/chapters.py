from typing import Annotated
from fastapi import APIRouter, HTTPException, status, Path
from pydantic import BaseModel

from app.models import Chapters, Users, Courses
from .auth import db_dependency
from .users import user_dependency

router = APIRouter(
    prefix='/courses/{course_id}/chapter',
    tags=['chapter']
)


class CreateChapterRequest(BaseModel):
    title: str
    description: str



class ChapterResponse(BaseModel):
    id: int
    chapter_title: str
    chapter_description: str
    course_id: int
    owner_id: int

    class Config:
        from_attributes = True


@router.get('', status_code=status.HTTP_200_OK)
def get_course_chapters(db: db_dependency, user: user_dependency, course_id: Annotated[int, Path(gt=0)]):
    """Return all chapters for a course that belongs to the authenticated user."""
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")
    
    # Verify that the course exists and belongs to the user
    course = db.query(Courses).filter(Courses.id == course_id, Courses.owner_id == user.get('id')).first()
    
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found" )
    
    # Get all chapters for this course
    chapters = db.query(Chapters).filter(Chapters.course_id == course_id).all()
    return chapters


@router.get('/{chapter_id}', status_code=status.HTTP_200_OK)
def get_course_chapters_by_chapterid(db: db_dependency, user: user_dependency, course_id: Annotated[int, Path(gt=0)], chapter_id: Annotated[int, Path(gt=0)]):
    """Return a single chapter by id for a course owned by the authenticated user."""
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")
    
    # Verify that the course exists and belongs to the user
    course = db.query(Courses).filter(Courses.id == course_id, Courses.owner_id == user.get('id')).first()
    
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    
    # Get the specific chapter for this course
    chapter = db.query(Chapters).filter(Chapters.id == chapter_id, Chapters.course_id == course_id).first()
    
    if not chapter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")
    
    return chapter



@router.post('/createChapter/', status_code=status.HTTP_201_CREATED)
def add_chapter_to_course(db: db_dependency,  user: user_dependency,  course_id: Annotated[int, Path(gt=0)], add_chapter: CreateChapterRequest):
    """Create a new chapter under a course owned by the authenticated user."""
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")
    
    # Verify that the course exists and belongs to the user
    course = db.query(Courses).filter(Courses.id == course_id).filter(Courses.owner_id == user.get('id')).first()
    
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found" )
    
    # Check if chapter title already exists within this course
    existing_chapter = db.query(Chapters).filter(Chapters.chapter_title == add_chapter.title, Chapters.course_id == course_id).first()
    if existing_chapter:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Chapter title already exists in this course")
    
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
def update_chapter(db:db_dependency, user:user_dependency, course_id: Annotated[int, Path(gt=0)], chapter_id: Annotated[int, Path(gt=0)], update_chapter: CreateChapterRequest):
    """Update a chapter's title and description within a course owned by the user."""
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")
    
    # Verify that the course exists and belongs to the user
    course = db.query(Courses).filter(Courses.id == course_id, Courses.owner_id == user.get('id')).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    
    # Verify that the chapter exists, belongs to the course, and belongs to the user
    chapter = db.query(Chapters).filter(Chapters.id == chapter_id, Chapters.course_id == course_id, Chapters.owner_id == user.get('id')).first()
    if chapter is None:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    # Check if the new title conflicts with another chapter in the same course
    existing_chapter = db.query(Chapters).filter(Chapters.chapter_title == update_chapter.title, Chapters.course_id == course_id, Chapters.id != chapter_id).first()
    if existing_chapter:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Chapter title already exists in this course")
    
    try:
        chapter.chapter_title = update_chapter.title  # type: ignore
        chapter.chapter_description = update_chapter.description  # type: ignore
        db.commit()
        db.refresh(chapter)
        return {"message": "Chapter updated successfully", "chapter_id": chapter.id, "title": chapter.chapter_title}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to update chapter: {str(e)}")


@router.delete('/deleteChapter/{chapter_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_chapter_from_course(db:db_dependency, user:user_dependency, course_id: Annotated[int, Path(gt=0)], chapter_id: Annotated[int, Path(gt=0)]):
    """Delete a chapter from a course owned by the authenticated user."""
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")
    
    # Verify that the course exists and belongs to the user
    course = db.query(Courses).filter(Courses.id == course_id, Courses.owner_id == user.get('id')).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    
    # Verify that the chapter exists, belongs to the course, and belongs to the user
    chapter = db.query(Chapters).filter(Chapters.id == chapter_id, Chapters.course_id == course_id, Chapters.owner_id == user.get('id')).first()
    if chapter is None:
        raise HTTPException(status_code=404, detail="Chapter Not Found")
    
    db.delete(chapter)
    db.commit()
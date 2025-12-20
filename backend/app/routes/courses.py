from typing import Annotated
from fastapi import APIRouter, HTTPException, status, Path
from pydantic import BaseModel

from app.model import Courses, Users
from .auth import db_dependency
from .users import user_dependency

router = APIRouter(
    prefix='/courses',
    tags=['courses']
)


class CreateCourseRequest(BaseModel):
    title: str
    description: str

@router.get('/', status_code=status.HTTP_200_OK)
def view_course(db:db_dependency, user:user_dependency):
    """List all courses owned by the authenticated user."""
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")
    courses = db.query(Courses).filter(Courses.owner_id == user.get('id')).all()
    return courses

@router.post('/createCourse', status_code=status.HTTP_201_CREATED)
def create_course(user:user_dependency, db:db_dependency, add_course:CreateCourseRequest):
    """Create a new course for the authenticated user."""
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")
    
    # Check if course title already exists
    existing_course = db.query(Courses).filter(Courses.title == add_course.title).first()
    if existing_course:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Course title already exists"
        )
    
    new_course = Courses(
        title=add_course.title,
        description=add_course.description,
        owner_id=user.get('id')
    )
    try:
        db.add(new_course)
        db.commit()
        db.refresh(new_course)
        return {"message": "Course created successfully", "course_id": new_course.id, "title": new_course.title}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create new course: {str(e)}"
        )


@router.put('/updateCourse/{course_id}', status_code=status.HTTP_202_ACCEPTED)
def update_course(db:db_dependency, user:user_dependency, course_update:CreateCourseRequest, course_id: Annotated[int, Path(gt=0)]):
    """Update title and description of a course owned by the authenticated user."""
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")
    course = db.query(Courses).filter(Courses.id == course_id).filter(Courses.owner_id==user.get('id')).first()
    if course is None:
        raise HTTPException(status_code=404, detail="Course Not Found")
    try:
        course.title = course_update.title  # type: ignore
        course.description = course_update.description  # type: ignore
        db.commit()
        db.refresh(course)
        return {"message": "Course updated successfully", "course_id": course.id, "title": course.title}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to edit course: {str(e)}")


@router.delete('/deleteCourse/{course_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_course(db:db_dependency, user:user_dependency, course_id: Annotated[int, Path(gt=0)]):
    """Delete a course owned by the authenticated user."""
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")
    course = db.query(Courses).filter(Courses.id == course_id).filter(Courses.owner_id==user.get('id')).first()
    if course is None:
        raise HTTPException(status_code=404, detail="Course Not Found")
    db.query(Courses).filter(Courses.id == course_id).filter(Courses.owner_id==user.get('id')).delete()
    db.commit()
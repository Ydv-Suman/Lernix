from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from model import Courses, Users
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
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")
    courses = db.query(Courses).filter(Courses.owner_id == user.get('id')).all()
    return courses

@router.post('/createCourse', status_code=status.HTTP_201_CREATED)
def create_course(user:user_dependency, db:db_dependency, add_course:CreateCourseRequest):
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
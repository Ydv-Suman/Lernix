from typing import Annotated
from fastapi import APIRouter, HTTPException, Path, status, UploadFile, File, Query
from fastapi.responses import StreamingResponse
import io
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel

from app.models import Chapters, Users, Courses, ChapterFiles, LearningSessions
from .auth import db_dependency
from .users import user_dependency
from app.s3_config.s3_helper import upload_file_to_s3, delete_file_from_s3, get_file_from_s3, get_text_from_s3
from app.insights.services.course_time_totals_sync import update_course_time_total


router = APIRouter(
    prefix="/courses/{course_id}/chapter/{chapter_id}/files",
    tags=["chapter_file"]
)

# Allowed file types
ALLOWED_MIME_TYPES = {
    "text/plain": "txt",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/pdf": "pdf"
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.get('/', status_code=status.HTTP_200_OK)
def get_file(user:user_dependency, db:db_dependency, course_id: Annotated[int, Path(gt=0)], chapter_id: Annotated[int, Path(gt=0)]):
    """Get all files for a specific chapter"""

    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")
    

    chapter = db.query(Chapters).filter(Chapters.id == chapter_id, Chapters.course_id == course_id, Chapters.owner_id == user.get('id')).first()
    if chapter is None:
        raise HTTPException(status_code=404, detail="Chapter Not Found")
    

    files = db.query(ChapterFiles).filter(ChapterFiles.chapter_id == chapter_id).all()
    return files


@router.post("/uploadFile", status_code=status.HTTP_201_CREATED)
async def upload_file(user:user_dependency, db:db_dependency, course_id: Annotated[int, Path(gt=0)], chapter_id: Annotated[int, Path(gt=0)], file: UploadFile = File(...)):
    """Upload a file to S3 and store metadata in database"""

    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")
    

    chapter = db.query(Chapters).filter(Chapters.id == chapter_id, Chapters.course_id == course_id, Chapters.owner_id == user.get('id')).first()
    if chapter is None:
        raise HTTPException(status_code=404, detail="Chapter Not Found")
    
    # Validate MIME type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_MIME_TYPES.keys())}"
        )
    
    # Read file content
    file_content = await file.read()
    file_size = len(file_content)
    
    # Validate file size
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / (1024 * 1024)}MB"
        )
    
    # Generate unique filename
    file_extension = ALLOWED_MIME_TYPES[file.content_type]
    unique_filename = f"{file.filename}"
    
    try:
        # Upload to S3
        s3_file_path = upload_file_to_s3(
            file_content=file_content,
            file_name=unique_filename,
            folder=f"users/{user.get('id')}/courses/{course_id}/chapters/{chapter_id}"
        )
        
        # Save metadata to database
        new_file = ChapterFiles(
            file_name=file.filename,
            file_path=s3_file_path,
            file_type=file_extension,
            mime_type=file.content_type,
            file_size=file_size,
            owner_id=user.get('id'),
            chapter_id=chapter_id,
            course_id=course_id
        )
        
        db.add(new_file)
        db.commit()
        db.refresh(new_file)
        
        return {
            "message": "File uploaded successfully",
            "file_id": new_file.id,
            "file_name": new_file.file_name,
            "file_size": new_file.file_size,
            "file_path": new_file.file_path
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload file: {str(e)}"
        )


@router.get('/{file_id}/content', status_code=status.HTTP_200_OK)
def get_file_content(user:user_dependency, db:db_dependency, course_id: Annotated[int, Path(gt=0)], chapter_id: Annotated[int, Path(gt=0)], file_id: Annotated[int, Path(gt=0)]):
    """Get the text content of a file"""
    
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")
    
    chapter = db.query(Chapters).filter(Chapters.id == chapter_id, Chapters.course_id == course_id, Chapters.owner_id == user.get('id')).first()
    if chapter is None:
        raise HTTPException(status_code=404, detail="Chapter Not Found")
    
    file = db.query(ChapterFiles).filter(ChapterFiles.id == file_id, ChapterFiles.chapter_id == chapter_id, ChapterFiles.owner_id == user.get('id')).first()
    if file is None:
        raise HTTPException(status_code=404, detail="File Not Found")
    
    try:
        # Get text content from S3
        file_path: str = str(file.file_path)
        text_content = get_text_from_s3(file_path)
        
        return {
            "file_id": file.id,
            "file_name": file.file_name,
            "content": text_content
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve file content: {str(e)}"
        )


class ViewContentDurationRequest(BaseModel):
    duration_seconds: int


@router.post('/{file_id}/record-viewing', status_code=status.HTTP_201_CREATED)
def record_viewing_duration(user:user_dependency, db:db_dependency, course_id: Annotated[int, Path(gt=0)], chapter_id: Annotated[int, Path(gt=0)], file_id: Annotated[int, Path(gt=0)], request: ViewContentDurationRequest):
    """Record the time duration spent viewing file content"""
    
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")
    
    chapter = db.query(Chapters).filter(Chapters.id == chapter_id, Chapters.course_id == course_id, Chapters.owner_id == user.get('id')).first()
    if chapter is None:
        raise HTTPException(status_code=404, detail="Chapter Not Found")
    
    file = db.query(ChapterFiles).filter(ChapterFiles.id == file_id, ChapterFiles.chapter_id == chapter_id, ChapterFiles.owner_id == user.get('id')).first()
    if file is None:
        raise HTTPException(status_code=404, detail="File Not Found")
    
    # Validate duration
    duration_seconds = request.duration_seconds
    if duration_seconds < 0:
        raise HTTPException(status_code=400, detail="Duration cannot be negative")
    
    # Ensure minimum 1 second duration
    if duration_seconds == 0:
        duration_seconds = 1
    
    try:
        # Calculate session times
        session_end = datetime.now(timezone.utc)
        session_start = session_end - timedelta(seconds=duration_seconds)
        
        # Create learning session record
        learning_session = LearningSessions(
            owner_id=user.get('id'),
            course_id=course_id,
            chapter_id=chapter_id,
            activity_type="view_content",
            session_start=session_start,
            session_end=session_end,
            duration_seconds=duration_seconds,
            is_valid=True,
            updated_at=session_end
        )
        db.add(learning_session)
        db.commit()
        
        # Update course time total
        update_course_time_total(
            db=db,
            owner_id=user.get('id'),
            course_id=course_id,
            duration_seconds=duration_seconds,
            is_add=True
        )
        
        return {
            "message": "Viewing duration recorded successfully",
            "duration_seconds": duration_seconds
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to record viewing duration: {str(e)}"
        )


@router.delete('/delete/{file_id}')
def delete_file_by_id(db:db_dependency, user:user_dependency, course_id:Annotated[int, Path(gt=0)], chapter_id:Annotated[int, Path(gt=0)], file_id:Annotated[int, Path(gt=0)]):
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")
    
    chapter = db.query(Chapters).filter(Chapters.id == chapter_id, Chapters.course_id == course_id, Chapters.owner_id == user.get('id')).first()
    if chapter is None:
        raise HTTPException(status_code=404, detail="Chapter Not Found")
    
    file = db.query(ChapterFiles).filter(ChapterFiles.id == file_id, ChapterFiles.chapter_id == chapter_id, ChapterFiles.owner_id == user.get('id')).first()
    if file is None:
        raise HTTPException(status_code=404, detail="File Not Found")
    
    try:
        # Delete from S3 
        file_path: str = str(file.file_path)
        delete_file_from_s3(file_path)
        
        # Delete from database
        db.delete(file)
        db.commit()
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete file: {str(e)}"
        )
from typing import Annotated
from fastapi import APIRouter, HTTPException, Path, status, UploadFile, File
from fastapi.responses import StreamingResponse
import io
from datetime import datetime

from model import Chapters, Users, Courses, ChapterFiles
from .auth import db_dependency
from .users import user_dependency
from utils.s3_helper import upload_file_to_s3, delete_file_from_s3, get_file_from_s3


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
            folder=f"courses/{course_id}/chapters/{chapter_id}"
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
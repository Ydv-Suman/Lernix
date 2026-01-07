from fastapi import APIRouter, HTTPException, status, Path, Body
from typing import Annotated
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from app.s3_config.s3_helper import get_text_from_s3
from app.rag.services.summarizer_logic import summarize_text

from app.models import Chapters, Users, Courses, ChapterFiles, LearningSessions
from app.routes.auth import db_dependency
from app.routes.users import user_dependency


router = APIRouter(
    prefix="/courses/{course_id}/chapter/{chapter_id}/files/{file_id}/summarize", 
    tags=["RAG"])


class SummarizeRequest(BaseModel):
    duration_seconds: int = 0


@router.post("/", status_code=status.HTTP_200_OK)
def summarize_uploaded_file(
    user: user_dependency, 
    db: db_dependency, 
    course_id: Annotated[int, Path(gt=0)], 
    chapter_id: Annotated[int, Path(gt=0)], 
    file_id: Annotated[int, Path(gt=0)],
    request: SummarizeRequest = Body(default=SummarizeRequest(duration_seconds=0))
):
    """ Summarize a document stored in S3 using RAG """

    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")
    
    # Verify chapter exists and belongs to user
    chapter = db.query(Chapters).filter(
        Chapters.id == chapter_id,
        Chapters.course_id == course_id,
        Chapters.owner_id == user.get('id')
    ).first()
    
    if chapter is None:
        raise HTTPException(status_code=404, detail="Chapter Not Found")
    
    file = db.query(ChapterFiles).filter(
        ChapterFiles.id == file_id, 
        ChapterFiles.chapter_id == chapter_id, 
        ChapterFiles.course_id == course_id, 
        ChapterFiles.owner_id == user.get('id')
    ).first()

    if file is None:
        raise HTTPException(status_code=404, detail="File Not Found")
    
    # Get S3 key safely from DB
    file_key = file.file_path

    try:
        # 1. Get extracted text from S3
        text = get_text_from_s3(file_key)

        if not text.strip():
            raise HTTPException(
                status_code=400,
                detail="Document is empty or could not extract text"
            )

        # 2. Run RAG summarization
        summary = summarize_text(text)

        # 3. Record learning session if duration is provided and valid
        if request.duration_seconds >= 1:
            session_end = datetime.now(timezone.utc)
            session_start = session_end - timedelta(seconds=request.duration_seconds)
            
            learning_session = LearningSessions(
                owner_id=user.get('id'),
                course_id=course_id,
                chapter_id=chapter_id,
                activity_type="summary",
                session_start=session_start,
                session_end=session_end,
                duration_seconds=request.duration_seconds,
                is_valid=True,
                updated_at=session_end
            )
            db.add(learning_session)
            db.commit()

        # 4. Return response
        return {
            "file_key": file_key,
            "summary": summary
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to summarize document: {str(e)}"
        )

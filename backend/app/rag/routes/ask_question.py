from fastapi import APIRouter, status, HTTPException, Path
from typing import Annotated
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from app.s3_config.s3_helper import get_text_from_s3
from app.rag.services.ask_question_logic import ask_question

from app.models import LearningSessions, Users, Courses, Chapters , ChapterFiles
from app.routes.auth import db_dependency
from app.routes.users import user_dependency

router = APIRouter(
    prefix="/courses/{course_id}/chapter/{chapter_id}/files/{file_id}/ask_question",
    tags=["RAG"]
)

class QuestionRequest(BaseModel):
    question: str
    duration_seconds: int = 0

@router.post('/', status_code=status.HTTP_200_OK)
def ask_questions(
    db:db_dependency, 
    user:user_dependency, 
    course_id:Annotated[int, Path(gt=0)], 
    chapter_id:Annotated[int, Path(gt=0)], 
    file_id:Annotated[int, Path(gt=0)],
    request: QuestionRequest
):
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

        # 2. Run RAG question answering
        answer = ask_question(text, request.question)

        # 3. Record learning session if duration is provided and valid
        if request.duration_seconds >= 1:
            session_end = datetime.now(timezone.utc)
            session_start = session_end - timedelta(seconds=request.duration_seconds)
            
            learning_session = LearningSessions(
                owner_id=user.get('id'),
                course_id=course_id,
                chapter_id=chapter_id,
                activity_type="ask_question",
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
            "question": request.question,
            "answer": answer
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process question: {str(e)}"
        )
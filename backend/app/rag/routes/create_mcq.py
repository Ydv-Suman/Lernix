from fastapi import APIRouter, HTTPException, status, Path
from typing import Annotated
from datetime import datetime, timezone
from app.utils.s3_helper import get_text_from_s3
from app.rag.services.create_mcq_logic import generate_mcqs

from app.models import Chapters, LearningSessions, Users, Courses, ChapterFiles
from app.routes.auth import db_dependency
from app.routes.users import user_dependency
from app.insights.services.course_time_totals_sync import update_course_time_total
router = APIRouter(
    prefix='/courses/{course_id}/chapter/{chapter_id}/files/{file_id}/createMCQ',
    tags=["RAG"]
)

@router.post('/', status_code=status.HTTP_200_OK)
def create_mcq(db:db_dependency, user:user_dependency, course_id:Annotated[int, Path(gt=0)], chapter_id:Annotated[int, Path(gt=0)], file_id:Annotated[int, Path(gt=0)]):
    if user is None:
        raise HTTPException(status_code=402, detail="Authentication Failed")
    
    file = db.query(ChapterFiles).filter(ChapterFiles.id == file_id, ChapterFiles.chapter_id == chapter_id, ChapterFiles.course_id == course_id, ChapterFiles.owner_id == user.get('id')).first()

    if file is None:
        raise HTTPException(status_code= 404, detail="file Not Found")
    
    #  Get S3 key safely from DB
    file_key = file.file_path

     # Track time spent on mcq
    session_start = datetime.now(timezone.utc)

    try:
        # 1. Get extracted text from S3
        text = get_text_from_s3(file_key)

        if not text.strip():
            raise HTTPException(
                status_code=400,
                detail="Document is empty or could not extract text"
            )

        # 2. Run ask question RAG
        mcq = generate_mcqs(text)

        # 3. Calculate duration and record learning session
        session_end = datetime.now(timezone.utc)
        duration_seconds = int((session_end - session_start).total_seconds())

        # Create learning session record
        learning_session = LearningSessions(
            owner_id=user.get('id'),
            course_id=course_id,
            chapter_id=chapter_id,
            activity_type="mcq",
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


        # 4. Return response
        return {
            "file_key": file_key,
            "MCQ": mcq
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to summarize document: {str(e)}"
        )
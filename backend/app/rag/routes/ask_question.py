from fastapi import APIRouter, status, HTTPException, Path
from typing import Annotated
from pydantic import BaseModel
from app.utils.s3_helper import get_text_from_s3
from app.rag.services.ask_question_logic import ask_question

from app.models import Users, Courses, Chapters , ChapterFiles
from app.routes.auth import db_dependency
from app.routes.users import user_dependency

router = APIRouter(
    prefix="/courses/{course_id}/chapter/{chapter_id}/files/{file_id}/ask_question",
    tags=["RAG"]
)

class QuestionRequest(BaseModel):
    question: str

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
        raise HTTPException(status_code=402, detail="Authentication Failed")
    
    file = db.query(ChapterFiles).filter(ChapterFiles.id == file_id, ChapterFiles.chapter_id == chapter_id, ChapterFiles.course_id == course_id, ChapterFiles.owner_id == user.get('id')).first()

    if file is None:
        raise HTTPException(status_code= 404, detail="file Not Found")
    
    #  Get S3 key safely from DB
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

        # 3. Return response
        return {
            "file_key": file_key,
            "question": request.question,
            "answer": answer
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process question: {str(e)}"
        )
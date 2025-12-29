from fastapi import APIRouter, HTTPException, status, Path
from typing import Annotated
from app.utils.s3_helper import get_text_from_s3
from app.rag.services.summarizer_logic import summarize_text

from app.models import Chapters, Users, Courses, ChapterFiles
from app.routes.auth import db_dependency
from app.routes.users import user_dependency


router = APIRouter(
    prefix="/courses/{course_id}/chapter/{chapter_id}/files/{file_id}/summarize", 
    tags=["RAG"])


@router.post("/", status_code=status.HTTP_200_OK)
def summarize_uploaded_file(user: user_dependency, db: db_dependency, course_id: Annotated[int, Path(gt=0)], chapter_id: Annotated[int, Path(gt=0)], file_id: Annotated[int, Path(gt=0)]):
    """ Summarize a document stored in S3 using RAG """

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

        # 2. Run RAG summarization
        summary = summarize_text(text)

        # 3. Return response
        return {
            "file_key": file_key,
            "summary": summary
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to summarize document: {str(e)}"
        )

from fastapi import APIRouter, HTTPException
from ...utils.s3_helper import get_text_from_s3
from ..services.summarizer import summarize_text

router = APIRouter(
    prefix="/summarize", 
    tags=["summarize"])


@router.post("/")
def summarize_from_s3(file_key: str):
    """
    Summarize a document stored in S3 using RAG
    """
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

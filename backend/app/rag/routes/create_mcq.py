from fastapi import APIRouter, HTTPException, status, Path, Request
from typing import Annotated, Dict
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.s3_config.s3_helper import get_text_from_s3
from app.rag.services.create_mcq_logic import generate_mcqs, parse_mcq_string

from app.models import Chapters, LearningSessions, Users, Courses, ChapterFiles, MCQAttempt
from app.routes.auth import db_dependency
from app.routes.users import user_dependency
import hashlib, json

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(
    prefix='/courses/{course_id}/chapter/{chapter_id}/files/{file_id}/createMCQ',
    tags=["RAG"]
)

# Server-side store for MCQ sessions (in production use Redis/DB)
_mcq_sessions: Dict[str, list] = {}

class MCQSubmission(BaseModel):
    answers: dict  # {question_number: selected_option} e.g., {1: "A", 2: "B"}
    time_spent_seconds: int = 0
    session_key: str = ""  # Key to retrieve server-stored questions

@router.post('/', status_code=status.HTTP_200_OK)
@limiter.limit("10/minute")
def create_mcq(request: Request, db:db_dependency, user:user_dependency, course_id:Annotated[int, Path(gt=0)], chapter_id:Annotated[int, Path(gt=0)], file_id:Annotated[int, Path(gt=0)]):
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

        # 2. Run ask question RAG
        mcq_string = generate_mcqs(text)
        
        # 3. Parse MCQ string into structured format
        questions = parse_mcq_string(mcq_string)
        
        # 4. Return questions without answers (for quiz mode)
        questions_for_quiz = []
        for q in questions:
            questions_for_quiz.append({
                "question_number": q["question_number"],
                "question": q["question"],
                "options": q["options"]
                # Intentionally exclude correct_answer and explanation
            })

        # 5. Store full questions server-side (keyed by user+file+timestamp)
        session_key = hashlib.sha256(
            f"{user.get('id')}:{file_id}:{datetime.now(timezone.utc).isoformat()}".encode()
        ).hexdigest()[:16]
        _mcq_sessions[session_key] = questions

        return {
            "file_key": file_key,
            "questions": questions_for_quiz,
            "session_key": session_key  # Client sends this back on submit
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate MCQs"
        )

@router.post('/submit', status_code=status.HTTP_200_OK)
def submit_mcq(
    db: db_dependency, 
    user: user_dependency, 
    course_id: Annotated[int, Path(gt=0)], 
    chapter_id: Annotated[int, Path(gt=0)], 
    file_id: Annotated[int, Path(gt=0)],
    submission: MCQSubmission
):
    """Submit MCQ answers and get results with score. Rate limited to prevent abuse."""
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
    
    try:
        # Retrieve server-stored questions using session key
        full_questions = _mcq_sessions.pop(submission.session_key, None)
        if not full_questions:
            raise HTTPException(
                status_code=400,
                detail="MCQ session expired or invalid. Please generate new questions."
            )
        
        # Evaluate answers
        total_questions = len(full_questions)
        correct_answers = 0
        results = []
        
        # Convert answer keys to integers if they're strings (for compatibility)
        normalized_answers = {}
        for key, value in submission.answers.items():
            try:
                int_key = int(key) if isinstance(key, str) else key
                normalized_answers[int_key] = value
            except (ValueError, TypeError):
                normalized_answers[key] = value
        
        for question in full_questions:
            q_num = question["question_number"]
            # Try both integer and string keys
            user_answer_raw = normalized_answers.get(q_num) or normalized_answers.get(str(q_num)) or normalized_answers.get(int(q_num)) or ""
            
            # Normalize user answer - ensure it's a string, uppercase, and remove all whitespace
            if user_answer_raw:
                user_answer = str(user_answer_raw).upper().strip().replace(" ", "").replace("\n", "").replace("\t", "")
            else:
                user_answer = ""
            
            # Normalize correct answer - ensure it's a string, uppercase, and remove all whitespace
            correct_answer_raw = question.get("correct_answer")
            if correct_answer_raw:
                correct_answer = str(correct_answer_raw).upper().strip().replace(" ", "").replace("\n", "").replace("\t", "")
            else:
                correct_answer = ""
            
            # Compare normalized answers (both should be uppercase strings with no whitespace now)
            # Only compare if both are non-empty and are single letters A-D
            is_correct = (
                user_answer != "" and 
                correct_answer != "" and 
                user_answer == correct_answer and
                len(user_answer) == 1 and
                user_answer in ['A', 'B', 'C', 'D']
            )
            
            if is_correct:
                correct_answers += 1
            
            results.append({
                "question_number": q_num,
                "question": question["question"],
                "options": question["options"],
                "user_answer": user_answer,
                "correct_answer": correct_answer,
                "is_correct": is_correct,
                "explanation": question.get("explanation", "")
            })
        
        # Calculate score percentage
        score_percentage = (correct_answers / total_questions * 100) if total_questions > 0 else 0
        
        # Save MCQ attempt to database
        mcq_attempt = MCQAttempt(
            owner_id=user.get('id'),
            course_id=course_id,
            chapter_id=chapter_id,
            total_questions=total_questions,
            correct_answers=correct_answers,
            score_percentage=score_percentage,
            time_spent_seconds=submission.time_spent_seconds
        )
        db.add(mcq_attempt)
        
        # Record learning session for MCQ activity if time is valid
        if submission.time_spent_seconds >= 1:
            session_end = datetime.now(timezone.utc)
            session_start = session_end - timedelta(seconds=submission.time_spent_seconds)
            
            learning_session = LearningSessions(
                owner_id=user.get('id'),
                course_id=course_id,
                chapter_id=chapter_id,
                activity_type="mcq",
                session_start=session_start,
                session_end=session_end,
                duration_seconds=submission.time_spent_seconds,
                is_valid=True,
                updated_at=session_end
            )
            db.add(learning_session)
        
        db.commit()
        
        return {
            "results": results,
            "score": {
                "correct": correct_answers,
                "total": total_questions,
                "percentage": round(score_percentage, 2)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to submit MCQs"
        )
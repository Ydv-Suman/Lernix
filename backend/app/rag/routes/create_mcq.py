from fastapi import APIRouter, HTTPException, status, Path
from typing import Annotated
from datetime import datetime, timezone
from pydantic import BaseModel
from app.utils.s3_helper import get_text_from_s3
from app.rag.services.create_mcq_logic import generate_mcqs, parse_mcq_string

from app.models import Chapters, LearningSessions, Users, Courses, ChapterFiles, MCQAttempt
from app.routes.auth import db_dependency
from app.routes.users import user_dependency
from app.insights.services.course_time_totals_sync import update_course_time_total

router = APIRouter(
    prefix='/courses/{course_id}/chapter/{chapter_id}/files/{file_id}/createMCQ',
    tags=["RAG"]
)

class MCQSubmission(BaseModel):
    answers: dict  # {question_number: selected_option} e.g., {1: "A", 2: "B"}
    time_spent_seconds: int = 0
    full_questions: list = None  # Optional: full questions data from initial response

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

        # 5. Calculate duration and record learning session
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

        # 6. Return response with questions (without answers) and store full data in session
        # Store the full questions data temporarily (in a real app, you might use Redis or session storage)
        # For now, we'll return it and the frontend will send it back on submit
        return {
            "file_key": file_key,
            "questions": questions_for_quiz,
            "full_questions": questions  # Include full data for submission
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate MCQs: {str(e)}"
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
    """Submit MCQ answers and get results with score"""
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication Failed")
    
    file = db.query(ChapterFiles).filter(
        ChapterFiles.id == file_id, 
        ChapterFiles.chapter_id == chapter_id, 
        ChapterFiles.course_id == course_id, 
        ChapterFiles.owner_id == user.get('id')
    ).first()

    if file is None:
        raise HTTPException(status_code=404, detail="File Not Found")
    
    try:
        # Use provided full_questions if available, otherwise regenerate
        if submission.full_questions and len(submission.full_questions) > 0:
            full_questions = submission.full_questions
        else:
            # Fallback: regenerate MCQs (not ideal but works)
            file_key = file.file_path
            text = get_text_from_s3(file_key)
            mcq_string = generate_mcqs(text)
            full_questions = parse_mcq_string(mcq_string)
        
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
        db.commit()
        
        return {
            "results": results,
            "score": {
                "correct": correct_answers,
                "total": total_questions,
                "percentage": round(score_percentage, 2)
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit MCQs: {str(e)}"
        )
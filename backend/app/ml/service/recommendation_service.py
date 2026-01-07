"""Recommendation Service for ML-based chapter recommendations."""

import os
import joblib
import pandas as pd
from datetime import timezone
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from app.models.chapters import Chapters
from app.models.learning_sessions import LearningSessions
from app.models.mcq_attempt import MCQAttempt


def _load_model():
    """Load the trained model and label encoder from disk."""
    MODEL_DIR = os.path.join(os.path.dirname(__file__), "../ml_model")
    MODEL_PATH = os.path.join(MODEL_DIR, "model.pkl")
    LABEL_ENCODER_PATH = os.path.join(MODEL_DIR, "label_encoder.pkl")
    
    if not os.path.exists(MODEL_PATH) or not os.path.exists(LABEL_ENCODER_PATH):
        raise FileNotFoundError("Model files not found. Please train the model first.")
    
    model = joblib.load(MODEL_PATH)
    label_encoder = joblib.load(LABEL_ENCODER_PATH)
    
    return model, label_encoder


def _fetch_latest_data_from_db(db: Session, user_id: int, course_id: int):
    """
    Fetch latest data from database.
    Returns chapters data, time data, and MCQ data.
    """
    # Fetch chapter data
    chapters_data = db.query(
        Chapters.id.label("chapter_id"),
        Chapters.chapter_title.label("chapter_name"),
        Chapters.course_id,
        Chapters.owner_id.label("user_id")
    ).filter(
        Chapters.owner_id == user_id,
        Chapters.course_id == course_id
    ).all()
    
    chapters_list = [
        {
            "chapter_id": row.chapter_id,
            "chapter_name": row.chapter_name,
            "course_id": row.course_id,
            "user_id": row.user_id
        }
        for row in chapters_data
    ]
    
    # Fetch time/activity data
    time_data = db.query(
    LearningSessions.chapter_id,
    LearningSessions.owner_id.label("user_id"),

    func.sum(
        case(
            (LearningSessions.activity_type == "view_content", LearningSessions.duration_seconds),
            else_=0
        )
    ).label("view_content"),

    func.sum(
        case(
            (LearningSessions.activity_type == "summary", LearningSessions.duration_seconds),
            else_=0
        )
    ).label("time_summary"),

    func.sum(
        case(
            (LearningSessions.activity_type == "ask_question", LearningSessions.duration_seconds),
            else_=0
        )
    ).label("time_ask"),

    func.sum(
        case(
            (LearningSessions.activity_type == "mcq", LearningSessions.duration_seconds),
            else_=0
        )
    ).label("time_mcq"),

    func.max(LearningSessions.session_end).label("last_activity")

).filter(
    LearningSessions.owner_id == user_id,
    LearningSessions.course_id == course_id,
    LearningSessions.is_valid == True
).group_by(
    LearningSessions.chapter_id,
    LearningSessions.owner_id
).all()

    
    time_list = [
        {
            "chapter_id": row.chapter_id,
            "user_id": row.user_id,
            "view_content": row.view_content or 0,
            "time_summary": row.time_summary or 0,
            "time_ask": row.time_ask or 0,
            "time_mcq": row.time_mcq or 0,
            "last_activity": row.last_activity
        }
        for row in time_data
    ]
    
    # Fetch MCQ data
    mcq_data = db.query(
        MCQAttempt.chapter_id,
        MCQAttempt.owner_id.label("user_id"),
        func.count().label("mcq_attempts"),
        func.avg(MCQAttempt.score_percentage).label("mcq_avg_score"),
        func.max(MCQAttempt.attempted_at).label("last_mcq_attempt")
    ).filter(
        MCQAttempt.owner_id == user_id,
        MCQAttempt.course_id == course_id
    ).group_by(
        MCQAttempt.chapter_id,
        MCQAttempt.owner_id
    ).all()
    
    mcq_list = [
        {
            "chapter_id": row.chapter_id,
            "user_id": row.user_id,
            "mcq_attempts": row.mcq_attempts or 0,
            "mcq_avg_score": float(row.mcq_avg_score or 0),
            "last_mcq_attempt": row.last_mcq_attempt
        }
        for row in mcq_data
    ]
    
    return chapters_list, time_list, mcq_list


def _format_time(seconds):
    """Convert seconds to a human-readable format."""
    if seconds < 60:
        return f"{seconds} seconds"
    elif seconds < 3600:
        minutes = seconds // 60
        return f"{minutes} minute{'s' if minutes != 1 else ''}"
    else:
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        if minutes > 0:
            return f"{hours} hour{'s' if hours != 1 else ''} {minutes} minute{'s' if minutes != 1 else ''}"
        return f"{hours} hour{'s' if hours != 1 else ''}"


def _generate_recommendation_message(chapter_name, mcq_avg_score, total_time, time_summary, time_ask, time_mcq, view_content, predicted_state, has_lower_score_chapters=False):
    """Generate a descriptive recommendation message for a chapter."""
    # Special handling for chapters with excellent scores (>92%)
    if mcq_avg_score > 92:
        # Calculate percentages for activity time distribution
        activity_times = {
            "Viewing Content": view_content,
            "Summarizing": time_summary,
            "Asking Questions": time_ask,
            "MCQ Practice": time_mcq
        }
        
        # Build activity breakdown message
        activity_breakdown = []
        for activity, time_sec in activity_times.items():
            if time_sec > 0:
                activity_breakdown.append(f"{activity}: {_format_time(time_sec)}")
        
        if not activity_breakdown:
            activity_breakdown_str = "No activity recorded yet."
        else:
            activity_breakdown_str = ", ".join(activity_breakdown)
        
        # Build message for excellent score chapters
        message_parts = [f"{chapter_name}"]
        message_parts.append(f"You have an excellent score of {mcq_avg_score:.1f}%")
        
        if activity_breakdown_str != "No activity recorded yet.":
            message_parts.append(f"You are spending time on: {activity_breakdown_str}")
        
        if has_lower_score_chapters:
            message_parts.append("You can reduce time spent on this chapter and allocate it to chapters with lower scores to improve your overall performance")
        else:
            message_parts.append("You can reduce time spent on this chapter as you have mastered it")
        
        return ". ".join(message_parts) + "."
    
    # Regular recommendation logic for chapters with scores <= 92%
    # Calculate percentages for activity time distribution
    activity_times = {
        "Viewing Content": view_content,
        "Summarizing": time_summary,
        "Asking Questions": time_ask,
        "MCQ Practice": time_mcq
    }
    
    # Build activity breakdown message
    activity_breakdown = []
    for activity, time_sec in activity_times.items():
        if time_sec > 0:
            activity_breakdown.append(f"{activity}: {_format_time(time_sec)}")
    
    if not activity_breakdown:
        activity_breakdown_str = "No activity recorded yet."
    else:
        activity_breakdown_str = ", ".join(activity_breakdown)
    
    # Generate suggestions based on predicted state and activity distribution
    suggestions = []
    
    if predicted_state == "revise_urgent":
        if time_mcq == 0:
            suggestions.append("Consider spending more time on MCQ practice to test your understanding")
        if time_summary == 0:
            suggestions.append("Try summarizing the content to reinforce your learning")
        if view_content == 0:
            suggestions.append("Start by reviewing the chapter content")
        if total_time < 1800:  # Less than 30 minutes
            suggestions.append("You need to spend more time overall on this chapter")
    elif predicted_state == "practice_more":
        if time_mcq < time_summary and time_mcq < time_ask:
            suggestions.append("Focus more on MCQ practice to improve your scores")
        if mcq_avg_score < 70:
            suggestions.append("Your MCQ scores suggest you need more practice")
        suggestions.append("Continue practicing to master this chapter")
    elif predicted_state == "on_track":
        suggestions.append("You're making good progress! Keep up the balanced approach")
        if time_mcq == 0:
            suggestions.append("Consider adding MCQ practice to test your knowledge")
    else:  # mastered
        suggestions.append("Great job! You've mastered this chapter")
        if time_mcq > 0:
            suggestions.append("Continue occasional practice to maintain your understanding")
    
    # Build the main message in a natural format
    message_parts = [f"{chapter_name}"]
    
    if mcq_avg_score > 0:
        message_parts.append(f"You have {mcq_avg_score:.1f}% average score on MCQs")
    else:
        message_parts.append("You haven't attempted any MCQs yet")
    
    if activity_breakdown_str != "No activity recorded yet.":
        message_parts.append(f"You are spending time on: {activity_breakdown_str}")
    else:
        message_parts.append("You haven't spent any time on this chapter yet")
    
    if suggestions:
        # Join suggestions with proper punctuation
        suggestion_text = ". ".join(suggestions)
        if not suggestion_text.endswith("."):
            suggestion_text += "."
        message_parts.append(f"Consider: {suggestion_text}")
    
    return ". ".join(message_parts) + "."


def _build_features(chapters_list, time_list, mcq_list):
    """
    Build features from raw data.
    Returns a DataFrame with features ready for model prediction.
    """
    # Convert to DataFrames
    chapters_df = pd.DataFrame(chapters_list)
    time_df = pd.DataFrame(time_list)
    mcq_df = pd.DataFrame(mcq_list)
    
    # Merge data
    df = chapters_df.merge(time_df, on=["chapter_id", "user_id"], how="left")
    df = df.merge(mcq_df, on=["chapter_id", "user_id"], how="left")
    
    # Fill missing values
    df.fillna({
        "view_content": 0,
        "time_summary": 0,
        "time_ask": 0,
        "time_mcq": 0,
        "mcq_attempts": 0,
        "mcq_avg_score": 0
    }, inplace=True)
    
    # Calculate derived features
    df["total_time"] = df["time_summary"] + df["time_ask"] + df["time_mcq"] + df["view_content"]
    df["score_efficiency"] = df["mcq_avg_score"] / (df["total_time"] + 1)
    
    # Calculate inactive_days
    now = pd.Timestamp.now(tz=timezone.utc)
    df["last_activity"] = pd.to_datetime(df["last_activity"], utc=True)
    df["inactive_days"] = (now - df["last_activity"]).dt.days
    df["inactive_days"] = df["inactive_days"].fillna(999)
    
    return df


def get_recommendations(db: Session, user_id: int, course_id: int):
    """
    RecommendationService main function.
    
    Steps:
    1. Fetch latest data from DB
    2. Build features
    3. Model.predict()
    4. Return recommendations
    
    Args:
        db: Database session
        user_id: ID of the user
        course_id: ID of the course to get recommendations for
    
    Returns:
        List of recommendations sorted by priority for chapters in the specified course
    """
    # Step 1: Fetch latest data from DB
    chapters_list, time_list, mcq_list = _fetch_latest_data_from_db(db, user_id, course_id)
    
    if not chapters_list:
        return []
    
    # Step 2: Build features
    df = _build_features(chapters_list, time_list, mcq_list)
    
    # Step 3: Model.predict()
    model, label_encoder = _load_model()
    
    # Select features for prediction
    feature_columns = ["time_summary", "time_ask", "time_mcq", "mcq_attempts", "inactive_days"]
    X = df[feature_columns]
    
    # Predict
    predictions = model.predict(X)
    predicted_states = label_encoder.inverse_transform(predictions)
    df["predicted_state"] = predicted_states
    
    # Step 4: Return recommendations
    # Map states to priority (lower number = higher priority)
    priority_map = {
        "revise_urgent": 0,
        "practice_more": 1,
        "on_track": 2,
        "mastered": 3
    }
    
    df["priority"] = df["predicted_state"].map(priority_map)
    
    # Sort by priority and inactive_days
    recommendations = df.sort_values(
        by=["priority", "inactive_days"],
        ascending=[True, False]
    )
    
    # Convert to list of dictionaries with descriptive recommendations
    # First, check if there are chapters with lower scores (for high-score chapter recommendations)
    df_scores = df[df["mcq_avg_score"] > 0]["mcq_avg_score"]
    has_lower_score_chapters = len(df_scores[df_scores < 92]) > 0 if len(df_scores) > 0 else False
    
    result = []
    for _, row in recommendations.iterrows():
        chapter_name = str(row["chapter_name"])
        mcq_avg_score = float(row["mcq_avg_score"])
        total_time = int(row["total_time"])
        time_summary = int(row["time_summary"])
        time_ask = int(row["time_ask"])
        time_mcq = int(row["time_mcq"])
        view_content = int(row["view_content"])
        predicted_state = str(row["predicted_state"])
        
        # Check if this chapter has excellent score and if there are other chapters with lower scores
        chapter_has_excellent_score = mcq_avg_score > 92
        
        # Generate descriptive recommendation message
        recommendation_message = _generate_recommendation_message(
            chapter_name=chapter_name,
            mcq_avg_score=mcq_avg_score,
            total_time=total_time,
            time_summary=time_summary,
            time_ask=time_ask,
            time_mcq=time_mcq,
            view_content=view_content,
            predicted_state=predicted_state,
            has_lower_score_chapters=has_lower_score_chapters if chapter_has_excellent_score else False
        )
        
        result.append({
            "chapter_id": int(row["chapter_id"]),
            "chapter_name": chapter_name,
            "course_id": int(row["course_id"]),
            "recommendation": recommendation_message,
            "predicted_state": predicted_state,
            "priority": int(row["priority"]),
            "inactive_days": int(row["inactive_days"])
        })
    
    return result


"""FastAPI application setup and router registration."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.models import Base
from app.database import engine
from app.routes import auth, users, courses, chapters, chapter_file
from app.rag.routes import summarize, create_mcq, ask_question
from app.insights.routes import activity_insights, total_time_insights, mcq_insights
from app.ml.route import recommendation
import os
from dotenv import load_dotenv

# Rate limiter: keyed by client IP
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS for the frontend origins
origins = os.getenv("CORS_ORIGINS", "")
origins = [o.strip() for o in origins.split(",") if o]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Create database tables if they do not exist
Base.metadata.create_all(bind=engine)


@app.get("/")
def health():
    return {"status": "ok"}
# Register route modules
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(courses.router)
app.include_router(chapters.router)
app.include_router(chapter_file.router)
app.include_router(summarize.router)
app.include_router(create_mcq.router)
app.include_router(ask_question.router)
app.include_router(activity_insights.router)
app.include_router(total_time_insights.router)
app.include_router(mcq_insights.router)
app.include_router(recommendation.router)
"""FastAPI application setup and router registration."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

from app.models import Base
from app.database import engine
from app.routes import auth, users, courses, chapters, chapter_file
from app.rag.routes import summarize, create_mcq, ask_question
from app.insights.routes import activity_insights, total_time_insights, mcq_insights

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

origins = os.getenv("CORS_ORIGINS", "").split(",")
# Filter out empty strings from origins
origins = [origin for origin in origins if origin]

app = FastAPI()

# Configure CORS for the frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint - simple health check."""
    return {"status": "ok", "message": "Lernix API is running"}


@app.get("/health")
async def health_check():
    """Health check endpoint for deployment platforms."""
    return {"status": "healthy"}


@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        # Don't raise - allow app to start even if DB init fails
        # The app will fail on first DB request, but at least it will bind to the port

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
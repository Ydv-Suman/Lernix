"""FastAPI application setup and router registration."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from model import Base
from database import engine
from routes import auth, users, courses, chapters


app = FastAPI()

# Configure CORS for the frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables if they do not exist
Base.metadata.create_all(bind=engine)

# Register route modules
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(courses.router)
app.include_router(chapters.router)
## 📘 Lernix – AI-Powered Learning Assistant

Lernix is an AI-powered learning platform that helps students organize course material, upload study resources, and use AI to summarize content, generate MCQs, and practice effectively.

It combines FastAPI, React, AWS S3, and ML/AI (RAG-ready) to create a scalable, real-world learning system.

---

## 🚀 Features (Implemented)

🔐 Authentication

User registration & login

JWT-based authentication

Protected routes (backend & frontend)

---

## 📚 Course & Chapter Management

Create, update, delete courses

Create, update, delete chapters under each course

Chapters are nested under courses (no separate chapter navigation)

---

## 📂 File Uploads (Per Chapter)

Upload PDF, DOCX, TXT files under chapters

Files stored securely in AWS S3

Metadata stored in PostgreSQL

Ownership & access control enforced via backend

---

## 🤖 AI Features

AI-generated summaries from chapter content

MCQ generation from uploaded study material

Ask question from uploaded study material

Designed to scale into RAG-based question answering

---

## 🧠 ML / AI Ready Architecture

Clean separation between:

Backend APIs

File storage (S3)

AI experimentation (Jupyter notebooks)

Ready for:

Retrieval-Augmented Generation (RAG)

Embeddings

Vector databases

Learning analytics

---

## 🏗️ Tech Stack

# Backend

FastAPI

PostgreSQL

SQLAlchemy

JWT Authentication

AWS S3 (file storage)

boto3

# Frontend

React (Vite)

Tailwind CSS

Context-based auth handling

API-driven architecture

# AI / ML

Jupyter Notebooks (.ipynb)

Planned RAG pipeline

Summarization, MCQ generation, Ask Questions

Vector-store ready design

## 📁 Project Structure

```
Lernix/
├── backend/                          # FastAPI backend application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI app entry point & router registration
│   │   ├── database.py              # SQLAlchemy database configuration
│   │   ├── model.py                 # SQLAlchemy ORM models (Users, Courses, Chapters, ChapterFiles)
│   │   │
│   │   ├── routes/                  # API route handlers
│   │   │   ├── __init__.py
│   │   │   ├── auth.py              # Authentication endpoints (login, register, JWT)
│   │   │   ├── users.py             # User management endpoints
│   │   │   ├── courses.py           # Course CRUD operations
│   │   │   ├── chapters.py          # Chapter CRUD operations
│   │   │   └── chapter_file.py      # File upload/download/delete endpoints
│   │   │
│   │   ├── ai/                      # AI/ML functionality
│   │   │   ├── ai_endpoint/         # AI API endpoints
│   │   │   │   ├── summarize.py     # Summary generation endpoint
│   │   │   │   ├── create_mcq.py    # MCQ generation endpoint
│   │   │   │   └── ask_question.py  # Q&A endpoint
│   │   │   │
│   │   │   ├── services/            # AI service logic
│   │   │   │   ├── summarizer_logic.py      # Summary generation logic
│   │   │   │   ├── create_mcq_logic.py      # MCQ generation logic
│   │   │   │   ├── ask_question_logic.py    # Q&A RAG logic
│   │   │   │   └── document_processing.py   # Document text extraction
│   │   │   │
│   │   │   └── notebook/            # Jupyter notebooks for AI experimentation
│   │   │       ├── summarizer.ipynb
│   │   │       ├── create_mcq.ipynb
│   │   │       ├── ask_question.ipynb
│   │   │       └── data/            # Sample documents for testing
│   │   │
│   │   ├── utils/                   # Utility functions
│   │   │   ├── __init_.py
│   │   │   └── s3_helper.py         # AWS S3 file operations (upload, download, delete)
│   │   │
│   │   └── test/                    # Test files
│   │       ├── __init__.py
│   │       └── test_database.py
│   │
│   ├── requirements.txt             # Python dependencies (FastAPI, SQLAlchemy, etc.)
│   ├── requirement-ai.txt          # AI/ML specific dependencies
│   └── venv/                        # Python virtual environment
│
├── frontend/                        # React frontend application
│   ├── src/
│   │   ├── main.jsx                 # React app entry point
│   │   ├── App.jsx                  # Main app component & routing
│   │   ├── App.css                  # Global styles
│   │   │
│   │   ├── components/              # React components
│   │   │   ├── NavBar.jsx           # Navigation bar component
│   │   │   ├── Login.jsx            # Login page
│   │   │   ├── Register.jsx         # Registration page
│   │   │   ├── Courses.jsx          # Course management page
│   │   │   ├── chapters.jsx         # Chapter management page
│   │   │   └── ProtectedRoute.jsx   # Route protection wrapper
│   │   │
│   │   ├── context/                 # React context providers
│   │   │   └── AuthContext.jsx      # Authentication context
│   │   │
│   │   └── services/                # API service layer
│   │       └── api.js               # Axios API client & endpoints
│   │
│   ├── package.json                 # Node.js dependencies
│   ├── vite.config.js              # Vite build configuration
│   └── index.html                   # HTML entry point
│
└── README.md                        # Project documentation
```

## 🔄 Core Data Flow

```
User
 └── Course
     └── Chapter
         └── Files (PDF / DOCX / TXT)
             ├── Stored in AWS S3
             └── Metadata in MySQL
```

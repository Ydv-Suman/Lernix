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

## 📂 File Management (Per Chapter)

Upload PDF, DOCX, TXT files under chapters

Files stored securely in AWS S3

Metadata stored in PostgreSQL

Ownership & access control enforced via backend

**View File Content**: Click "View Content" button to see extracted text from PDF, DOCX, TXT files in a modal popup

**Delete Files**: Click "Delete" button with confirmation dialog to remove files from S3 and database

---

## 🤖 AI Features

AI-generated summaries from chapter content

MCQ generation from uploaded study material

Ask question from uploaded study material

Designed to scale into RAG-based question answering

---

## 📊 Learning Insights & Analytics

Track total time spent per course

Activity time tracking (summary, MCQ, Q&A sessions)

MCQ attempts and performance insights

Visual dashboard for learning analytics

ML-based chapter recommendations (prioritized by learning status)

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

RAG pipeline implementation

Summarization, MCQ generation, Ask Questions

ML-based chapter recommendations (scikit-learn)

Vector-store ready design (ChromaDB, FAISS)

## 📁 Project Structure

```
Lernix/
├── backend/                          # FastAPI backend application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI app entry point & router registration
│   │   ├── database.py              # SQLAlchemy database configuration
│   │   │
│   │   ├── models/                  # SQLAlchemy ORM models (one file per model)
│   │   │   ├── __init__.py          # Exports all models
│   │   │   ├── users.py             # Users model
│   │   │   ├── courses.py           # Courses model
│   │   │   ├── chapters.py          # Chapters model
│   │   │   ├── chapter_files.py     # ChapterFiles model
│   │   │   ├── learning_sessions.py # LearningSessions model
│   │   │   └── mcq_attempt.py       # MCQAttempt model
│   │   │
│   │   ├── routes/                  # API route handlers
│   │   │   ├── __init__.py
│   │   │   ├── auth.py              # Authentication endpoints (login, register, JWT)
│   │   │   ├── users.py             # User management endpoints
│   │   │   ├── courses.py           # Course CRUD operations
│   │   │   ├── chapters.py          # Chapter CRUD operations
│   │   │   └── chapter_file.py      # File upload/view content/delete endpoints
│   │   │
│   │   ├── rag/                     # RAG/AI/ML functionality
│   │   │   ├── routes/              # RAG API endpoints
│   │   │   │   ├── __init_.py       # Note: actual filename (typo in codebase)
│   │   │   │   ├── summarize.py     # Summary generation endpoint
│   │   │   │   ├── create_mcq.py    # MCQ generation endpoint
│   │   │   │   └── ask_question.py  # Q&A endpoint
│   │   │   │
│   │   │   ├── services/            # RAG service logic
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
│   │   │           └── Interpersonal_Communication_with_Strangers.pdf
│   │   │
│   │   ├── insights/                # Learning insights & analytics
│   │   │   ├── __init__.py
│   │   │   ├── routes/              # Insights API endpoints
│   │   │   │   ├── activity_insights.py      # Activity time tracking endpoints
│   │   │   │   ├── mcq_insights.py           # MCQ attempts insights endpoints
│   │   │   │   └── total_time_insights.py    # Total time spent endpoints
│   │   │   └── services/            # Insights service logic
│   │   │       ├── activity_time_tracker.py  # Activity time tracking logic
│   │   │       └── total_time_spent.py       # Total time calculation logic
│   │   │
│   │   ├── ml/                      # Machine Learning functionality
│   │   │   ├── __init__.py
│   │   │   ├── route/               # ML API endpoints
│   │   │   │   ├── __init__.py
│   │   │   │   └── recommendation.py        # Chapter recommendation endpoint
│   │   │   ├── service/             # ML service logic
│   │   │   │   ├── __init__.py
│   │   │   │   └── recommendation_service.py # ML recommendation logic
│   │   │   ├── ml_model/            # Trained ML models
│   │   │   │   ├── model.pkl        # Scikit-learn model
│   │   │   │   └── label_encoder.pkl # Label encoder
│   │   │   └── notebook/            # Jupyter notebooks for ML experimentation
│   │   │       └── model.ipynb      # ML model training notebook
│   │   │
│   │   ├── s3_config/               # AWS S3 configuration
│   │   │   ├── __init_.py
│   │   │   └── s3_helper.py         # AWS S3 file operations (upload, download, delete, text extraction)
│   │
│   └── requirements.txt             # Python dependencies (FastAPI, SQLAlchemy, AI/ML libraries, etc.)
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
│   │   │   ├── ProtectedRoute.jsx   # Route protection wrapper
│   │   │   ├── About.jsx            # About page
│   │   │   ├── course/              # Course-related components
│   │   │   │   ├── Courses.jsx      # Course management page
│   │   │   │   ├── chapters.jsx     # Chapter management page (with file upload/view/delete)
│   │   │   │   └── chapters/        # Chapter feature components
│   │   │   │       ├── Summarize.jsx      # AI summary generation UI
│   │   │   │       ├── create-mcq.jsx     # MCQ generation UI
│   │   │   │       └── ask-questions.jsx  # Q&A interface UI
│   │   │   └── insights/            # Insights components
│   │   │       └── insights.jsx     # Learning insights & analytics dashboard (includes ML recommendations)
│   │   │
│   │   ├── context/                 # React context providers
│   │   │   └── AuthContext.jsx      # Authentication context
│   │   │
│   │   └── services/                # API service layer
│   │       └── api.js               # Axios API client & endpoints
│   │
│   ├── package.json                 # Node.js dependencies (React, Vite, Tailwind, Recharts, etc.)
│   ├── vite.config.js              # Vite build configuration
│   ├── eslint.config.js            # ESLint configuration
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
             └── Metadata in PostgreSQL
```

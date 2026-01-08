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
│   │   ├── models/                  # SQLAlchemy ORM models
│   │   │   ├── __init__.py
│   │   │   ├── users.py
│   │   │   ├── courses.py
│   │   │   ├── chapters.py
│   │   │   ├── chapter_files.py
│   │   │   ├── learning_sessions.py
│   │   │   └── mcq_attempt.py
│   │   │
│   │   ├── routes/                  # API route handlers
│   │   │   ├── __init__.py
│   │   │   ├── auth.py              # Authentication endpoints
│   │   │   ├── users.py             # User management
│   │   │   ├── courses.py           # Course CRUD
│   │   │   ├── chapters.py          # Chapter CRUD
│   │   │   └── chapter_file.py      # File operations
│   │   │
│   │   ├── rag/                     # RAG/AI functionality
│   │   │   ├── routes/              # RAG API endpoints
│   │   │   │   ├── __init_.py
│   │   │   │   ├── summarize.py
│   │   │   │   ├── create_mcq.py
│   │   │   │   └── ask_question.py
│   │   │   ├── services/            # RAG service logic
│   │   │   │   ├── summarizer_logic.py
│   │   │   │   ├── create_mcq_logic.py
│   │   │   │   ├── ask_question_logic.py
│   │   │   │   └── document_processing.py
│   │   │   └── notebook/            # Jupyter notebooks
│   │   │       ├── summarizer.ipynb
│   │   │       ├── create_mcq.ipynb
│   │   │       ├── ask_question.ipynb
│   │   │       └── data/
│   │   │
│   │   ├── insights/                # Learning insights & analytics
│   │   │   ├── __init__.py
│   │   │   ├── routes/              # Insights API endpoints
│   │   │   │   ├── activity_insights.py
│   │   │   │   ├── mcq_insights.py
│   │   │   │   └── total_time_insights.py
│   │   │   └── services/            # Insights service logic
│   │   │       ├── activity_time_tracker.py
│   │   │       └── total_time_spent.py
│   │   │
│   │   ├── ml/                      # Machine Learning functionality
│   │   │   ├── __init__.py
│   │   │   ├── route/               # ML API endpoints
│   │   │   │   ├── __init__.py
│   │   │   │   └── recommendation.py
│   │   │   ├── service/             # ML service logic
│   │   │   │   ├── __init__.py
│   │   │   │   └── recommendation_service.py
│   │   │   ├── ml_model/            # Trained ML models
│   │   │   │   ├── model.pkl
│   │   │   │   └── label_encoder.pkl
│   │   │   └── notebook/
│   │   │       └── model.ipynb
│   │   │
│   │   └── s3_config/               # AWS S3 configuration
│   │       ├── __init_.py
│   │       └── s3_helper.py
│   │
│   ├── Dockerfile                   # Backend Docker configuration
│   └── requirements.txt             # Python dependencies
│
├── frontend/                        # React frontend application
│   ├── src/
│   │   ├── main.jsx                 # React app entry point
│   │   ├── App.jsx                  # Main app component & routing
│   │   ├── App.css
│   │   │
│   │   ├── components/              # React components
│   │   │   ├── NavBar.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── About.jsx
│   │   │   ├── course/
│   │   │   │   ├── Courses.jsx
│   │   │   │   ├── chapters.jsx
│   │   │   │   └── chapters/
│   │   │   │       ├── Summarize.jsx
│   │   │   │       ├── create-mcq.jsx
│   │   │   │       └── ask-questions.jsx
│   │   │   └── insights/
│   │   │       └── insights.jsx
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   │
│   │   └── services/
│   │       └── api.js
│   │
│   ├── Dockerfile                   # Frontend Docker configuration
│   ├── package.json
│   ├── vite.config.js
│   ├── eslint.config.js
│   └── index.html
│
├── docker-compose.yaml              # Docker Compose configuration
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

## 🐳 Running with Docker

### Quick Start (Using Pre-built Images)

The easiest way to run Lernix is using the pre-built Docker images from Docker Hub.

#### Step 1: Run Backend

Open a terminal and run:

```bash
# Pull the backend image
docker pull sumanydv/lernix-backend

# Run the backend container
docker run -p 8000:8000 sumanydv/lernix-backend
```

The backend API will be available at: **http://localhost:8000**

#### Step 2: Run Frontend

Open a **new terminal** and run:

```bash
# Pull the frontend image
docker pull sumanydv/lernix-frontend

# Run the frontend container
docker run -p 5173:5173 sumanydv/lernix-frontend
```

The frontend application will be available at: **http://localhost:5173**

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### Demo Credentials

You can use the following demo account to test the application:

- **Email**: `suman@gmail.com`
- **Password**: `suman123`

Or create your own account by registering through the application.

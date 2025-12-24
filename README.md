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

Summarization & MCQ generation

Vector-store ready design

## 🔄 Core Data Flow
```
User
 └── Course
     └── Chapter
         └── Files (PDF / DOCX / TXT)
             ├── Stored in AWS S3
             └── Metadata in MySQL
```

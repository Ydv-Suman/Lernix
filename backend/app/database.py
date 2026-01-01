"""SQLAlchemy engine, session, and declarative base setup."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from urllib.parse import quote_plus
import os
import logging
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

load_dotenv()

# Priority: Use Neon URL for production, fall back to MySQL for local development
NEON_URL = os.getenv('NEON_URL')

if NEON_URL:
    # Production: Use Neon PostgreSQL database
    SQLALCHEMY_DATABASE_URL = NEON_URL
    logger.info("Using Neon PostgreSQL database (production)")
else:
    # Local development: Use MySQL
    DB_USER = os.getenv('DB_USER')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_HOST = os.getenv('DB_HOST')
    DB_PORT = os.getenv('DB_PORT', '3306')  # Default MySQL port
    DB_NAME = os.getenv('DB_NAME')
    
    # Validate required MySQL configuration
    if not all([DB_USER, DB_HOST, DB_NAME]):
        missing = [var for var, val in [('DB_USER', DB_USER), ('DB_HOST', DB_HOST), ('DB_NAME', DB_NAME)] if not val]
        logger.warning(f"Missing MySQL database environment variables: {', '.join(missing)}")
        # Fallback to a dummy URL - will fail on first use, but allows app to start
        SQLALCHEMY_DATABASE_URL = "mysql+pymysql://user:pass@localhost:3306/dbname"
        logger.warning("Using dummy MySQL database URL - database operations will fail until proper credentials are set")
    else:
        # Safely encode special characters in the password for the connection string
        encoded_password = quote_plus(DB_PASSWORD or '')
        SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        logger.info("Using MySQL database (local development)")

# Add connection pool settings for better reliability
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before using them
    pool_recycle=300,    # Recycle connections after 5 minutes
    echo=False
)

# Session factory for request-scoped database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for ORM models
Base = declarative_base()
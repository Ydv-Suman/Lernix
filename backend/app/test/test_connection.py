from sqlalchemy import text
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_path))

from app.database import engine


def test_database_connection():
    """Test database connection and verify MySQL version and database name."""
    try:
        with engine.connect() as connection:
            # Test MySQL version
            result = connection.execute(text("SELECT VERSION()"))
            version_row = result.fetchone()
            assert version_row is not None and len(version_row) > 0, "Could not fetch MySQL version."
            print(f"Connected to MySQL version: {version_row[0]}")

            # Check current database
            result = connection.execute(text("SELECT DATABASE()"))
            db_row = result.fetchone()
            db_name = db_row[0] if db_row and len(db_row) > 0 else None
            print(f"Current database: {db_name}")
            assert db_name is not None, "Could not determine current database."
    except Exception as e:
        print(f"Connection failed: {e}")
        raise
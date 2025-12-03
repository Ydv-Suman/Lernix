"""
Migration script to add hashed_password column to users table
Run this script once to update your database schema.
"""
from sqlalchemy import text
from database import engine

def add_password_column():
    """Add hashed_password column to users table if it doesn't exist"""
    with engine.connect() as conn:
        # Check if column exists
        result = conn.execute(text("""
            SELECT COUNT(*) as count
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'users'
            AND COLUMN_NAME = 'hashed_password'
        """))
        
        column_exists = result.fetchone()[0] > 0
        
        if not column_exists:
            print("Adding hashed_password column to users table...")
            conn.execute(text("""
                ALTER TABLE users
                ADD COLUMN hashed_password VARCHAR(255) NULL
            """))
            conn.commit()
            print("✓ Successfully added hashed_password column")
        else:
            print("hashed_password column already exists")
        
        # Optionally, you might want to make it NOT NULL after adding
        # But for now, we'll leave it nullable to avoid breaking existing records

if __name__ == "__main__":
    add_password_column()


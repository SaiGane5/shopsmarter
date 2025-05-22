import sqlite3
import os

# Ensure the data directory exists
os.makedirs('data', exist_ok=True)

# Database file path
DB_FILE = 'data/shopsmarter.db'

def init_db():
    """Initialize the database with tables."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Create the products table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        brand TEXT,
        category TEXT,
        price REAL NOT NULL,
        image_url TEXT,
        embedding BLOB
    )
    ''')
    
    # Create the users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        preferences TEXT
    )
    ''')
    
    conn.commit()
    conn.close()
    print("Database initialized successfully!")

if __name__ == '__main__':
    init_db()

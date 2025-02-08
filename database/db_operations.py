"""Database operations for user management"""
import psycopg2
from psycopg2.extras import RealDictCursor
from werkzeug.security import generate_password_hash, check_password_hash
from .config import get_db_url

def get_db_connection():
    """Create a database connection"""
    return psycopg2.connect(get_db_url(), cursor_factory=RealDictCursor)

def create_user(email, password):
    """Create a new user"""
    # Hash the password for security
    password_hash = generate_password_hash(password)
    
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Insert new user
        cur.execute(
            'INSERT INTO users (email, password_hash) VALUES (%s, %s) RETURNING id',
            (email, password_hash)
        )
        user_id = cur.fetchone()['id']
        conn.commit()
        return user_id
    except psycopg2.Error as e:
        conn.rollback()
        # If email already exists
        if 'unique constraint' in str(e).lower():
            raise ValueError("Email already registered")
        raise e
    finally:
        cur.close()
        conn.close()

def verify_user(email, password):
    """Verify user credentials"""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute('SELECT * FROM users WHERE email = %s', (email,))
        user = cur.fetchone()
        
        if user and check_password_hash(user['password_hash'], password):
            return user['id']
        return None
    finally:
        cur.close()
        conn.close()

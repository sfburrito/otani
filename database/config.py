"""Database configuration settings"""

# For local development
DB_CONFIG = {
    'dbname': 'otani_db',
    'user': 'postgres',  # default PostgreSQL user
    'password': 'UBCsauder308!',      # Add your database password here
    'host': 'localhost',
    'port': '5432'      # default PostgreSQL port
}

# For production on Render
def get_db_url():
    """Get database URL from environment or use local config"""
    import os
    return os.getenv('DATABASE_URL', 
        f"postgresql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['dbname']}"
    )

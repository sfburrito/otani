from sqlalchemy import create_engine, inspect
import os

# Database URL
DATABASE_URL = "postgresql://otani_w4hb_user:FMYLV2IFItlUC3q1k3ATBoUcOK9xou14@dpg-cu1842rqf0us73d8sm00-a.oregon-postgres.render.com/otani_w4hb"

# Create engine
engine = create_engine(DATABASE_URL)

# Get inspector
inspector = inspect(engine)

# Check user_preferences table
print("\n=== user_preferences table schema ===")
columns = inspector.get_columns('user_preferences')
for column in columns:
    print(f"Column: {column['name']}, Type: {column['type']}")

# Show table contents
with engine.connect() as conn:
    print("\n=== user_preferences table contents ===")
    result = conn.execute("SELECT * FROM user_preferences;")
    rows = result.fetchall()
    for row in rows:
        print(f"\nRow ID: {row[0]}")
        for idx, col in enumerate(result.keys()):
            print(f"{col}: {row[idx]}")

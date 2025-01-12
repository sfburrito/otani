from sqlalchemy import create_engine, text

# Database URL
DATABASE_URL = "postgresql://otani_w4hb_user:FMYLV2IFItlUC3q1k3ATBoUcOK9xou14@dpg-cu1842rqf0us73d8sm00-a.oregon-postgres.render.com/otani_w4hb"

# Create engine
engine = create_engine(DATABASE_URL)

# SQL to add new columns
sql = """
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS industry_sectors VARCHAR(500),
ADD COLUMN IF NOT EXISTS investment_sizes VARCHAR(500);
"""

# Execute the SQL
with engine.begin() as conn:
    conn.execute(text(sql))
    print("Schema updated successfully!")

from sqlalchemy import create_engine, text

# Database URL
DATABASE_URL = "postgresql://otani_w4hb_user:FMYLV2IFItlUC3q1k3ATBoUcOK9xou14@dpg-cu1842rqf0us73d8sm00-a.oregon-postgres.render.com/otani_w4hb"

# Create engine
engine = create_engine(DATABASE_URL)

# Delete existing preferences
with engine.begin() as conn:
    conn.execute(text("DELETE FROM user_preferences;"))
    print("All preferences have been deleted. They will be recreated when you save preferences next.")

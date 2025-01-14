"""add otani rating column

Revision ID: 202401141712
Revises: 
Create Date: 2024-01-14 17:12:21.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '202401141712'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add otani_rating column to company table if it doesn't exist
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name='company' 
                AND column_name='otani_rating'
            ) THEN
                ALTER TABLE company ADD COLUMN otani_rating VARCHAR(1);
                UPDATE company SET otani_rating = 'D' WHERE otani_rating IS NULL;
            END IF;
        END $$;
    """)


def downgrade():
    # Remove otani_rating column from company table if it exists
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name='company' 
                AND column_name='otani_rating'
            ) THEN
                ALTER TABLE company DROP COLUMN otani_rating;
            END IF;
        END $$;
    """)

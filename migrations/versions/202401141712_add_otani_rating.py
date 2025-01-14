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
    # Add otani_rating column to company table
    op.add_column('company', sa.Column('otani_rating', sa.String(1), nullable=True))
    
    # Update existing records to have a default 'D' rating
    op.execute("UPDATE company SET otani_rating = 'D' WHERE otani_rating IS NULL")


def downgrade():
    # Remove otani_rating column from company table
    op.drop_column('company', 'otani_rating')

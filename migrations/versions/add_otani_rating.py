"""Add otani_rating column

Revision ID: add_otani_rating
Revises: 
Create Date: 2025-01-14 16:55:49.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_otani_rating'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add otani_rating column to company table
    op.add_column('company', sa.Column('otani_rating', sa.String(1), nullable=True))


def downgrade():
    # Remove otani_rating column from company table
    op.drop_column('company', 'otani_rating')

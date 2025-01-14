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
    op.execute('ALTER TABLE company ADD COLUMN IF NOT EXISTS otani_rating VARCHAR(1)')
    op.execute("UPDATE company SET otani_rating = 'D' WHERE otani_rating IS NULL")


def downgrade():
    op.execute('ALTER TABLE company DROP COLUMN IF EXISTS otani_rating')

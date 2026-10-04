"""fix users created_at default

Revision ID: 365e69631458
Revises: d640a391e285
Create Date: 2026-10-03 12:40:19.078683

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "365e69631458"
down_revision: str | Sequence[str] | None = "d640a391e285"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column("users", "created_at", server_default=sa.text("now()"))


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column("users", "created_at", server_default=None)

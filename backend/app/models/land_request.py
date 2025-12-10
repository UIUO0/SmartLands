from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.mysql import BIGINT, DECIMAL
from sqlalchemy import (
    BigInteger,
    Integer,
    ForeignKey,
    Enum,
    TIMESTAMP,
    text,
)

from app.db.database import Base


class LandRequest(Base):
    __tablename__ = "requests"

    request_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )

    land_id: Mapped[int] = mapped_column(
        BIGINT(unsigned=True),
        ForeignKey("lands.land_id", ondelete="CASCADE"),
        nullable=False,
    )

    from_user_id: Mapped[int] = mapped_column(
        BIGINT(unsigned=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
    )

    to_user_id: Mapped[int] = mapped_column(
        BIGINT(unsigned=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
    )

    amount: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False)

    status: Mapped[str] = mapped_column(
        Enum("pending", "accepted", "rejected", name="request_status_enum"),
        nullable=False,
        default="pending",
    )

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=text("CURRENT_TIMESTAMP")
    )

    # Relationships
    land = relationship("Land", backref="requests")
    # Relationships
    land = relationship("Land", backref="requests")
    from_user = relationship("User", foreign_keys=[from_user_id], backref="sent_requests")
    to_user = relationship("User", foreign_keys=[to_user_id], backref="received_requests")

    def __repr__(self) -> str:
        return f"<LandRequest id={self.request_id} land={self.land_id} from={self.from_user_id} to={self.to_user_id} status={self.status}>"

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Mapped, mapped_column, relationship
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
    __tablename__ = "land_requests"

    request_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )

    land_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("lands.land_id", ondelete="CASCADE"),
        nullable=False,
    )

    buyer_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
    )

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
    buyer = relationship("User", backref="sent_requests")

    def __repr__(self) -> str:
        return f"<LandRequest id={self.request_id} land={self.land_id} buyer={self.buyer_id} status={self.status}>"

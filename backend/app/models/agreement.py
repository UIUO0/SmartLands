from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.mysql import BIGINT, DECIMAL
from sqlalchemy import (
    Integer,
    ForeignKey,
    Enum,
    TIMESTAMP,
    text,
)

from app.db.database import Base


class Agreement(Base):
    __tablename__ = "agreements"

    agreement_id: Mapped[int] = mapped_column(
        BIGINT(unsigned=True), primary_key=True, autoincrement=True
    )

    land_id: Mapped[int] = mapped_column(
        BIGINT(unsigned=True),
        ForeignKey("lands.land_id", ondelete="CASCADE"),
        nullable=False,
    )

    buyer_user_id: Mapped[int] = mapped_column(
        BIGINT(unsigned=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
    )

    seller_user_id: Mapped[int] = mapped_column(
        BIGINT(unsigned=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
    )

    request_id: Mapped[int] = mapped_column(
        BIGINT(unsigned=True),
        ForeignKey("land_requests.request_id", ondelete="CASCADE"),
        nullable=False,
    )

    agreed_amount: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False)

    status: Mapped[str] = mapped_column(
        Enum("pending", "completed", "cancelled", name="agreement_status_enum"),
        nullable=False,
        default="pending",
    )

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=text("CURRENT_TIMESTAMP")
    )

    confirmed_at: Mapped[Optional[datetime]] = mapped_column(
        TIMESTAMP, nullable=True
    )

    cancelled_at: Mapped[Optional[datetime]] = mapped_column(
        TIMESTAMP, nullable=True
    )

    # Relationships
    land = relationship("Land", backref="agreements")
    buyer = relationship("User", foreign_keys=[buyer_user_id], backref="buyer_agreements")
    seller = relationship("User", foreign_keys=[seller_user_id], backref="seller_agreements")
    request = relationship("LandRequest", backref="agreement")

    def __repr__(self) -> str:
        return f"<Agreement id={self.agreement_id} land={self.land_id} status={self.status}>"

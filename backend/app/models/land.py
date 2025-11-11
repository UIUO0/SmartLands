from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import (
    String,
    Text,
    Enum,
    DECIMAL,
    TIMESTAMP,
    text,
    BigInteger,
    CHAR,
    ForeignKey,
)

from app.db.database import Base


class Land(Base):
    __tablename__ = "lands"

    land_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )

    # may be NULL قبل البيع
    owner_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("users.user_id", onupdate="CASCADE", ondelete="SET NULL"),
        nullable=True,
    )

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    price_amount: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False)

    status: Mapped[str] = mapped_column(
        Enum("available", "reserved", "sold", "archived", name="land_status_enum"),
        nullable=False,
        default="available",
    )

    area_sq_m: Mapped[Optional[float]] = mapped_column(
        DECIMAL(12, 2), nullable=True
    )

    address_line: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    region: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(CHAR(2), nullable=True)
    postal_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    latitude: Mapped[Optional[float]] = mapped_column(DECIMAL(9, 6), nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(DECIMAL(9, 6), nullable=True)
    google_place_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )

    cover_image_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
        server_onupdate=text("CURRENT_TIMESTAMP"),
    )

    # 🔥 العلاقة مع الصور (هذا اللي كان ناقص)
    images: Mapped[List["LandImage"]] = relationship(
        "LandImage",
        back_populates="land",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Land id={self.land_id} title={self.title!r}>"

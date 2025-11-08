# app/models/land_image.py
from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class LandImage(Base):
    __tablename__ = "land_images"

    image_id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )

    land_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("lands.land_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # URL stored in DB (Cloudinary secure_url)
    file_url: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    # tinyint(1) in MySQL → Boolean في SQLAlchemy
    is_cover: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("0"),
    )

    sort_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default=text("0"),
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
        server_onupdate=text("CURRENT_TIMESTAMP"),
    )

    def __repr__(self) -> str:
        return (
            f"<LandImage id={self.image_id} land_id={self.land_id} "
            f"is_cover={self.is_cover} sort_order={self.sort_order}>"
        )

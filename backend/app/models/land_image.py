from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import (
    BigInteger,
    String,
    Integer,
    LargeBinary,
    Enum,
    Boolean,
    DateTime,
    Text,
    text,
    ForeignKey,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class LandImage(Base):
    __tablename__ = "land_images"

    image_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    land_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("lands.land_id"),
        nullable=False,
        index=True,
    )

    # في الـ dump كان فيه enum storage_kind ('db','url') default 'url'
    storage_kind: Mapped[str] = mapped_column(
        Enum("db", "url", name="land_image_storage_kind"),
        nullable=False,
        server_default="url",
    )

    # لو storage_kind = 'url' نستخدم هذا
    file_url: Mapped[Optional[str]] = mapped_column(
        String(1024),
        nullable=True,
    )

    # لو storage_kind = 'db' نقدر نخزّن الباينري هنا (غير مستخدم حاليًا)
    file_data: Mapped[Optional[bytes]] = mapped_column(
        LargeBinary,
        nullable=True,
    )

    # هذين هم الأعمدة اللي سببوا الخطأ (NOT NULL في الداتا بيس)
    file_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    mime_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    size_bytes: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        nullable=True,
    )

    width: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )

    height: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )

    sha256_hex: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
    )

    is_cover: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="0",
    )

    sort_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default="0",
    )

    alt_text: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    # علاقة اختيارية لو حاب تستخدمها
    land = relationship("Land", back_populates="images", lazy="joined", viewonly=True)

    def __repr__(self) -> str:
        return f"<LandImage id={self.image_id} land_id={self.land_id} file_name={self.file_name!r}>"

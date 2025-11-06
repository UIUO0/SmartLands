from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy import String, Enum, text, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # مهم: هذا الحقل لازم يكون موجود لكي يعمل الـ login
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    # أدوار بسيطة
    role: Mapped[str] = mapped_column(
        Enum("user", "admin", name="user_role"),
        nullable=False,
        default="user",
        server_default="user",
    )

    picture_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
        server_onupdate=text("CURRENT_TIMESTAMP"),
    )

    # علاقات (اختياري إذا كنت تحتاجها لاحقًا)
    # lands: Mapped[List["Land"]] = relationship("Land", back_populates="owner")

    def __repr__(self) -> str:
        return f"<User id={self.user_id} email={self.email} role={self.role}>"

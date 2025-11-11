from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import String, Enum, text, DateTime, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    full_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    # مافي عمود باسوورد في جدول users
    # الباسوورد مخزون في جدول auth_identities.password_hash

    picture_url: Mapped[Optional[str]] = mapped_column(
        String(512),
        nullable=True,
    )

    role: Mapped[str] = mapped_column(
        Enum("user", "admin", name="user_role"),
        nullable=False,
        server_default="user",
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("1"),
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
        return f"<User id={self.user_id} email={self.email} role={self.role}>"
# app/models/user.py
email_verifications = relationship("EmailVerification", back_populates="user")
# app/models/user.py
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"

    # ... الأعمدة الموجودة أصلاً ...

    email_verifications = relationship(
        "EmailVerification",
        back_populates="user",
        lazy="selectin"
    )


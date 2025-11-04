from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Enum, TIMESTAMP, text, BigInteger, ForeignKey
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    picture_url: Mapped[str | None] = mapped_column(String(512))
    role: Mapped[str] = mapped_column(Enum("user", "admin", name="role_enum"), default="user", nullable=False)
    is_active: Mapped[int] = mapped_column(nullable=False, default=1)

    created_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    updated_at: Mapped[str] = mapped_column(
        TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"), server_onupdate=text("CURRENT_TIMESTAMP")
    )

    identities: Mapped[list["AuthIdentity"]] = relationship("AuthIdentity", back_populates="user", cascade="all,delete")

class AuthIdentity(Base):
    __tablename__ = "auth_identities"

    identity_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)

    # provider: 'password' | 'google'
    provider: Mapped[str] = mapped_column(Enum("password", "google", name="provider_enum"), nullable=False)
    provider_user_id: Mapped[str | None] = mapped_column(String(191))   # Google sub
    provider_email: Mapped[str | None] = mapped_column(String(255))
    password_hash: Mapped[str | None] = mapped_column(String(255))      # للـ password فقط
    email_verified: Mapped[int] = mapped_column(nullable=False, default=0)

    last_login_at: Mapped[str | None] = mapped_column(TIMESTAMP)
    created_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

    user: Mapped["User"] = relationship("User", back_populates="identities")

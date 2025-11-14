# app/models/auth_identity.py
from sqlalchemy import Column, Integer, String, ForeignKey, Enum, BigInteger
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum


class AuthProvider(str, enum.Enum):
    password = "password"
    google = "google"
    github = "github"


class AuthIdentity(Base):
    __tablename__ = "auth_identities"

    identity_id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(
        BigInteger,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    provider = Column(
        Enum(AuthProvider),
        nullable=False,
        default=AuthProvider.password,
    )

    # موجود في الجدول حسب CREATE TABLE
    provider_user_id = Column(String(191), nullable=True)

    # للباسوورد المحلي (password provider)
    password_hash = Column(String(255), nullable=True)

    user = relationship("User", back_populates="auth_identities", lazy="joined")

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

    # مطابق لعمود identity_id bigint unsigned AUTO_INCREMENT في الـ DB
    identity_id = Column(BigInteger, primary_key=True, autoincrement=True)

    # مطابق لعمود user_id bigint unsigned NOT NULL
    user_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)

    # مطابق لـ provider enum('password','google', ...)
    provider = Column(Enum(AuthProvider), nullable=False, default=AuthProvider.password)

    # موجود عندك في الجدول حسب الـ snippet (provider_user_id ...)
    provider_user_id = Column(String(191), nullable=True)

    # الباقي حسب ما صممناه سابقًا – أغلب الظن أنها أعمدة موجودة عندك أصلًا
    password_hash = Column(String(255), nullable=True)
    access_token = Column(String(512), nullable=True)
    refresh_token = Column(String(512), nullable=True)

    user = relationship("User", back_populates="auth_identities", lazy="joined")

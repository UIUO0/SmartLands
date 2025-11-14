# app/models/auth_identity.py
from sqlalchemy import Column, Integer, String, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum


class AuthProvider(str, enum.Enum):
    password = "password"
    google = "google"
    github = "github"


class AuthIdentity(Base):
    __tablename__ = "auth_identities"

    # نربط الـ attribute auth_identity_id بعمود اسمه "id" في الـ DB
    auth_identity_id = Column("id", Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"))
    provider = Column(Enum(AuthProvider), nullable=False, default=AuthProvider.password)
    password_hash = Column(String(255), nullable=True)
    access_token = Column(String(512), nullable=True)
    refresh_token = Column(String(512), nullable=True)

    # العلاقة مع المستخدم
    user = relationship("User", back_populates="auth_identities", lazy="joined")

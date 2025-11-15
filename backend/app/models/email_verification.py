# app/models/email_verification.py
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, BigInteger, func
from sqlalchemy.orm import relationship
from app.db.database import Base


class EmailVerification(Base):
    __tablename__ = "email_verifications"

    verification_id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="SET NULL"))
    email = Column(String(255), nullable=False)
    token = Column(String(255), unique=True, nullable=False)
    
    # ❌ REMOVE THIS - No more purpose column
    # purpose = Column(Enum(VerificationPurpose), nullable=False, default=VerificationPurpose.email_link)
    
    is_used = Column(Boolean, default=False)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship(
        "User",
        back_populates="email_verifications",
        lazy="joined",
        viewonly=True,
    )
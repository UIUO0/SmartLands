# app/utils/email.py
import os
import smtplib
import ssl
from email.message import EmailMessage
from datetime import datetime, timedelta
import random

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.email_verification import EmailVerification, VerificationPurpose


# إعدادات SMTP من environment variables
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")      # الإيميل اللي يرسل منه
SMTP_PASS = os.getenv("SMTP_PASS")      # الباسورد / app password
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)


async def create_email_code(
    session: AsyncSession,
    user: User,
    purpose: VerificationPurpose = VerificationPurpose.generic,
    ttl_minutes: int = 10,
) -> EmailVerification:
    """
    ينشئ record في جدول email_verifications مع كود من 6 أرقام
    ويخزّنه في العمود token
    """
    code = f"{random.randint(0, 999999):06d}"  # مثال: 083421

    expires_at = datetime.utcnow() + timedelta(minutes=ttl_minutes)

    ev = EmailVerification(
        user_id=user.user_id,
        email=user.email,
        token=code,
        purpose=purpose,
        is_used=False,
        expires_at=expires_at,
    )

    session.add(ev)
    await session.commit()
    await session.refresh(ev)
    return ev


def build_verification_email(code: str, ttl_minutes: int = 10) -> tuple[str, str]:
    """
    يرجّع subject و body للإيميل اللي فيه الكود
    """
    subject = "Smart Lands verification code"
    body = (
        f"Hello from Smart Lands!\n\n"
        f"Your verification code is: {code}\n"
        f"This code will expire in {ttl_minutes} minutes.\n\n"
        f"If you did not request this code, you can ignore this email."
    )
    return subject, body


def send_email_smtp(to_email: str, subject: str, body: str) -> None:
    """
    دالة sync بسيطة ترسل الإيميل عبر SMTP
    (نستدعيها في BackgroundTasks عشان ما توقف request)
    """
    if not SMTP_USER or not SMTP_PASS:
        # تقدر تغيّرها لـ logging بدل raise لو حاب
        raise RuntimeError("SMTP credentials are not configured")

    msg = EmailMessage()
    msg["From"] = FROM_EMAIL
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)

    context = ssl.create_default_context()

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls(context=context)
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)

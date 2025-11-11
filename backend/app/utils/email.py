# app/utils/email.py
import os
import smtplib
import ssl
import logging
from email.message import EmailMessage
from datetime import datetime, timedelta
import random

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.email_verification import EmailVerification, VerificationPurpose

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

# إعدادات SendGrid من environment variables
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
SENDGRID_FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL")

# إعدادات SMTP من environment variables (ممكن نستخدمها محليًا لو حبيت)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")      # الإيميل اللي يرسل منه
SMTP_PASS = os.getenv("SMTP_PASS")      # الباسورد / app password
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)


async def create_email_code(
    session: AsyncSession,
    user: User,
    purpose: VerificationPurpose = VerificationPurpose.email_link,
    ttl_minutes: int = 10,
) -> EmailVerification:
    """
    ينشئ record في جدول email_verifications مع كود من 6 أرقام
    ويخزّنه في العمود token
    """
    try:
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

    except Exception as exc:
        logging.error(
            "Error in create_email_code for user_id=%s: %s",
            getattr(user, "user_id", None),
            exc,
            exc_info=True,
        )
        raise


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
    (مفيدة للاستخدام المحلي لو حاب تجرب بعيد عن Railway)
    """
    try:
        if not SMTP_USER or not SMTP_PASS:
            logging.error(
                "SMTP credentials are not configured (SMTP_USER or SMTP_PASS missing)"
            )
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

    except Exception as exc:
        logging.error(
            "Error in send_email_smtp to %s: %s",
            to_email,
            exc,
            exc_info=True,
        )
        raise


def send_email_sendgrid(to_email: str, subject: str, body: str) -> None:
    """
    إرسال إيميل عن طريق SendGrid Web API.
    هذه الدالة هي اللي بنستخدمها في الإنتاج على Railway.
    """
    try:
        if not SENDGRID_API_KEY or not SENDGRID_FROM_EMAIL:
            logging.error(
                "SendGrid credentials are not configured (SENDGRID_API_KEY or SENDGRID_FROM_EMAIL missing)"
            )
            raise RuntimeError("SendGrid is not configured")

        message = Mail(
            from_email=SENDGRID_FROM_EMAIL,
            to_emails=to_email,
            subject=subject,
            plain_text_content=body,
        )

        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)

        status_code = getattr(response, "status_code", None)
        logging.info(
            "SendGrid email sent to %s: status=%s",
            to_email,
            status_code,
        )

        if status_code is None or status_code >= 400:
            raise RuntimeError(f"SendGrid returned bad status {status_code}")

    except Exception as exc:
        logging.error(
            "Error in send_email_sendgrid to %s: %s",
            to_email,
            exc,
            exc_info=True,
        )
        raise

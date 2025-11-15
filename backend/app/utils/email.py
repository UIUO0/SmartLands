# app/utils/email.py
import os
import smtplib
import ssl
import logging
from email.message import EmailMessage
from datetime import datetime, timedelta
import random
from typing import Tuple

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.email_verification import EmailVerification

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

# ===== Configuration =====

# SendGrid settings (production - Railway)
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
SENDGRID_FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL", "noreply@smartlands.com")

# SMTP settings (development/local)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)

logger = logging.getLogger("smartlands.email")


# ===== Database Operations =====

async def create_email_code(
    session: AsyncSession,
    user: User,
    ttl_minutes: int = 10,
) -> EmailVerification:
    """
    Create a 6-digit verification code and store it in email_verifications table
    
    Args:
        session: Database session
        user: User model instance
        ttl_minutes: Time to live in minutes (default: 10)
    
    Returns:
        EmailVerification instance
    
    Raises:
        Exception: If database operation fails
    """
    try:
        # Generate 6-digit code (000000-999999)
        code = f"{random.randint(0, 999999):06d}"
        expires_at = datetime.utcnow() + timedelta(minutes=ttl_minutes)
        
        logger.info(
            "Creating verification code for user_id=%s, expires in %d minutes",
            user.user_id,
            ttl_minutes
        )
        
        ev = EmailVerification(
            user_id=user.user_id,
            email=user.email,
            token=code,
            is_used=False,
            expires_at=expires_at,
        )
        
        session.add(ev)
        await session.commit()
        await session.refresh(ev)
        
        logger.info(
            "Verification code created successfully: verification_id=%s",
            ev.verification_id
        )
        
        return ev
        
    except Exception as exc:
        logger.error(
            "Failed to create email code for user_id=%s: %s",
            getattr(user, "user_id", None),
            exc,
            exc_info=True,
        )
        await session.rollback()
        raise


# ===== Email Content Builders =====

def build_verification_email(
    code: str,
    ttl_minutes: int = 10,
    user_name: str = None
) -> Tuple[str, str]:
    """
    Build email subject and body for verification code
    
    Args:
        code: 6-digit verification code
        ttl_minutes: Expiration time in minutes
        user_name: Optional user's name for personalization
    
    Returns:
        Tuple of (subject, body)
    """
    greeting = f"Hello {user_name}!" if user_name else "Hello!"
    
    subject = "Smart Lands - Your Verification Code"
    
    body = f"""{greeting}

Your Smart Lands verification code is:

    {code}

This code will expire in {ttl_minutes} minutes.

If you did not request this code, please ignore this email or contact our support team.

Best regards,
Smart Lands Team
"""
    
    return subject, body


def build_password_reset_email(
    code: str,
    ttl_minutes: int = 10,
    user_name: str = None
) -> Tuple[str, str]:
    """
    Build email subject and body for password reset
    
    Args:
        code: 6-digit verification code
        ttl_minutes: Expiration time in minutes
        user_name: Optional user's name for personalization
    
    Returns:
        Tuple of (subject, body)
    """
    greeting = f"Hello {user_name}!" if user_name else "Hello!"
    
    subject = "Smart Lands - Password Reset Code"
    
    body = f"""{greeting}

We received a request to reset your Smart Lands account password.

Your password reset code is:

    {code}

This code will expire in {ttl_minutes} minutes.

If you did not request a password reset, please ignore this email and ensure your account is secure.

Best regards,
Smart Lands Team
"""
    
    return subject, body


def build_welcome_email(user_name: str) -> Tuple[str, str]:
    """
    Build welcome email for new users
    
    Args:
        user_name: User's name
    
    Returns:
        Tuple of (subject, body)
    """
    subject = "Welcome to Smart Lands!"
    
    body = f"""Hello {user_name}!

Welcome to Smart Lands - your trusted platform for land trading and auctions.

Your account has been successfully created. You can now:
• Browse available land listings
• Create your own land listings
• Participate in auctions
• Connect with buyers and sellers

If you have any questions, please don't hesitate to contact our support team.

Happy trading!

Best regards,
Smart Lands Team
"""
    
    return subject, body


# ===== Email Sending Functions =====

def send_email_smtp(to_email: str, subject: str, body: str) -> None:
    """
    Send email via SMTP (for local development)
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        body: Email body (plain text)
    
    Raises:
        RuntimeError: If SMTP credentials are not configured
        Exception: If email sending fails
    """
    try:
        if not SMTP_USER or not SMTP_PASS:
            logger.error("SMTP credentials not configured (SMTP_USER or SMTP_PASS missing)")
            raise RuntimeError("SMTP credentials are not configured")
        
        logger.info("Sending email via SMTP to %s", to_email)
        
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
        
        logger.info("Email sent successfully via SMTP to %s", to_email)
        
    except Exception as exc:
        logger.error(
            "Failed to send email via SMTP to %s: %s",
            to_email,
            exc,
            exc_info=True,
        )
        raise


def send_email_sendgrid(to_email: str, subject: str, body: str) -> None:
    """
    Send email via SendGrid API (for production - Railway)
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        body: Email body (plain text)
    
    Raises:
        RuntimeError: If SendGrid credentials are not configured or API returns error
        Exception: If email sending fails
    """
    try:
        if not SENDGRID_API_KEY or not SENDGRID_FROM_EMAIL:
            logger.error("SendGrid credentials not configured (SENDGRID_API_KEY or SENDGRID_FROM_EMAIL missing)")
            raise RuntimeError("SendGrid is not configured")
        
        logger.info("Sending email via SendGrid to %s", to_email)
        
        message = Mail(
            from_email=SENDGRID_FROM_EMAIL,
            to_emails=to_email,
            subject=subject,
            plain_text_content=body,
        )
        
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        
        status_code = getattr(response, "status_code", None)
        
        if status_code is None or status_code >= 400:
            logger.error("SendGrid returned error status: %s", status_code)
            raise RuntimeError(f"SendGrid API returned status {status_code}")
        
        logger.info(
            "Email sent successfully via SendGrid to %s (status: %s)",
            to_email,
            status_code
        )
        
    except Exception as exc:
        logger.error(
            "Failed to send email via SendGrid to %s: %s",
            to_email,
            exc,
            exc_info=True,
        )
        raise


# ===== High-Level Email Functions (Optional - Not Currently Used) =====

async def send_verification_code(
    session: AsyncSession,
    user: User,
    ttl_minutes: int = 10,
    use_sendgrid: bool = True
) -> EmailVerification:
    """
    Create verification code and send it via email (helper function)
    
    Args:
        session: Database session
        user: User model instance
        ttl_minutes: Code expiration time in minutes
        use_sendgrid: Use SendGrid (True) or SMTP (False)
    
    Returns:
        EmailVerification instance
    
    Raises:
        Exception: If code creation or email sending fails
    """
    # Create verification code in database
    ev = await create_email_code(session, user, ttl_minutes)
    
    # Build email content
    subject, body = build_verification_email(ev.token, ttl_minutes, user.full_name)
    
    # Send email
    if use_sendgrid:
        send_email_sendgrid(user.email, subject, body)
    else:
        send_email_smtp(user.email, subject, body)
    
    return ev


async def send_welcome_email(
    user: User,
    use_sendgrid: bool = True
) -> None:
    """
    Send welcome email to new user (helper function)
    
    Args:
        user: User model instance
        use_sendgrid: Use SendGrid (True) or SMTP (False)
    
    Raises:
        Exception: If email sending fails
    """
    subject, body = build_welcome_email(user.full_name)
    
    if use_sendgrid:
        send_email_sendgrid(user.email, subject, body)
    else:
        send_email_smtp(user.email, subject, body)
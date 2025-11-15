# app/routers/users.py
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.concurrency import run_in_threadpool

from app.db.database import get_db, get_async_session
from app.core.security import get_current_user
from app.schemas.user import UserOut, UserUpdate
from app.models.user import User
from app.models.email_verification import EmailVerification  # ✅ Complete this line
from app.utils.email import (
    create_email_code,
    build_verification_email,
    send_email_sendgrid,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.patch("/me", response_model=UserOut)
async def update_me(
    payload: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = payload.model_dump(exclude_unset=True)
    if not data:
        return UserOut.model_validate(current_user)

    await db.execute(
        update(User).where(User.user_id == current_user.user_id).values(**data)
    )
    await db.commit()

    res = await db.execute(select(User).where(User.user_id == current_user.user_id))
    user = res.scalar_one()
    return UserOut.model_validate(user)


@router.get("/{user_id}", response_model=UserOut)
async def get_user_public(user_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(User).where(User.user_id == user_id))
    user = res.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=404, detail="User not found")
    return UserOut.model_validate(user)


@router.post("/me/send-code")
async def send_code_to_me(
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
):
    """Send generic verification code to current user's email"""
    try:
        # ✅ Remove purpose parameter
        ev = await create_email_code(
            session=session,
            user=current_user,
            ttl_minutes=10,
        )

        # Build email content
        subject = "Smart Lands - Your Verification Code"
        body = f"""Hello {current_user.full_name}!

Your Smart Lands verification code is:

    {ev.token}

This code will expire in 10 minutes.

If you did not request this code, please ignore this email.

Best regards,
Smart Lands Team
"""

        # Send email
        await run_in_threadpool(
            send_email_sendgrid,
            current_user.email,
            subject,
            body,
        )

        logging.info(
            "Verification code sent to %s (user_id=%s)",
            current_user.email,
            current_user.user_id,
        )

        return {
            "detail": "Verification code sent to your email. It may appear in spam.",
            "email_sent": True,
        }

    except Exception as exc:
        logging.error(
            "Error sending code for user_id=%s: %s",
            current_user.user_id,
            exc,
            exc_info=True,
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to send verification code",
        )

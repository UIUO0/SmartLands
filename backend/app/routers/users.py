# app/routers/users.py
import logging

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db, get_async_session
from app.core.security import get_current_user
from app.schemas.user import UserOut, UserUpdate
from app.models.user import User
from app.models.email_verification import VerificationPurpose
from app.utils.email import (
    create_email_code,
    build_verification_email,
    send_email_smtp,
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
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
):
    try:
        # 1) إنشاء record في email_verifications مع كود جديد
        ev = await create_email_code(
            session=session,
            user=current_user,
            # نستخدم email_link كـ "generic" purpose متوافق مع DB
            purpose=VerificationPurpose.email_link,
            ttl_minutes=10,
        )

        # 2) بناء محتوى الإيميل
        subject, body = build_verification_email(ev.token, ttl_minutes=10)

        # 3) إرسال الإيميل في background
        background_tasks.add_task(
            send_email_smtp,
            current_user.email,
            subject,
            body,
        )

        return {"detail": "Verification code sent to your email."}

    except Exception as exc:
        logging.error(
            "Error in send_code_to_me for user_id=%s: %s",
            getattr(current_user, "user_id", None),
            exc,
            exc_info=True,
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to send verification code",
        )

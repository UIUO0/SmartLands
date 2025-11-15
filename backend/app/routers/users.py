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
@router.post("/{land_id}/images/upload", response_model=LandImageOut, status_code=201)
async def upload_land_image(
    land_id: int,
    sort_order: int = Query(0),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        # ownership check
        res = await db.execute(select(Land).where(Land.land_id == land_id))
        land = res.scalar_one_or_none()
        if not land:
            raise HTTPException(status_code=404, detail="Land not found")
        if land.owner_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="Not owner")

        allowed = {"image/jpeg", "image/png", "image/webp"}
        if file.content_type not in allowed:
            raise HTTPException(
                status_code=415,
                detail=f"unsupported content-type: {file.content_type}",
            )

        data = await file.read()
        if not data:
            raise HTTPException(status_code=400, detail="empty file")

        folder = f"smartlands/lands/{land_id}"
        result = cloudinary.uploader.upload(
            data,
            folder=folder,
            resource_type="image",
            use_filename=True,
            unique_filename=True,
            overwrite=False,
        )
        secure_url = result.get("secure_url")
        if not secure_url:
            raise RuntimeError(f"cloudinary returned no secure_url: {result}")

        img = LandImage(
            land_id=land_id,
            storage_kind="url",                         # نخزن كرابط
            file_url=secure_url,
            file_data=None,                             # ما نستخدم التخزين الباينري الآن
            file_name=file.filename or "image",         # مهم: NOT NULL
            mime_type=file.content_type or "image/jpeg",# مهم: NOT NULL
            size_bytes=len(data) if data else None,
            width=result.get("width"),
            height=result.get("height"),
            sha256_hex=None,
            is_cover=False,
            sort_order=sort_order,
            alt_text=None,
        )

        db.add(img)
        await db.commit()
        await db.refresh(img)
        return LandImageOut.model_validate(img)

    except HTTPException:
        logger.warning("UPLOAD_LAND_IMAGE_HTTP_ERROR", exc_info=True)
        raise
    except Exception as e:
        logger.error("CLOUDINARY_UPLOAD_ERROR: %r", e, exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail="image upload failed")


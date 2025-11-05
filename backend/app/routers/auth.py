# app/routers/auth.py
from __future__ import annotations

from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.schemas.user import SignupIn, LoginIn, TokenOut, UserOut
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE_NAME = "access_token"
COOKIE_PATH = "/"

def _set_auth_cookie(response: Response, access_token: str) -> None:
    # نخزن داخل الكوكي "Bearer <token>" حتى لو قرأناه لاحقًا كتوكِن خام ما يضر.
    response.set_cookie(
        key=COOKIE_NAME,
        value=f"Bearer {access_token}",
        httponly=True,
        secure=True,        # فعلها في الإنتاج (HTTPS)
        samesite="lax",     # أو "none" إذا الـ frontend على دومين مختلف + HTTPS
        max_age=60 * ACCESS_TOKEN_EXPIRE_MINUTES,
        path=COOKIE_PATH,
    )

def _clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(key=COOKIE_NAME, path=COOKIE_PATH)


@router.post("/signup", response_model=TokenOut, status_code=201)
async def signup(payload: SignupIn, response: Response, db: AsyncSession = Depends(get_db)):
    # موجود؟
    res = await db.execute(select(User).where(User.email == payload.email))
    existing = res.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        role="user",
        picture_url=None,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # أنشئ توكِن وخزّنه ككوكي
    access_token = create_access_token({"sub": str(user.user_id)})
    _set_auth_cookie(response, access_token)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserOut.model_validate(user),
    }


@router.post("/login", response_model=TokenOut)
async def login(payload: LoginIn, response: Response, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(User).where(User.email == payload.email))
    user = res.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access_token = create_access_token({"sub": str(user.user_id)}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    _set_auth_cookie(response, access_token)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserOut.model_validate(user),
    }


@router.post("/logout", status_code=204)
async def logout(response: Response):
    _clear_auth_cookie(response)
    return Response(status_code=204)

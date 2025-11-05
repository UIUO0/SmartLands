# app/core/security.py
from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, Request, status
from passlib.hash import bcrypt  # يعمل مع passlib[bcrypt]==1.7.4 و bcrypt==3.2.2
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User

# ===== إعدادات JWT =====
JWT_SECRET = os.getenv("JWT_SECRET", "CHANGE_ME_IN_PROD")
JWT_ALG = os.getenv("JWT_ALG", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # يوم افتراضيًا

# ===== أدوات كلمات المرور =====
def hash_password(raw: str) -> str:
    # ملاحظة: bcrypt يقصّ طول الباسوورد لأقصى 72 بايت. الأفضل تقصّه يدويًا لو بتسمح بأطوال كبيرة.
    return bcrypt.hash((raw or "")[:72])

def verify_password(raw: str, hashed: str) -> bool:
    try:
        return bcrypt.verify((raw or "")[:72], hashed or "")
    except Exception:
        return False

# ===== إنشاء / قراءة الـ JWT =====
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALG)

def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

# ===== استخراج التوكِن من الطلب (Header أو Cookie) =====
def _extract_bearer_from_header(auth_header: Optional[str]) -> Optional[str]:
    if not auth_header:
        return None
    if auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1].strip()
    return None

def get_bearer_token_from_request(request: Request) -> Optional[str]:
    # 1) Authorization header
    token = _extract_bearer_from_header(request.headers.get("Authorization"))
    if token:
        return token

    # 2) HttpOnly cookie (نحفظه بصيغة "Bearer <token>" أو التوكِن مباشرة)
    cookie_val = request.cookies.get("access_token")
    if not cookie_val:
        return None
    if cookie_val.startswith("Bearer "):
        return cookie_val.split(" ", 1)[1].strip()
    return cookie_val.strip()

# ===== Depends: المستخدم الحالي =====
async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    token = get_bearer_token_from_request(request)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    payload = decode_access_token(token)
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    # لاحظ: نخزن user_id كسلسلة داخل الـ sub
    try:
        user_id = int(sub)
    except (TypeError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid subject")

    res = await db.execute(select(User).where(User.user_id == user_id))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user

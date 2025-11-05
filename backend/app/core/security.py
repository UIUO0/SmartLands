# app/core/security.py
from datetime import datetime, timedelta, timezone
import os
from typing import Optional

import jwt  # PyJWT
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User

# ===== Password Hashing =====
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(raw: str) -> str:
    # ملاحظة: bcrypt يقص كلمات المرور > 72 بايت؛ الأفضل قصّها احترازياً
    if raw is None:
        raise ValueError("password is required")
    raw = str(raw)
    if len(raw.encode("utf-8")) > 72:
        raw = raw[:72]
    return pwd_context.hash(raw)

def verify_password(raw: str, hashed: str) -> bool:
    if raw is None or hashed is None:
        return False
    if len(raw.encode("utf-8")) > 72:
        raw = raw[:72]
    return pwd_context.verify(raw, hashed)

# ===== JWT =====
SECRET_KEY = os.getenv("JWT_SECRET", "change_me_in_prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid token")

# ===== Security (هذا هو المهم لعودة زر Authorize) =====
# وجود هذا الـ dependency في أي endpoint أو dependency يجعل FastAPI يضيف
# securitySchemes: HTTP bearer إلى OpenAPI -> يظهر زر Authorize في Swagger
security = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="not authenticated")

    token = credentials.credentials
    payload = decode_token(token)

    # نتوقع user_id في الـ sub
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid token payload")

    res = await db.execute(select(User).where(User.user_id == int(user_id)))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="user not found")

    return user

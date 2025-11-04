import os, time, datetime as dt
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.hash import bcrypt
import jwt

from app.db.database import get_db
from app.models.user import User, AuthIdentity

# app/core/security.py
from passlib.context import CryptContext
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(raw: str) -> str:
    # bcrypt يقص عند 72 بايت تلقائيًا؛ passlib يتعامل معها، لكن هذا يضمن عدم رمي ValueError
    return pwd_ctx.hash(raw)

def verify_password(raw: str, hashed: str) -> bool:
    return pwd_ctx.verify(raw, hashed)

JWT_SECRET = os.getenv("JWT_SECRET", "dev_secret_change_me")
JWT_EXPIRES_MIN = int(os.getenv("JWT_EXPIRES_MIN", "60"))

auth_scheme = HTTPBearer()

# -------- Password helpers --------
def hash_password(raw: str) -> str:
    return bcrypt.hash(raw)

def verify_password(raw: str, hashed: str) -> bool:
    return bcrypt.verify(raw, hashed)

# -------- JWT helpers --------
def create_access_token(user_id: int) -> str:
    now = int(time.time())
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + (JWT_EXPIRES_MIN * 60),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

async def get_current_user(
    creds: Annotated[HTTPAuthorizationCredentials, Depends(auth_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    token = creds.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = int(payload["sub"])
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    res = await db.execute(select(User).where(User.user_id == user_id))
    user = res.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user

# -------- Auth DB helpers --------
async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    res = await db.execute(select(User).where(User.email == email))
    return res.scalar_one_or_none()

async def get_password_identity(db: AsyncSession, user_id: int) -> AuthIdentity | None:
    res = await db.execute(
        select(AuthIdentity).where(
            AuthIdentity.user_id == user_id, AuthIdentity.provider == "password"
        )
    )
    return res.scalar_one_or_none()

async def touch_last_login(db: AsyncSession, identity_id: int) -> None:
    await db.execute(
        update(AuthIdentity)
        .where(AuthIdentity.identity_id == identity_id)
        .values(last_login_at=dt.datetime.utcnow())
    )
    await db.commit()

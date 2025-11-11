# app/routers/auth.py
from __future__ import annotations

from datetime import timedelta
from typing import Optional, Literal

import logging
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.user import SignupIn, LoginIn, TokenOut, UserOut
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

router = APIRouter(prefix="/auth", tags=["auth"])

# ===== Logging =====
logger = logging.getLogger("smartlands.auth")

# ===== Cookies =====
COOKIE_NAME = "access_token"
COOKIE_PATH = "/"

def _set_auth_cookie(response: Response, access_token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=f"Bearer {access_token}",
        httponly=True,
        secure=True,        # فعّلها على الإنتاج (HTTPS)
        samesite="lax",     # استخدم "none" إذا frontend على دومين مختلف + HTTPS
        max_age=60 * ACCESS_TOKEN_EXPIRE_MINUTES,
        path=COOKIE_PATH,
    )

def _clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(key=COOKIE_NAME, path=COOKIE_PATH)


# ===== Password column auto-detect =====
_password_col_cache: Optional[Literal["password_hash", "password"]] = None

async def _detect_password_column(db: AsyncSession) -> str:
    """
    يحاول يكتشف اسم عمود كلمة المرور الفعلي في جدول users:
    - password_hash
    - password
    ويكاشّه للمرات الجاية.
    """
    global _password_col_cache
    if _password_col_cache:
        return _password_col_cache

    try:
        # جرّب password_hash
        res = await db.execute(text("SHOW COLUMNS FROM users LIKE 'password_hash';"))
        row = res.first()
        if row:
            _password_col_cache = "password_hash"
            logger.info("Detected users password column: password_hash")
            return _password_col_cache

        # جرّب password
        res = await db.execute(text("SHOW COLUMNS FROM users LIKE 'password';"))
        row = res.first()
        if row:
            _password_col_cache = "password"
            logger.info("Detected users password column: password")
            return _password_col_cache

        # لا هذا ولا ذاك!
        logger.error("No password column found in users table (expected password_hash or password)")
        raise HTTPException(
            status_code=500,
            detail="users table missing password column (expected 'password_hash' or 'password')",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("PASSWORD_COL_DETECT_ERROR: %r", e)
        raise HTTPException(status_code=500, detail="failed to detect password column")


# ===== Helpers =====
async def _user_by_email(db: AsyncSession, email: str) -> Optional[dict]:
    """
    يرجّع dict لليوزر (أو None) باستخدام raw SQL
    لتفادي مشاكل ORM مع عمود الباسوورد.
    """
    pwd_col = await _detect_password_column(db)
    sql = text(f"""
        SELECT user_id, email, full_name, `{pwd_col}` AS password_hash, `role`, picture_url, created_at, updated_at
        FROM users
        WHERE email = :email
        LIMIT 1
    """)
    res = await db.execute(sql, {"email": email})
    row = res.mappings().first()
    return dict(row) if row else None


async def _insert_user(db: AsyncSession, email: str, full_name: Optional[str], password_raw: str) -> dict:
    pwd_col = await _detect_password_column(db)
    pwd_hash = hash_password(password_raw)

    sql = text(f"""
        INSERT INTO users (email, full_name, `{pwd_col}`, `role`, picture_url)
        VALUES (:email, :full_name, :pwd_hash, 'user', NULL)
    """)
    await db.execute(sql, {"email": email, "full_name": full_name, "pwd_hash": pwd_hash})
    await db.commit()

    # رجّع اليوزر بعد الإدخال
    return await _user_by_email(db, email)


def _user_out_from_row(row: dict) -> UserOut:
    return UserOut(
        user_id=row["user_id"],
        email=row["email"],
        full_name=row.get("full_name"),
        role=row.get("role", "user"),
        picture_url=row.get("picture_url"),
        created_at=row.get("created_at"),
        updated_at=row.get("updated_at"),
    )


# ===== Routes =====

@router.post("/signup", response_model=TokenOut, status_code=201)
async def signup(payload: SignupIn, response: Response, db: AsyncSession = Depends(get_db)):
    try:
        # موجود؟
        existing = await _user_by_email(db, payload.email)
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

        user_row = await _insert_user(db, payload.email, payload.full_name, payload.password)
        if not user_row:
            raise HTTPException(status_code=500, detail="failed to create user")

        access_token = create_access_token({"sub": str(user_row["user_id"])})
        _set_auth_cookie(response, access_token)

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": _user_out_from_row(user_row),
        }
    except HTTPException as he:
        logger.error("SIGNUP_HTTP_ERROR: %s", he.detail)
        raise
    except Exception as e:
        logger.exception("SIGNUP_ERROR: %r", e)
        raise HTTPException(status_code=500, detail="internal signup error")


@router.post("/login", response_model=TokenOut)
async def login(payload: LoginIn, response: Response, db: AsyncSession = Depends(get_db)):
    try:
        user_row = await _user_by_email(db, payload.email)
        if not user_row:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        pwd_hash = user_row.get("password_hash")
        if not pwd_hash or not verify_password(payload.password, pwd_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        access_token = create_access_token(
            {"sub": str(user_row["user_id"])},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        )
        _set_auth_cookie(response, access_token)

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": _user_out_from_row(user_row),
        }
    except HTTPException as he:
        logger.error("LOGIN_HTTP_ERROR: %s", he.detail)
        raise
    except Exception as e:
        logger.exception("LOGIN_ERROR: %r", e)
        raise HTTPException(status_code=500, detail="internal login error")


@router.post("/logout", status_code=204)
async def logout(response: Response):
    try:
        _clear_auth_cookie(response)
        return Response(status_code=204)
    except Exception as e:
        logger.exception("LOGOUT_ERROR: %r", e)
        # حتى لو صار خطأ في مسح الكوكي نرجّع 204 عشان الـ client ما يعلق
        return Response(status_code=204)
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.core.security import get_current_user, get_password_hash
from app.models.user import User
from app.models.email_verification import EmailVerification, VerificationPurpose
from app.models.auth_identity import AuthIdentity, AuthProvider  # عدّل الأسماء حسب الموديل عندك
from app.schemas.user import ResetPasswordRequest  # أو من ملف schemas آخر

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/resetpassword")
async def reset_password(
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    يغيّر الباسوورد للمستخدم الحالي إذا الكود صحيح وغير منتهي.
    يفترض أن الكود مُرسل مسبقاً ومخزّن في email_verifications
    بـ purpose = password_reset.
    """
    try:
        now = datetime.utcnow()

        # 1) نلاقي الكود في email_verifications
        stmt = select(EmailVerification).where(
            EmailVerification.email == current_user.email,
            EmailVerification.token == payload.code,
            EmailVerification.purpose == VerificationPurpose.password_reset,
            EmailVerification.is_used == False,  # noqa: E712
            EmailVerification.expires_at > now,
        )
        res = await db.execute(stmt)
        ev = res.scalar_one_or_none()

        if not ev:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired code",
            )

        # 2) نجيب AuthIdentity حق هذا اليوزر (provider = password)
        identity_stmt = select(AuthIdentity).where(
            AuthIdentity.user_id == current_user.user_id,
            AuthIdentity.provider == AuthProvider.password,
        )
        identity_res = await db.execute(identity_stmt)
        identity = identity_res.scalar_one_or_none()

        if identity is None:
            # مثال: لو المستخدم كان مسجّل عن طريق Google فقط
            identity = AuthIdentity(
                user_id=current_user.user_id,
                provider=AuthProvider.password,
            )
            db.add(identity)

        # 3) نحدّث الباسوورد
        identity.password_hash = get_password_hash(payload.new_password)

        # 4) نعلّم الكود إنه استُخدم
        ev.is_used = True

        await db.commit()

        logging.info(
            "Password reset via code for user_id=%s email=%s",
            current_user.user_id,
            current_user.email,
        )

        return {"detail": "Password has been reset successfully."}

    except HTTPException:
        # نرجّع نفس الخطأ بدون لف
        raise
    except Exception as exc:
        logging.error(
            "Error in reset_password for user_id=%s: %s",
            getattr(current_user, "user_id", None),
            exc,
            exc_info=True,
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to reset password",
        )

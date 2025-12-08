# app/routers/auth.py
from __future__ import annotations

from datetime import timedelta, datetime
from typing import Optional
import os

import logging
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests


from app.db.database import get_db
from app.schemas.user import SignupIn, LoginIn, TokenOut, UserOut, ResetPasswordRequest, GoogleLoginRequest
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from app.models.user import User
from app.models.auth_identity import AuthIdentity, AuthProvider
from app.models.email_verification import EmailVerification

# ===== Single Router Definition =====
router = APIRouter(prefix="/auth", tags=["auth"])

# ===== Logging =====
logger = logging.getLogger("smartlands.auth")

# ===== Cookies =====
COOKIE_NAME = "access_token"
COOKIE_PATH = "/"


def _set_auth_cookie(response: Response, access_token: str) -> None:
    """Set HTTP-only authentication cookie"""
    response.set_cookie(
        key=COOKIE_NAME,
        value=f"Bearer {access_token}",
        httponly=True,
        secure=True,  # Enable on production (HTTPS only)
        samesite="lax",  # Use "none" if frontend is on different domain + HTTPS
        max_age=60 * ACCESS_TOKEN_EXPIRE_MINUTES,
        path=COOKIE_PATH,
    )


def _clear_auth_cookie(response: Response) -> None:
    """Clear authentication cookie"""
    response.delete_cookie(key=COOKIE_NAME, path=COOKIE_PATH)


# ===== Helper Functions =====

async def _get_user_with_auth(db: AsyncSession, email: str) -> tuple[Optional[User], Optional[AuthIdentity]]:
    """
    Fetch user and their password auth identity
    Returns: (User, AuthIdentity) or (None, None)
    """
    try:
        # Get user by email
        stmt = select(User).where(User.email == email)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            return None, None
        
        # Get password auth identity
        auth_stmt = select(AuthIdentity).where(
            AuthIdentity.user_id == user.user_id,
            AuthIdentity.provider == AuthProvider.password
        )
        auth_result = await db.execute(auth_stmt)
        auth_identity = auth_result.scalar_one_or_none()
        
        return user, auth_identity
        
    except Exception as e:
        logger.error("Error fetching user with auth: %s", e, exc_info=True)
        return None, None


async def _create_user_with_auth(
    db: AsyncSession,
    email: str,
    full_name: Optional[str],
    password: str
) -> tuple[User, AuthIdentity]:
    """
    Create a new user and their password auth identity
    Returns: (User, AuthIdentity)
    """
    try:
        # Create user
        user = User(
            email=email,
            full_name=full_name or email.split("@")[0],
            role="user",
            is_active=True,
        )
        db.add(user)
        await db.flush()  # Get user_id without committing
        
        # Create auth identity
        auth_identity = AuthIdentity(
            user_id=user.user_id,
            provider=AuthProvider.password,
            password_hash=hash_password(password),
        )
        db.add(auth_identity)
        await db.commit()
        
        await db.refresh(user)
        await db.refresh(auth_identity)
        
        return user, auth_identity
        
    except Exception as e:
        await db.rollback()
        logger.error("Error creating user with auth: %s", e, exc_info=True)
        raise


def _user_to_out(user: User) -> UserOut:
    """Convert User model to UserOut schema"""
    return UserOut(
        user_id=user.user_id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        picture_url=user.picture_url,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


# ===== Routes =====

@router.post("/signup", response_model=TokenOut, status_code=201)
async def signup(
    payload: SignupIn,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user with email and password
    """
    try:
        # Check if user already exists
        user, _ = await _get_user_with_auth(db, payload.email)
        if user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )
        
        # Create user and auth identity
        user, auth_identity = await _create_user_with_auth(
            db,
            payload.email,
            payload.full_name,
            payload.password
        )
        
        # Generate access token
        access_token = create_access_token({"sub": str(user.user_id)})
        _set_auth_cookie(response, access_token)
        
        logger.info("User registered successfully: %s (id=%s)", user.email, user.user_id)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": _user_to_out(user),
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("SIGNUP_ERROR: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Internal signup error"
        )


@router.post("/login", response_model=TokenOut)
async def login(
    payload: LoginIn,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Login with email and password
    """
    try:
        # Get user and auth identity
        user, auth_identity = await _get_user_with_auth(db, payload.email)
        
        # Validate credentials
        if not user or not auth_identity or not auth_identity.password_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        if not verify_password(payload.password, auth_identity.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive"
            )
        
        # Generate access token
        access_token = create_access_token(
            {"sub": str(user.user_id)},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        _set_auth_cookie(response, access_token)
        
        logger.info("User logged in: %s (id=%s)", user.email, user.user_id)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": _user_to_out(user),
        }
        

    except HTTPException:
        raise
    except Exception as e:
        logger.error("LOGIN_ERROR: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Internal login error"
        )


@router.post("/google", response_model=TokenOut)
async def google_login(
    payload: GoogleLoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Login or Signup with Google ID Token
    """
    try:
        # Verify Token
        # NOTE: Make sure GOOGLE_CLIENT_ID is set in .env
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        
        # Verify the token using Google's library
        try:
            id_info = id_token.verify_oauth2_token(
                payload.id_token, 
                google_requests.Request(), 
                client_id
            )
        except ValueError as e:
            logger.warning("Invalid Google Token: %s", e)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google Token"
            )

        google_user_id = id_info.get('sub')
        email = id_info.get('email')
        email_verified = id_info.get('email_verified')
        name = id_info.get('name')
        picture = id_info.get('picture')

        if not email_verified:
            raise HTTPException(
                status_code=400, 
                detail="Google email must be verified"
            )

        # 1. Check if Identity Exists (Already linked)
        stmt = select(AuthIdentity).where(
            AuthIdentity.provider == AuthProvider.google,
            AuthIdentity.provider_user_id == google_user_id
        )
        res = await db.execute(stmt)
        identity = res.scalar_one_or_none()

        if identity:
            # Identity found -> Get User
            user_stmt = select(User).where(User.user_id == identity.user_id)
            user_res = await db.execute(user_stmt)
            user = user_res.scalar_one()
            
            # Update user info if needed (optional)
            if not user.full_name and name:
                user.full_name = name
            if not user.picture_url and picture:
                user.picture_url = picture
            await db.commit()

        else:
            # Identity not found -> Check if email exists (Link account)
            user_stmt = select(User).where(User.email == email)
            user_res = await db.execute(user_stmt)
            user = user_res.scalar_one_or_none()

            if not user:
                # User doesn't exist -> Create New User
                user = User(
                    email=email,
                    full_name=name or email.split("@")[0],
                    picture_url=picture,
                    role="user",
                    is_active=True
                )
                db.add(user)
                await db.flush()  # to get user_id
                logger.info("Created new user from Google: %s", email)
            else:
                logger.info("Linking Google account to existing user: %s", email)

            # Create Auth Identity
            identity = AuthIdentity(
                user_id=user.user_id,
                provider=AuthProvider.google,
                provider_user_id=google_user_id,
            )
            db.add(identity)
            await db.commit()
            await db.refresh(user)

        # check if user is active
        if not user.is_active:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive"
            )

        # Generate Access Token
        access_token = create_access_token(
            {"sub": str(user.user_id)},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        _set_auth_cookie(response, access_token)
        
        logger.info("Google login successful: %s (id=%s)", user.email, user.user_id)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": _user_to_out(user),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("GOOGLE_LOGIN_ERROR: %s", e, exc_info=True)
        # DEBUG: Expose error to frontend to identify the issue
        raise HTTPException(
            status_code=500,
            detail=f"Internal Google login error: {str(e)}"
        )


@router.post("/logout", status_code=204)
async def logout(response: Response):
    """
    Logout by clearing authentication cookie
    """
    try:
        _clear_auth_cookie(response)
        logger.info("User logged out")
        return Response(status_code=204)
    except Exception as e:
        logger.error("LOGOUT_ERROR: %s", e, exc_info=True)
        # Return 204 anyway to prevent client hanging
        return Response(status_code=204)


@router.post("/reset-password")
async def reset_password(
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reset password using verification code"""
    try:
        now = datetime.utcnow()
        
        # ✅ No purpose check - just validate code
        stmt = select(EmailVerification).where(
            EmailVerification.email == current_user.email,
            EmailVerification.token == payload.code,
            EmailVerification.is_used == False,  # noqa: E712
            EmailVerification.expires_at > now,
        )
        result = await db.execute(stmt)
        verification = result.scalar_one_or_none()
        
        if not verification:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired verification code"
            )
        
        # Get or create auth identity
        auth_stmt = select(AuthIdentity).where(
            AuthIdentity.user_id == current_user.user_id,
            AuthIdentity.provider == AuthProvider.password,
        )
        auth_result = await db.execute(auth_stmt)
        auth_identity = auth_result.scalar_one_or_none()
        
        if not auth_identity:
            auth_identity = AuthIdentity(
                user_id=current_user.user_id,
                provider=AuthProvider.password,
            )
            db.add(auth_identity)
        
        # Update password
        auth_identity.password_hash = hash_password(payload.new_password)
        
        # Mark code as used
        verification.is_used = True
        
        await db.commit()
        
        logging.info(
            "Password reset successfully for user_id=%s",
            current_user.user_id
        )
        
        return {"detail": "Password has been reset successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(
            "RESET_PASSWORD_ERROR for user_id=%s: %s",
            current_user.user_id,
            e,
            exc_info=True
        )
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to reset password"
        )
# app/routers/auth.py
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_async_session
from app.models.user import User
from app.models.auth_identity import AuthIdentity, AuthProvider
from app.models.email_verification import EmailVerification
from app.core.security import hash_password  # دالتك الحالية لعمل hash
from app.schemas.user import ResetPasswordWithCodeRequest  # أو من ملف schemas المناسب


@router.post("/reset-password/confirm")
async def reset_password_with_code(
    payload: ResetPasswordWithCodeRequest,
    session: AsyncSession = Depends(get_async_session),
):
    """
    يغيّر كلمة المرور بناءً على email + code بدون الحاجة لتسجيل دخول.
    يتأكد أن الكود:
    - يطابق الإيميل
    - غير مستخدم
    - غير منتهي الصلاحية
    """
    try:
        now = datetime.utcnow()

        # 1) نتحقّق من وجود المستخدم بهذا الإيميل
        user_result = await session.execute(
            select(User).where(User.email == payload.email)
        )
        user = user_result.scalar_one_or_none()

        if not user or not user.is_active:
            # لأسباب أمنية نقدر نرجع رسالة عامة
            logging.warning(
                "reset_password_with_code requested for non-existing or inactive email: %s",
                payload.email,
            )
            raise HTTPException(
                status_code=400,
                detail="Invalid email or code",
            )

        # 2) نبحث عن كود مطابق في email_verifications
        ev_result = await session.execute(
            select(EmailVerification).where(
                EmailVerification.email == payload.email,
                EmailVerification.token == payload.code,
                EmailVerification.is_used == False,  # noqa: E712
                EmailVerification.expires_at > now,
            )
        )
        ev = ev_result.scalar_one_or_none()

        if not ev:
            logging.warning(
                "reset_password_with_code invalid/expired code for email=%s",
                payload.email,
            )
            raise HTTPException(
                status_code=400,
                detail="Invalid email or code",
            )

        # 3) نجيب AuthIdentity لهذا المستخدم مع provider=password
        identity_result = await session.execute(
            select(AuthIdentity).where(
                AuthIdentity.user_id == user.user_id,
                AuthIdentity.provider == AuthProvider.password,
            )
        )
        identity = identity_result.scalar_one_or_none()

        # لو ما عنده سجل password (مثلاً كان مسجل Google فقط) ننشئ واحد
        if identity is None:
            identity = AuthIdentity(
                user_id=user.user_id,
                provider=AuthProvider.password,
            )
            session.add(identity)

        # 4) نحدّث الباسوورد
        identity.password_hash = hash_password(payload.new_password)

        # 5) نعلّم الكود إنه استُخدم
        ev.is_used = True

        await session.commit()

        logging.info(
            "Password reset successfully for user_id=%s email=%s",
            user.user_id,
            user.email,
        )

        return {"detail": "Password has been reset successfully."}

    except HTTPException:
        # نمررها كما هي للـ client
        raise
    except Exception as exc:
        logging.error(
            "Error in reset_password_with_code for email=%s: %s",
            payload.email,
            exc,
            exc_info=True,
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to reset password",
        )

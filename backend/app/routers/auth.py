# app/routers/auth.py
from __future__ import annotations

from datetime import timedelta, datetime
from typing import Optional

import logging
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.user import SignupIn, LoginIn, TokenOut, UserOut, ResetPasswordRequest
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from app.models.user import User
from app.models.auth_identity import AuthIdentity, AuthProvider
from app.models.email_verification import EmailVerification, VerificationPurpose

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
    """
    Reset password using verification code sent via email
    """
    try:
        now = datetime.utcnow()
        
        # 1) Find verification code
        stmt = select(EmailVerification).where(
            EmailVerification.email == current_user.email,
            EmailVerification.token == payload.code,
            EmailVerification.purpose == VerificationPurpose.password_reset,
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
        
        # 2) Get or create auth identity
        auth_stmt = select(AuthIdentity).where(
            AuthIdentity.user_id == current_user.user_id,
            AuthIdentity.provider == AuthProvider.password,
        )
        auth_result = await db.execute(auth_stmt)
        auth_identity = auth_result.scalar_one_or_none()
        
        if not auth_identity:
            # Create new password auth if user only had OAuth
            auth_identity = AuthIdentity(
                user_id=current_user.user_id,
                provider=AuthProvider.password,
            )
            db.add(auth_identity)
        
        # 3) Update password
        auth_identity.password_hash = hash_password(payload.new_password)
        
        # 4) Mark code as used
        verification.is_used = True
        
        await db.commit()
        
        logger.info(
            "Password reset successfully for user_id=%s email=%s",
            current_user.user_id,
            current_user.email
        )
        
        return {"detail": "Password has been reset successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
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
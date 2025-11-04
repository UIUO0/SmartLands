from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.user import User, AuthIdentity
from app.schemas.user import SignupIn, LoginIn, TokenOut, UserOut
from app.core.security import hash_password, verify_password, create_access_token, get_user_by_email, touch_last_login

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=TokenOut, status_code=201)
async def signup(payload: SignupIn, db: AsyncSession = Depends(get_db)):
    # هل الإيميل موجود؟
    existing = await get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    # أنشئ user
    user = User(email=payload.email, full_name=payload.full_name, role="user", is_active=1)
    db.add(user)
    await db.flush()  # للحصول على user_id

    # أنشئ هوية password
    identity = AuthIdentity(
        user_id=user.user_id,
        provider="password",
        password_hash=hash_password(payload.password),
        email_verified=0,
    )
    db.add(identity)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(user.user_id)
    return TokenOut(access_token=token, user=UserOut.model_validate(user))

@router.post("/login", response_model=TokenOut)
async def login(payload: LoginIn, db: AsyncSession = Depends(get_db)):
    # ابحث user
    user = await get_user_by_email(db, payload.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # جب الهوية من نوع password
    res = await db.execute(
        select(AuthIdentity).where(
            AuthIdentity.user_id == user.user_id,
            AuthIdentity.provider == "password",
        )
    )
    identity = res.scalar_one_or_none()
    if not identity or not identity.password_hash or not verify_password(payload.password, identity.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # حدّث last_login
    await touch_last_login(db, identity.identity_id)

    token = create_access_token(user.user_id)
    return TokenOut(access_token=token, user=UserOut.model_validate(user))

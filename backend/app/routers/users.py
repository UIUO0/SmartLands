from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.schemas.user import UserOut
from app.models.user import User

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.user import UserOut, UserUpdate

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

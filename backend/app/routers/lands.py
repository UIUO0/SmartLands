from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.land import Land
from app.models.user import User
from app.schemas.land import LandCreate, LandOut, LandListOut
from app.core.security import get_current_user

router = APIRouter(prefix="/lands", tags=["lands"])

@router.post("", response_model=LandOut, status_code=201)
async def create_land(
    payload: LandCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    land = Land(
        owner_id=current_user.user_id,
        **payload.model_dump(),
        status="available",
    )
    db.add(land)
    await db.commit()
    await db.refresh(land)
    return LandOut.model_validate(land)

@router.get("", response_model=LandListOut)
async def list_lands(
    db: AsyncSession = Depends(get_db),
    status: str | None = Query(default=None),
    city: str | None = Query(default=None),
    q: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    stmt = select(Land)
    if status:
        stmt = stmt.where(Land.status == status)
    if city:
        stmt = stmt.where(Land.city == city)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(Land.title.ilike(like), Land.description.ilike(like)))

    total_stmt = select(func.count()).select_from(stmt.subquery())
    res_total = await db.execute(total_stmt)
    total = int(res_total.scalar_one())

    stmt = stmt.order_by(Land.created_at.desc()).limit(limit).offset(offset)
    res = await db.execute(stmt)
    items = res.scalars().all()

    return {"total": total, "items": [LandOut.model_validate(x) for x in items]}

@router.get("/{land_id}", response_model=LandOut)
async def get_land(land_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Land).where(Land.land_id == land_id))
    land = res.scalar_one_or_none()
    if not land:
        raise HTTPException(status_code=404, detail="Land not found")
    return LandOut.model_validate(land)

from decimal import Decimal
import traceback

from fastapi import APIRouter, Depends, HTTPException, Query, status
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
    try:
        land = Land(
            owner_id=current_user.user_id,
            title=payload.title,
            description=payload.description,
            price_amount=Decimal(str(payload.price_amount)),
            currency_code=(payload.currency_code or "SAR")[:3],
            status="available",
            area_sq_m=Decimal(str(payload.area_sq_m)) if payload.area_sq_m is not None else None,
            address_line=payload.address_line,
            city=payload.city,
            region=payload.region,
            country=(payload.country[:2].upper() if payload.country else None),
            postal_code=payload.postal_code,
            latitude=Decimal(str(payload.latitude)) if payload.latitude is not None else None,
            longitude=Decimal(str(payload.longitude)) if payload.longitude is not None else None,
            google_place_id=payload.google_place_id,
        )

        db.add(land)
        await db.commit()
        await db.refresh(land)
        return LandOut.model_validate(land)

    except HTTPException:
        raise
    except Exception as e:
        print("CREATE_LAND_ERROR:", repr(e))
        traceback.print_exc()
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="create land failed")

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
        # NOTE: MySQL ilike قد لا يعمل حسب الـ dialect؛ استخدم lower() لو احتجت
        stmt = stmt.where(or_(Land.title.ilike(like), Land.description.ilike(like)))

    total_stmt = select(func.count()).select_from(stmt.subquery())
    res_total = await db.execute(total_stmt)
    total = int(res_total.scalar_one())

    stmt = stmt.order_by(Land.created_at.desc()).limit(limit).offset(offset)
    res = await db.execute(stmt)
    items = res.scalars().all()

    return {"total": total, "items": [LandOut.model_validate(x) for x in items]}

@router.get("/lands", response_model=List[LandOut])
def get_lands(db: Session = Depends(get_db)):
    lands = db.query(Land).filter(Land.status == "available").all()
    return lands


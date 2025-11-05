# app/routers/lands.py
from decimal import Decimal
import traceback
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from sqlalchemy import select, func, or_, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.land import Land
from app.models.user import User
from app.models.land_image import LandImage
from app.schemas.land import (
    LandCreate,
    LandUpdate,
    LandOut,
    LandListOut,
    LandImageCreate,
    LandImageOut,
)
from app.core.security import get_current_user

router = APIRouter(prefix="/lands", tags=["lands"])


# ---------------------------
# Create (محمي بالتوكن)
# ---------------------------
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


# ---------------------------
# Browse (عام) — الافتراضي status=available
# ---------------------------
@router.get("", response_model=LandListOut)
async def list_lands(
    db: AsyncSession = Depends(get_db),
    status: Optional[str] = Query(default=None, description="available/reserved/sold/archived"),
    city: Optional[str] = Query(default=None),
    q: Optional[str] = Query(default=None, description="search in title/description"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    stmt = select(Land)
    if status:
        stmt = stmt.where(Land.status == status)
    else:
        stmt = stmt.where(Land.status == "available")

    if city:
        stmt = stmt.where(Land.city == city)

    if q:
        like = f"%{q.lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(Land.title).like(like),
                func.lower(Land.description).like(like),
            )
        )

    total_stmt = select(func.count()).select_from(stmt.subquery())
    res_total = await db.execute(total_stmt)
    total = int(res_total.scalar_one())

    stmt = stmt.order_by(Land.created_at.desc()).limit(limit).offset(offset)
    res = await db.execute(stmt)
    items = res.scalars().all()

    return {"total": total, "items": [LandOut.model_validate(x) for x in items]}


# ---------------------------
# أراضي المستخدم (محمي) — يجب أن يسبق /{land_id}
# ---------------------------
@router.get("/me/mine", response_model=LandListOut)
async def my_lands(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    base = select(Land).where(Land.owner_id == current_user.user_id)

    total_stmt = select(func.count()).select_from(base.subquery())
    res_total = await db.execute(total_stmt)
    total = int(res_total.scalar_one())

    res = await db.execute(base.order_by(Land.created_at.desc()).limit(limit).offset(offset))
    items = res.scalars().all()

    return {"total": total, "items": [LandOut.model_validate(x) for x in items]}


# ---------------------------
# تفاصيل أرض واحدة (عام)
# ---------------------------
@router.get("/{land_id}", response_model=LandOut)
async def get_land(land_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Land).where(Land.land_id == land_id))
    land = res.scalar_one_or_none()
    if not land:
        raise HTTPException(status_code=404, detail="Land not found")
    return LandOut.model_validate(land)


# ---------------------------
# Update (محمي - المالك فقط)
# ---------------------------
@router.patch("/{land_id}", response_model=LandOut)
async def update_land(
    land_id: int,
    payload: LandUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        # تحقق من وجود الأرض والملكية
        res = await db.execute(select(Land).where(Land.land_id == land_id))
        land = res.scalar_one_or_none()
        if not land:
            raise HTTPException(status_code=404, detail="Land not found")
        if land.owner_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="Not owner")

        data = payload.model_dump(exclude_unset=True)

        # ثبّت status على القيم المسموحة (لو مرّرت)
        if "status" in data and data["status"] is not None:
            st = str(data["status"]).strip().lower()
            allowed = {"available", "reserved", "sold", "archived"}
            if st not in allowed:
                raise HTTPException(status_code=422, detail=f"invalid status '{st}', allowed: {sorted(allowed)}")
            data["status"] = st

        # country إلى ISO-2 upper (لو مرّرت)
        if "country" in data and data["country"] is not None:
            ctry = str(data["country"]).strip().upper()
            data["country"] = ctry[:2] if ctry else None

        # تحويل الأرقام إلى Decimal (مع التعامل مع القيم الفارغة)
        for k in ("price_amount", "area_sq_m", "latitude", "longitude"):
            if k in data:
                val = data[k]
                if val is None or val == "":
                    data[k] = None
                else:
                    data[k] = Decimal(str(val))

        # تنفيذ التحديث
        await db.execute(update(Land).where(Land.land_id == land_id).values(**data))
        await db.commit()

        # رجّع النسخة المحدثة
        res = await db.execute(select(Land).where(Land.land_id == land_id))
        land = res.scalar_one()
        return LandOut.model_validate(land)

    except HTTPException:
        raise
    except Exception as e:
        print("UPDATE_LAND_ERROR:", repr(e))
        traceback.print_exc()
        await db.rollback()
        raise HTTPException(status_code=500, detail="internal update error")


# ---------------------------
# Delete (محمي - المالك فقط)
# ---------------------------
@router.delete("/{land_id}", status_code=204)
async def delete_land(
    land_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    res = await db.execute(select(Land).where(Land.land_id == land_id))
    land = res.scalar_one_or_none()
    if not land:
        raise HTTPException(status_code=404, detail="Land not found")
    if land.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not owner")

    await db.execute(delete(Land).where(Land.land_id == land_id))
    await db.commit()
    return Response(status_code=204)


# ---------------------------
# Land Images
# ---------------------------

# قائمة الصور (عام)
@router.get("/{land_id}/images", response_model=List[LandImageOut])
async def list_land_images(land_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(LandImage)
        .where(LandImage.land_id == land_id)
        .order_by(LandImage.sort_order.asc(), LandImage.image_id.asc())
    )
    images = res.scalars().all()
    return [LandImageOut.model_validate(x) for x in images]


# إضافة صورة (محمي - المالك فقط)
@router.post("/{land_id}/images", response_model=LandImageOut, status_code=201)
async def add_land_image(
    land_id: int,
    payload: LandImageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    res = await db.execute(select(Land).where(Land.land_id == land_id))
    land = res.scalar_one_or_none()
    if not land:
        raise HTTPException(status_code=404, detail="Land not found")
    if land.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not owner")

    img = LandImage(
        land_id=land_id,
        file_url=str(payload.file_url),
        sort_order=payload.sort_order,
        is_cover=False,
    )
    db.add(img)
    await db.commit()
    await db.refresh(img)
    return LandImageOut.model_validate(img)


# تعيين الغلاف (محمي - المالك فقط)
@router.patch("/{land_id}/cover/{image_id}", status_code=200)
async def set_cover_image(
    land_id: int,
    image_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    res = await db.execute(select(Land).where(Land.land_id == land_id))
    land = res.scalar_one_or_none()
    if not land:
        raise HTTPException(status_code=404, detail="Land not found")
    if land.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not owner")

    res = await db.execute(
        select(LandImage).where(
            LandImage.image_id == image_id, LandImage.land_id == land_id
        )
    )
    img = res.scalar_one_or_none()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")

    await db.execute(
        update(LandImage).where(LandImage.land_id == land_id).values(is_cover=False)
    )
    await db.execute(
        update(LandImage).where(LandImage.image_id == image_id).values(is_cover=True)
    )
    await db.execute(
        update(Land).where(Land.land_id == land_id).values(cover_image_id=image_id)
    )
    await db.commit()
    return {"ok": True, "cover_image_id": image_id}

from decimal import Decimal
from typing import Optional, List

import logging

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Response,
    UploadFile,
    File,
)
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
    LandImageOut,
    LandStatus,  # Enum
)
from app.core.security import get_current_user

import cloudinary
import cloudinary.uploader

logger = logging.getLogger("smartlands.lands")

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
        logger.warning("CREATE_LAND_HTTP_ERROR", exc_info=True)
        raise
    except Exception as e:
        logger.error("CREATE_LAND_ERROR: %r", e, exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail="create land failed")


# ---------------------------
# Browse (عام) — الافتراضي status=available
# ---------------------------
@router.get("", response_model=LandListOut)
async def list_lands(
    db: AsyncSession = Depends(get_db),
    status: Optional[LandStatus] = Query(default=None, description="available/reserved/sold/archived"),
    city: Optional[str] = Query(default=None),
    q: Optional[str] = Query(default=None, description="search in title/description"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    try:
        stmt = select(Land)
        if status:
            status_value = status.value if hasattr(status, "value") else str(status)
            stmt = stmt.where(Land.status == status_value)
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
    except HTTPException:
        logger.warning("LIST_LANDS_HTTP_ERROR", exc_info=True)
        raise
    except Exception as e:
        logger.error("LIST_LANDS_ERROR: %r", e, exc_info=True)
        raise HTTPException(status_code=500, detail="list lands failed")


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
    try:
        base = select(Land).where(Land.owner_id == current_user.user_id)

        total_stmt = select(func.count()).select_from(base.subquery())
        res_total = await db.execute(total_stmt)
        total = int(res_total.scalar_one())

        res = await db.execute(base.order_by(Land.created_at.desc()).limit(limit).offset(offset))
        items = res.scalars().all()

        return {"total": total, "items": [LandOut.model_validate(x) for x in items]}
    except HTTPException:
        logger.warning("MY_LANDS_HTTP_ERROR", exc_info=True)
        raise
    except Exception as e:
        logger.error("MY_LANDS_ERROR: %r", e, exc_info=True)
        raise HTTPException(status_code=500, detail="my lands failed")


# ---------------------------
# تفاصيل أرض واحدة (عام)
# ---------------------------
@router.get("/{land_id}", response_model=LandOut)
async def get_land(land_id: int, db: AsyncSession = Depends(get_db)):
    try:
        res = await db.execute(select(Land).where(Land.land_id == land_id))
        land = res.scalar_one_or_none()
        if not land:
            raise HTTPException(status_code=404, detail="Land not found")
        return LandOut.model_validate(land)
    except HTTPException:
        logger.warning("GET_LAND_HTTP_ERROR", exc_info=True)
        raise
    except Exception as e:
        logger.error("GET_LAND_ERROR: %r", e, exc_info=True)
        raise HTTPException(status_code=500, detail="get land failed")


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
        res = await db.execute(select(Land).where(Land.land_id == land_id))
        land = res.scalar_one_or_none()
        if not land:
            raise HTTPException(status_code=404, detail="Land not found")
        if land.owner_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="Not owner")

        data = payload.model_dump(exclude_unset=True)

        # validate status if provided
        if "status" in data and data["status"] is not None:
            raw = data["status"]
            st = (raw.value if hasattr(raw, "value") else str(raw)).strip().lower()
            allowed = {"available", "reserved", "sold", "archived"}
            if st not in allowed:
                raise HTTPException(
                    status_code=422,
                    detail=f"invalid status '{st}', allowed: {sorted(allowed)}",
                )
            data["status"] = st

        # normalize country (ISO-2 upper)
        if "country" in data and data["country"] is not None:
            ctry = str(data["country"]).strip().upper()
            data["country"] = ctry[:2] if ctry else None

        # numeric fields to Decimal
        for k in ("price_amount", "area_sq_m", "latitude", "longitude"):
            if k in data:
                val = data[k]
                data[k] = None if val in (None, "") else Decimal(str(val))

        await db.execute(update(Land).where(Land.land_id == land_id).values(**data))
        await db.commit()

        res = await db.execute(select(Land).where(Land.land_id == land_id))
        land = res.scalar_one()
        return LandOut.model_validate(land)

    except HTTPException:
        logger.warning("UPDATE_LAND_HTTP_ERROR", exc_info=True)
        raise
    except Exception as e:
        logger.error("UPDATE_LAND_ERROR: %r", e, exc_info=True)
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
    try:
        res = await db.execute(select(Land).where(Land.land_id == land_id))
        land = res.scalar_one_or_none()
        if not land:
            raise HTTPException(status_code=404, detail="Land not found")
        if land.owner_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="Not owner")

        await db.execute(delete(Land).where(Land.land_id == land_id))
        await db.commit()
        return Response(status_code=204)

    except HTTPException:
        logger.warning("DELETE_LAND_HTTP_ERROR", exc_info=True)
        raise
    except Exception as e:
        logger.error("DELETE_LAND_ERROR: %r", e, exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail="delete land failed")


# ---------------------------
# Land Images
# ---------------------------

# قائمة الصور (عام)
@router.get("/{land_id}/images", response_model=List[LandImageOut])
async def list_land_images(land_id: int, db: AsyncSession = Depends(get_db)):
    try:
        res = await db.execute(
            select(LandImage)
            .where(LandImage.land_id == land_id)
            .order_by(LandImage.sort_order.asc(), LandImage.image_id.asc())
        )
        images = res.scalars().all()
        return [LandImageOut.model_validate(x) for x in images]
    except HTTPException:
        logger.warning("LIST_LAND_IMAGES_HTTP_ERROR", exc_info=True)
        raise
    except Exception as e:
        logger.error("LIST_LAND_IMAGES_ERROR: %r", e, exc_info=True)
        raise HTTPException(status_code=500, detail="list land images failed")


# رفع صورة إلى Cloudinary (محمي - المالك فقط)
@router.post("/{land_id}/images/upload", response_model=LandImageOut, status_code=201)
async def upload_land_image(
    land_id: int,
    sort_order: int = Query(0),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        # ownership check
        res = await db.execute(select(Land).where(Land.land_id == land_id))
        land = res.scalar_one_or_none()
        if not land:
            raise HTTPException(status_code=404, detail="Land not found")
        if land.owner_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="Not owner")

        allowed = {"image/jpeg", "image/png", "image/webp"}
        if file.content_type not in allowed:
            raise HTTPException(
                status_code=415,
                detail=f"unsupported content-type: {file.content_type}",
            )

        data = await file.read()
        if not data:
            raise HTTPException(status_code=400, detail="empty file")

        folder = f"smartlands/lands/{land_id}"
        result = cloudinary.uploader.upload(
            data,
            folder=folder,
            resource_type="image",
            use_filename=True,
            unique_filename=True,
            overwrite=False,
        )
        secure_url = result.get("secure_url")
        if not secure_url:
            raise RuntimeError(f"cloudinary returned no secure_url: {result}")

        img = LandImage(
            land_id=land_id,
            file_url=secure_url,
            sort_order=sort_order,
            is_cover=False,
        )
        db.add(img)
        await db.commit()
        await db.refresh(img)
        return LandImageOut.model_validate(img)

    except HTTPException:
        logger.warning("UPLOAD_LAND_IMAGE_HTTP_ERROR", exc_info=True)
        raise
    except Exception as e:
        logger.error("CLOUDINARY_UPLOAD_ERROR: %r", e, exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail="image upload failed")


# تعيين صورة الغلاف (محمي - المالك فقط)
@router.patch("/{land_id}/cover/{image_id}", status_code=200)
async def set_cover_image(
    land_id: int,
    image_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        res = await db.execute(select(Land).where(Land.land_id == land_id))
        land = res.scalar_one_or_none()
        if not land:
            raise HTTPException(status_code=404, detail="Land not found")
        if land.owner_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="Not owner")

        res = await db.execute(
            select(LandImage).where(
                LandImage.image_id == image_id,
                LandImage.land_id == land_id,
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

    except HTTPException:
        logger.warning("SET_COVER_IMAGE_HTTP_ERROR", exc_info=True)
        raise
    except Exception as e:
        logger.error("SET_COVER_IMAGE_ERROR: %r", e, exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail="set cover image failed")
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.agreement import Agreement
from app.schemas.agreement import AgreementOut

logger = logging.getLogger("smartlands.agreements")

router = APIRouter(prefix="/agreements", tags=["agreements"])

@router.get("", response_model=List[AgreementOut])
async def list_my_agreements(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all agreements where the current user is either the buyer or the seller.
    Ordered by creation date descending.
    """
    try:
        res = await db.execute(
            select(Agreement)
            .where(
                or_(
                    Agreement.buyer_user_id == current_user.user_id,
                    Agreement.seller_user_id == current_user.user_id
                )
            )
            .order_by(Agreement.created_at.desc())
        )
        agreements = res.scalars().all()
        return [AgreementOut.model_validate(a) for a in agreements]

    except Exception as e:
        logger.error("LIST_AGREEMENTS_ERROR: %r", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch agreements")

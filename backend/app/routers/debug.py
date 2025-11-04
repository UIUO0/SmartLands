from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db

router = APIRouter(prefix="/__debug", tags=["__debug"])

@router.get("/lands/columns")
async def debug_lands_columns(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(text("SHOW COLUMNS FROM lands"))).mappings().all()
    return {"columns": [dict(r) for r in rows]}

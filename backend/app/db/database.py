import os
from typing import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base

# لازم يكون بصيغة asyncmy في Railway Variables
# DATABASE_URL = mysql+asyncmy://USER:PASSWORD@HOST:PORT/DBNAME
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. Example: "
        "mysql+asyncmy://root:PASSWORD@mysql.railway.internal:3306/railway"
    )

# Async engine
engine = create_async_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=280,
    future=True,
)

# Async session
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autoflush=False,
    expire_on_commit=False,
)

# Base لموديلات SQLAlchemy
Base = declarative_base()

# Dependency للـ FastAPI
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session

# الدالة المطلوبة في main.py
async def ping_database() -> bool:
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        return True
    except Exception:
        return False

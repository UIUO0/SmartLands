import asyncio
import os
import sys

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.database import engine, Base

# Import all models to register them with Base
from app.models.user import User
from app.models.land import Land
from app.models.land_image import LandImage
from app.models.email_verification import EmailVerification
from app.models.auth_identity import AuthIdentity
from app.models.land_request import LandRequest

async def init_models():
    print("Creating tables...")
    async with engine.begin() as conn:
        # await conn.run_sync(Base.metadata.drop_all) # DANGEROUS: Do not uncomment in prod
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created successfully.")

if __name__ == "__main__":
    asyncio.run(init_models())

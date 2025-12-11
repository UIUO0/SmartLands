import asyncio
import sys
import os
from sqlalchemy import text

# Ensure we can import from app
sys.path.append(os.getcwd())

from app.db.database import engine

async def fix_enums():
    print("Starting Enum Fix...")
    async with engine.begin() as conn:
        # 1. Lands
        print("Fixing 'lands.status'...")
        try:
            await conn.execute(text("ALTER TABLE lands MODIFY COLUMN status ENUM('available', 'reserved', 'sold', 'archived') NOT NULL DEFAULT 'available';"))
            print("OK.")
        except Exception as e:
            print(f"Error fixing lands: {e}")

        # 2. Requests
        print("Fixing 'requests.status'...")
        try:
            await conn.execute(text("ALTER TABLE requests MODIFY COLUMN status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending';"))
            print("OK.")
        except Exception as e:
            print(f"Error fixing requests: {e}")

        # 3. Agreements
        print("Fixing 'agreements.status'...")
        try:
            await conn.execute(text("ALTER TABLE agreements MODIFY COLUMN status ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending';"))
            print("OK.")
        except Exception as e:
            print(f"Error fixing agreements: {e}")

    print("Enum Fix Completed.")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(fix_enums())


import pytest
from httpx import AsyncClient
from app.main import app
from app.models.user import User
from app.models.land import Land
from app.models.land_request import LandRequest
from app.core.security import create_access_token
from app.db.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import select

# Mock dependencies if needed, or use real DB if available.
# Since we are running on user machine, we assume DB is reachable as per init_db attempts.

# We need to run this with pytest. 
# But I'll make it a standalone script to be easier to run without installing pytest if missing.
# Wait, let's use a standalone async script using httpx directly on the app.

import asyncio
from app.core.security import create_access_token
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("verify_requests")

async def verify():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        
        # 1. Login/Create Owner
        # We need a user. We can't easily create one without DB access or hitting endpoints.
        # Let's assume we can create users via endpoints or DB. 
        # Since I can't guarantee DB state, I'll try to signup.
        
        email_owner = "owner@example.com"
        email_buyer = "buyer@example.com"
        
        # Helper to get auth token
        async def get_token(email):
            # We assume user exists or we can create. 
            # In this app, auth might need Google token or something.
            # Looking at auth.py (not shown fully but likely has google/apple).
            # users.py sends code.
            # actually internal generation of token might be easiest if we have the secret.
            
            # Use internal function to generate token for test
            # Need a user_id. 
            # Let's hit the DB directly to get/create users.
            pass

        from app.db.database import AsyncSessionLocal
        from app.models.user import User
        
        print("Connecting to DB...")
        async with AsyncSessionLocal() as db:
            # Create Owner
            res = await db.execute(select(User).where(User.email == email_owner))
            owner = res.scalar_one_or_none()
            if not owner:
                owner = User(email=email_owner, full_name="Owner User", is_active=True)
                db.add(owner)
                await db.commit()
                await db.refresh(owner)
            
            # Create Buyer
            res = await db.execute(select(User).where(User.email == email_buyer))
            buyer = res.scalar_one_or_none()
            if not buyer:
                buyer = User(email=email_buyer, full_name="Buyer User", is_active=True)
                db.add(buyer)
                await db.commit()
                await db.refresh(buyer)
            
            owner_id = owner.user_id
            buyer_id = buyer.user_id
            print(f"Owner ID: {owner_id}, Buyer ID: {buyer_id}")

            # Generate Tokens
            token_owner = create_access_token({"sub": str(owner_id)})
            token_buyer = create_access_token({"sub": str(buyer_id)})
            
            # Create Land (Owner)
            land_data = {
                "title": "Test Land for Request",
                "description": "Lovely land",
                "price_amount": 10000,
                "area_sq_m": 500,
                "status": "available", # Request schema defaults? No, endpoint sets it.
                # Endpoint args:
                "address_line": "123 Way",
                "city": "Test City"
            }
            
            # Direct DB creation for Land is easier or use API?
            # API tests full stack.
            
        # Headers
        headers_owner = {"Authorization": f"Bearer {token_owner}"}
        headers_buyer = {"Authorization": f"Bearer {token_buyer}"}

        # 2. Create Land (Owner)
        print("Creating Land...")
        resp = await ac.post("/lands", json=land_data, headers=headers_owner)
        if resp.status_code != 201:
            print(f"Failed to create land: {resp.text}")
            return
        land_id = resp.json()["land_id"]
        print(f"Land Created: {land_id}")

        # 3. Request to Buy (Buyer)
        print("Requesting to buy...")
        resp = await ac.post(f"/lands/{land_id}/request", headers=headers_buyer)
        if resp.status_code != 201:
             print(f"Failed to request land: {resp.text}")
             return
        req_data = resp.json()
        request_id = req_data["request_id"]
        print(f"Request Created: {request_id}, Status: {req_data['status']}")

        # 4. Check My Requests (Buyer)
        print("Checking My Requests...")
        resp = await ac.get("/lands/requests/me", headers=headers_buyer)
        my_reqs = resp.json()
        assert any(r["request_id"] == request_id for r in my_reqs)
        print("Request found in my list.")

        # 5. Accept Request (Owner)
        print("Accepting Request...")
        resp = await ac.post(f"/lands/requests/{request_id}/accept", headers=headers_owner)
        if resp.status_code != 200:
             print(f"Failed to accept request: {resp.text}")
             return
        final_req = resp.json()
        print(f"Request Status: {final_req['status']}")
        assert final_req["status"] == "accepted"
        
        # Verify Land Status is reserved
        resp = await ac.get(f"/lands/{land_id}")
        land_info = resp.json()
        print(f"Land Status: {land_info['status']}")
        assert land_info["status"] == "reserved"

        print("Verification Successful!")

if __name__ == "__main__":
    asyncio.run(verify())

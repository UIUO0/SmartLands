import asyncio

from httpx import AsyncClient
from app.main import app
from app.models.user import User
from app.core.security import get_current_user
from app.db.database import get_db, AsyncSessionLocal

# Mock User
mock_user = User(
    user_id=999,
    email="test@memory.com",
    full_name="Memory Tester",
    role="user",
    is_active=True
)

async def override_get_current_user():
    return mock_user

app.dependency_overrides[get_current_user] = override_get_current_user

async def verify_memory():
    # Ensure DB tables exist (including new one)
    from app.db.database import engine, Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print("Verifying AI Memory...")
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # 1. State Name
        print("Sending: My name is Dady Jojo")
        resp1 = await ac.post("/ai/chat", json={"message": "My name is Dady Jojo"})
        print(f"Response 1: {resp1.json()}")
        
        # 2. Ask Name
        print("Sending: What is my name?")
        resp2 = await ac.post("/ai/chat", json={"message": "What is my name?"})
        answer = resp2.json()["response"]
        print(f"Response 2: {answer}")
        
        if "Dady" in answer or "Jojo" in answer:
            print("SUCCESS: AI remembered the name!")
        else:
            print("FAILED: AI did not remember the name.")

if __name__ == "__main__":
    asyncio.run(verify_memory())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import ping_database

from app.routers.auth import router as auth_router
from app.routers.users import router as users_router

app = FastAPI(title="Smart Lands API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # لاحقًا: حدده بدومين Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/health/db")
async def health_db():
    ok = await ping_database()
    return {"status": "ok", "database": "connected" if ok else "error"}

# Include routers
app.include_router(auth_router)
app.include_router(users_router)

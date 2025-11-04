from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import ping_database

app = FastAPI(title="Smart Lands API", version="1.0")

# CORS — مؤقتًا نسمح للجميع، لاحقًا حدده بدومين Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # TODO: غيّرها لاحقًا
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Basic health
@app.get("/health")
def health_check():
    return {"status": "ok"}

# DB health
@app.get("/health/db")
async def health_db():
    ok = await ping_database()
    return {"status": "ok", "database": "connected" if ok else "error"}

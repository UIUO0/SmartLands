from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import ping_database

app = FastAPI(title="Smart Lands API", version="1.0")

# CORS مؤقتًا مفتوح — لاحقًا حدده على دومين Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

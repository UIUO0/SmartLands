import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

import cloudinary

from app.db.database import ping_database
from app.routers.lands import router as lands_router
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router

# ===== Logging Configuration =====
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("smartlands")

# ===== Cloudinary Configuration =====
cloudinary_url = os.getenv("CLOUDINARY_URL")
if cloudinary_url:
    # Fix common user error: remove < and > placeholders
    if "<" in cloudinary_url or ">" in cloudinary_url:
        logger.warning("Found placeholders <> in CLOUDINARY_URL, attempting to fix...")
        cloudinary_url = cloudinary_url.replace("<", "").replace(">", "")
        os.environ["CLOUDINARY_URL"] = cloudinary_url # Update env var for library to pick up

    # If CLOUDINARY_URL is present, we let cloudinary library handle it, 
    # OR we can just pass nothing to config which defaults to env var.
    # However, sometimes we need 'secure=True'.
    cloudinary.config(secure=True)
else:
    # Explicit config from individual vars
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET"),
        secure=True
    )

# ===== Lifespan Events =====
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("🚀 Starting Smart Lands API...")
    
    # Check required environment variables
    required_vars = ["DATABASE_URL", "JWT_SECRET"]
    missing = [v for v in required_vars if not os.getenv(v)]
    if missing:
        logger.error("❌ Missing environment variables: %s", missing)
        raise RuntimeError(f"Missing required environment variables: {missing}")
    
    # Warn about optional services
    if not os.getenv("CLOUDINARY_CLOUD_NAME") and not os.getenv("CLOUDINARY_URL"):
        logger.warning("⚠️ Cloudinary not configured - image uploads will fail")
    
    if not os.getenv("SENDGRID_API_KEY"):
        logger.warning("⚠️ SendGrid not configured - email sending will fail")
    
    # Test database connection
    db_ok = await ping_database()
    if db_ok:
        logger.info("✅ Database connection successful")
    else:
        logger.error("❌ Database connection failed")
        raise RuntimeError("Failed to connect to database")
    
    logger.info("✅ Smart Lands API started successfully")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Smart Lands API...")

# ===== FastAPI App =====
app = FastAPI(
    title="Smart Lands API",
    version="1.0.0",
    description="Real estate platform API for land trading, auctions, and management",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ===== CORS Middleware =====
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # Configure in Railway: ALLOWED_ORIGINS=https://yourdomain.com
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== Global Exception Handlers =====

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions"""
    logger.warning(
        "HTTP %s: %s %s - %s",
        exc.status_code,
        request.method,
        request.url.path,
        exc.detail
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "path": request.url.path,
            "method": request.method
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle request validation errors"""
    # Fix: Use jsonable_encoder to handle non-serializable objects like ValueError
    from fastapi.encoders import jsonable_encoder
    
    logger.warning(
        "Validation error on %s %s: %s",
        request.method,
        request.url.path,
        exc.errors()
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=jsonable_encoder({
            "detail": "Validation error",
            "errors": exc.errors(),
            "path": request.url.path
        })
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all uncaught exceptions"""
    logger.error(
        "UNHANDLED ERROR on %s %s: %s",
        request.method,
        request.url.path,
        exc,
        exc_info=True
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error",
            "path": request.url.path,
            "method": request.method,
            # Only expose error details in development
            "error": str(exc) if os.getenv("DEBUG", "false").lower() == "true" else None
        }
    )

# ===== Health Check Endpoints =====

@app.get("/health", tags=["health"])
def health_check():
    """Basic health check"""
    return {
        "status": "ok",
        "service": "Smart Lands API",
        "version": "1.0.0"
    }


@app.get("/health/db", tags=["health"])
async def health_db():
    """Database health check"""
    ok = await ping_database()
    return {
        "status": "ok" if ok else "error",
        "database": "connected" if ok else "disconnected"
    }

# ===== Include Routers =====
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(lands_router)

# ===== Root Endpoint =====
@app.get("/", tags=["root"])
def read_root():
    """API root endpoint"""
    return {
        "message": "Welcome to Smart Lands API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health",
        "endpoints": {
            "auth": "/auth",
            "users": "/users",
            "lands": "/lands"
        }
    }


# ===== Optional: Admin Debug Endpoint (Development Only) =====
if os.getenv("ENVIRONMENT", "production") == "development":
    @app.get("/__dev/info", tags=["development"])
    def dev_info():
        """Development info (only available in dev environment)"""
        return {
            "environment": os.getenv("ENVIRONMENT"),
            "database_configured": bool(os.getenv("DATABASE_URL")),
            "cloudinary_configured": bool(os.getenv("CLOUDINARY_CLOUD_NAME")),
            "sendgrid_configured": bool(os.getenv("SENDGRID_API_KEY")),
            "jwt_configured": bool(os.getenv("JWT_SECRET")),
        }
    logger.info("🔧 Development mode: Debug info endpoint enabled at /__dev/info")
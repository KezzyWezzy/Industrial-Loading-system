"""
Main FastAPI application for Industrial Loading System
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import get_settings
from app.core.database import init_db, check_database_connection

# Import routers
from app.modules.auth.routes import router as auth_router
from app.modules.tanks.routes import router as tanks_router
from app.modules.loading_bays.routes import router as loading_bays_router
from app.modules.transactions.routes import router as transactions_router
from app.modules.facilities.routes import router as facilities_router
from app.modules.reporting.routes import router as reporting_router
from app.modules.system.routes import router as system_router

# Get settings
settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Industrial Loading System API"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(tanks_router)
app.include_router(loading_bays_router)
app.include_router(transactions_router)
app.include_router(facilities_router)
app.include_router(reporting_router)
app.include_router(system_router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Industrial Loading System API",
        "version": settings.app_version,
        "status": "operational"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    db_healthy = check_database_connection()
    return {
        "status": "healthy" if db_healthy else "unhealthy",
        "database": "connected" if db_healthy else "disconnected",
        "version": settings.app_version
    }


@app.on_event("startup")
async def startup_event():
    """Application startup"""
    print(f"Starting {settings.app_name} v{settings.app_version}")
    if settings.ENVIRONMENT == "development":
        init_db()

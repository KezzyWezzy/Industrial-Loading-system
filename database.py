"""
Database configuration and shared base class
"""
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.config.settings import get_settings
import logging

# Get settings
settings = get_settings()

# Configure logging
logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL.upper()))
logger = logging.getLogger(__name__)

# SHARED BASE CLASS - All models should import this Base
Base = declarative_base()

# Database configuration
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=settings.debug
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Database session dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database - create all tables"""
    try:
        # Import all models to register them
        from app.modules.auth.models import User, AuditLog, UserSession, Role, Permission
        from app.modules.facilities.models import Facility, Product, Customer, Carrier
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        return True
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        return False


def check_database_connection():
    """Check database connection"""
    try:
        with engine.connect() as connection:
            result = connection.execute("SELECT 1")
            result.fetchone()
        logger.info("Database connection successful")
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False

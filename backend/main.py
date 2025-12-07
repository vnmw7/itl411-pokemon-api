# backend/main.py
"""
System: ITL411 Pokémon API
Module: Main Application
File URL: backend/main.py
Purpose: FastAPI application initialization, configuration, and lifespan management.
"""

import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Imports for Rate Limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Import configuration and services
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.config import settings
from backend.services.pokeapi_client import pokeapi_client
from backend.services.recommender_service import recommender_service
from backend.api.v1.routes import create_v1_router

logger = logging.getLogger(__name__)

# Initialize Rate Limiter
limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manages application lifespan events."""
    # --- Startup ---
    logger.info("Application starting up...")
    
    # Initialize ML model and data index asynchronously
    recommender_success = await recommender_service.initialize()
    if not recommender_success:
        logger.warning("Recommender initialization failed. ML and Search features will be unavailable.")
            
    yield
    
    # --- Shutdown ---
    logger.info("Application shutting down...")
    # Close the HTTP client connection pool
    await pokeapi_client.close()

# Initialize FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="A modern backend API utilizing PokeAPI and Machine Learning, adhering to 2025 best practices.",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# --- Middleware Configuration ---

# Rate Limiting Configuration
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Configuration (Restrictive)
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type"],
        max_age=600,
    )

# --- Include Routers ---
v1_router = create_v1_router(limiter)
app.include_router(v1_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["System"])
async def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} v1.0.0. Access documentation at /docs."}

@app.get("/health", tags=["System"])
async def health_check():
    try:
        # Test PokeAPI connectivity
        await pokeapi_client.fetch_data(f"{settings.POKEAPI_BASE_URL}pokemon/1")
        pokeapi_status = "connected"
    except HTTPException:
        pokeapi_status = "unreachable"
    except Exception as error:
        logger.warning("Unexpected error during PokeAPI health check: %s", error)
        pokeapi_status = "unknown"
    
    # Get cache information
    cache_info = getattr(pokeapi_client.fetch_data, 'cache_info', lambda: {"hits": 0, "misses": 0})()
    
    return {
        "status": "healthy" if recommender_service.initialized else "degraded",
        "ml_service": "initialized" if recommender_service.initialized else "unavailable",
        "pokeapi_connectivity": pokeapi_status,
        "cache_stats": cache_info,
        "dataset_size": len(recommender_service.df) if recommender_service.df is not None else 0
    }

if __name__ == "__main__":
    # For running the application directly (e.g., for debugging)
    logger.info("Starting Uvicorn server on http://127.0.0.1:8010")
    # Use reload=False because initialization takes a long time
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8010, reload=False)

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
    
    # Start initialization in background, don't wait for it to complete
    # This allows the app to respond to health checks immediately
    import asyncio
    asyncio.create_task(recommender_service.initialize())
            
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
    # Quick health check that doesn't wait for initialization
    # This ensures the app responds immediately to DigitalOcean health checks
    return {
        "status": "healthy",
        "ml_service": "initialized" if recommender_service.initialized else "initializing"
    }

if __name__ == "__main__":
    import os
    # Use PORT environment variable if available (required for DigitalOcean), default to 8010 for local development
    port = int(os.environ.get("PORT", 8010))
    logger.info(f"Starting Uvicorn server on http://0.0.0.0:{port}")
    # Use reload=False because initialization takes a long time
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=False)

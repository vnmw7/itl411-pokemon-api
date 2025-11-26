# backend/config.py
"""
System: ITL411 Pokémon API
Module: Configuration
File URL: backend/config.py
Purpose: Manages application settings using Pydantic Settings.
"""
from pydantic_settings import BaseSettings
import logging.config

# Configure logging globally with structured format
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
        },
    },
    "root": {
        "level": "INFO",
        "handlers": ["console"],
    },
}

logging.config.dictConfig(LOGGING_CONFIG)

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "ITL411 Pokémon Recommendation API"
    POKEAPI_BASE_URL: str = "https://pokeapi.co/api/v2/"
    HTTP_TIMEOUT: float = 15.0
    INIT_TIMEOUT: float = 120.0 # Timeout for initialization data fetching

    # Cache settings (1 hour TTL)
    CACHE_TTL_SECONDS: int = 3600
    CACHE_MAX_SIZE: int = 512

    # CORS settings
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # ML Model parameters
    DBSCAN_EPS: float = 1.5
    DBSCAN_MIN_SAMPLES: int = 3
    ML_DATASET_LIMIT: int = 1025 # Standard Pokémon count

settings = Settings()
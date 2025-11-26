# backend/utils/cache.py
"""
System: ITL411 Pokémon API
Module: Utilities
File URL: backend/utils/cache.py
Purpose: Provides caching decorators.
"""
from cachetools import TTLCache
from asyncache import cached
from backend.config import settings

# Time-To-Live (TTL) Cache decorator for async functions
def async_ttl_cache(ttl=settings.CACHE_TTL_SECONDS, maxsize=settings.CACHE_MAX_SIZE):
    return cached(TTLCache(maxsize=maxsize, ttl=ttl))
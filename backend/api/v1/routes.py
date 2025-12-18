# backend/api/v1/routes.py
"""
System: ITL411 Pokémon API
Module: API v1 Routes
File URL: backend/api/v1/routes.py
Purpose: Defines the API endpoints (v1) for Pokémon data and recommendations.
"""

from fastapi import APIRouter, Query, HTTPException, Depends, Request, Path
from typing import Optional
import logging
import asyncio

from backend.api.models import StandardResponse
from backend.services.pokeapi_client import pokeapi_client, PokeApiClient
from backend.services.recommender_service import recommender_service, RecommenderService
from slowapi import Limiter

logger = logging.getLogger(__name__)

# Dependency injection helpers
def get_pokeapi_client() -> PokeApiClient:
    return pokeapi_client

def get_recommender_service() -> RecommenderService:
    if not recommender_service.initialized:
        raise HTTPException(status_code=503, detail="Recommendation and Search services are currently unavailable (initialization incomplete).")
    return recommender_service

def create_v1_router(limiter: Limiter) -> APIRouter:
    router = APIRouter()

    # Feature 1 & 4: Pokémon list and Search by Type
    @router.get("/pokemon", response_model=StandardResponse, tags=["Pokémon Data"])
    @limiter.limit("100/minute")
    async def get_pokemon_list(
        request: Request,
        limit: int = Query(20, ge=1, le=100),
        offset: int = Query(0, ge=0),
        type: Optional[str] = Query(None),
        client: PokeApiClient = Depends(get_pokeapi_client)
    ):
        """Retrieves a list of Pokémon. Supports pagination and type filtering."""
        if type:
            data = await client.get_by_type(type, limit, offset)
        else:
            data = await client.get_list(limit, offset)
        return StandardResponse(data=data)

    # Feature 4: Search by Pokémon name
    @router.get("/pokemon/search", response_model=StandardResponse, tags=["Pokémon Data"])
    @limiter.limit("120/minute")
    async def search_pokemon(
        request: Request,
        # Input validation for name (allowing letters, numbers, hyphens, and spaces)
        name: str = Query(..., min_length=1, max_length=50, pattern="^[a-zA-Z0-9- ]+$"),
        recommender: RecommenderService = Depends(get_recommender_service),
        client: PokeApiClient = Depends(get_pokeapi_client)
    ):
        """Searches for Pokémon by name using the locally cached ML dataset."""
        # 1. Search the local index
        matched_names = recommender.search_by_name(name)
        
        # 2. Fetch details for the matches concurrently
        results = await client.get_details_by_names(matched_names)
        
        return StandardResponse(data={"count": len(results), "results": results})

    # Feature 2: Stats (HP, attack, defense, abilities)
    @router.get("/pokemon/{name_or_id}", response_model=StandardResponse, tags=["Pokémon Data"])
    @limiter.limit("100/minute")
    async def get_pokemon_details(
        request: Request,
        name_or_id: str = Path(...),
        client: PokeApiClient = Depends(get_pokeapi_client)
    ):
        """Retrieves detailed information for a specific Pokémon."""
        details = await client.get_details(name_or_id)
        return StandardResponse(data=details.model_dump())

    # Feature 3: Evolution chain
    @router.get("/pokemon/{name_or_id}/evolution", response_model=StandardResponse, tags=["Pokémon Data"])
    @limiter.limit("60/minute")
    async def get_pokemon_evolution_chain(
        request: Request,
        name_or_id: str,
        client: PokeApiClient = Depends(get_pokeapi_client)
    ):
        """Retrieves the evolution chain for a specific Pokémon."""
        data = await client.get_evolution_chain(name_or_id)
        return StandardResponse(data=data, message=data.get("message"))

    # Feature 5: Make use of the machine learning
    @router.get("/recommend/{pokemon_name}", response_model=StandardResponse, tags=["Machine Learning"])
    @limiter.limit("60/minute")
    async def get_recommendations(
        request: Request,
        pokemon_name: str = Path(..., min_length=1, max_length=50, pattern="^[a-zA-Z0-9- ]+$"),
        num: int = Query(5, ge=1, le=10),
        recommender: RecommenderService = Depends(get_recommender_service),
        client: PokeApiClient = Depends(get_pokeapi_client)
    ):
        """Provides Pokémon recommendations based on the ML model (DBSCAN)."""
        # 1. Get recommendations (names) from the ML model.
        # Run synchronous ML logic in a thread pool to avoid blocking the event loop.
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(None, recommender.get_recommendations, pokemon_name, num)
        
        if "error" in result:
            status_code = 404 if "not found" in result["error"] else 500
            raise HTTPException(status_code=status_code, detail=result["error"])

        recommended_objects = result.get("recommendations", [])
        
        if not recommended_objects:
            return StandardResponse(data=result, message=result.get("message"))

        # 2. Enhance recommendations with details from PokeAPI
        # Extract names from the recommendation objects for the API call
        names_to_fetch = [r["name"] for r in recommended_objects]
        
        # Fetch details (images, types)
        api_details_list = await client.get_details_by_names(names_to_fetch)
        
        # Create a lookup map for faster merging
        api_details_map = {d.name.lower(): d for d in api_details_list}

        # Merge API data back into the recommendation objects to preserve ML stats (similarity, etc.)
        for rec in recommended_objects:
            name_key = rec["name"].lower()
            if name_key in api_details_map:
                detail = api_details_map[name_key]
                rec["image"] = detail.image
                rec["types"] = detail.types
                # Ensure ID matches API (optional but good for consistency)
                if detail.id:
                    rec["id"] = detail.id

        result["recommendations"] = recommended_objects

        return StandardResponse(data=result)

    # Feature 6: Cluster visualization for DBSCAN scatter plot
    @router.get("/cluster-visualization", response_model=StandardResponse, tags=["Machine Learning"])
    @limiter.limit("30/minute")
    async def get_cluster_visualization(
        request: Request,
        recommender: RecommenderService = Depends(get_recommender_service)
    ):
        """Returns 2D PCA projection of all Pokemon for cluster visualization scatter plot."""
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(None, recommender.get_cluster_visualization)

        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        return StandardResponse(data=result)

    return router
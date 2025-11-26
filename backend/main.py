"""
System: ITL411 Pokémon API
Module: Pokémon Recommendation API
File URL: backend/main.py
Purpose: FastAPI application for Pokémon recommendation system
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os

from pokemon_recommender import PokemonRecommender

# Initialize FastAPI app
app = FastAPI(
    title="Pokémon Recommendation API",
    description="Find similar Pokémon using DBSCAN clustering algorithm",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the recommender system
recommender = PokemonRecommender(use_local_data=True, eps=1.5, min_samples=3)

# Pydantic models for request/response
class PokemonRecommendationRequest(BaseModel):
    pokemon_name: str

class PokemonRecommendationResponse(BaseModel):
    similar_pokemon: Optional[List[Dict[str, Any]]] = None
    cluster: Optional[int] = None
    message: Optional[str] = None
    error: Optional[str] = None

class PokemonInfo(BaseModel):
    name: str
    type1: str
    type2: str
    cluster: int

class PokemonListResponse(BaseModel):
    pokemon: List[PokemonInfo]

class ClusterInfoResponse(BaseModel):
    cluster_counts: Dict[str, int]
    total_pokemon: int
    parameters: Dict[str, float]

class VisualizationResponse(BaseModel):
    image: str
    error: Optional[str] = None

# Startup event to initialize the recommender
@app.on_event("startup")
async def startup_event():
    """Initialize the recommender system on startup."""
    success = recommender.initialize()
    if not success:
        raise RuntimeError("Failed to initialize the Pokémon recommender system")

# API Endpoints
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Pokémon Recommendation API",
        "description": "Find similar Pokémon using DBSCAN clustering algorithm",
        "version": "1.0.0",
        "endpoints": {
            "recommendations": "/recommend/{pokemon_name}",
            "all_pokemon": "/pokemon",
            "cluster_info": "/clusters",
            "visualization": "/visualization",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "recommender_initialized": recommender.df is not None}

@app.get("/recommend/{pokemon_name}", response_model=PokemonRecommendationResponse)
async def get_recommendations(pokemon_name: str):
    """Get Pokémon recommendations for a given Pokémon name."""
    try:
        result = recommender.get_recommendations(pokemon_name)
        
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        
        if "message" in result:
            return PokemonRecommendationResponse(message=result["message"])
        
        return PokemonRecommendationResponse(
            similar_pokemon=result["similar_pokemon"],
            cluster=result["cluster"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend", response_model=PokemonRecommendationResponse)
async def get_recommendations_post(request: PokemonRecommendationRequest):
    """Get Pokémon recommendations using POST method."""
    return await get_recommendations(request.pokemon_name)

@app.get("/pokemon", response_model=PokemonListResponse)
async def get_all_pokemon():
    """Get a list of all Pokémon in the dataset."""
    try:
        pokemon_list = recommender.get_all_pokemon()
        if "error" in pokemon_list:
            raise HTTPException(status_code=500, detail=pokemon_list["error"])
        
        return PokemonListResponse(pokemon=pokemon_list)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/clusters", response_model=ClusterInfoResponse)
async def get_cluster_info():
    """Get information about the clusters."""
    try:
        cluster_info = recommender.get_cluster_info()
        if "error" in cluster_info:
            raise HTTPException(status_code=500, detail=cluster_info["error"])
        
        return ClusterInfoResponse(**cluster_info)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/visualization", response_model=VisualizationResponse)
async def get_visualization():
    """Get a visualization of the clusters."""
    try:
        image_data = recommender.get_visualization()
        if "error" in image_data:
            raise HTTPException(status_code=500, detail=image_data["error"])
        
        return VisualizationResponse(image=image_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/pokemon/search/{search_term}")
async def search_pokemon(search_term: str):
    """Search for Pokémon by name (partial match)."""
    try:
        if recommender.df is None:
            raise HTTPException(status_code=500, detail="Recommender system not initialized")
        
        # Case-insensitive partial search
        search_term = search_term.lower()
        matching_pokemon = recommender.df[
            recommender.df['name'].str.lower().str.contains(search_term)
        ][['name', 'type1', 'type2', 'cluster']].to_dict('records')
        
        return {"results": matching_pokemon}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
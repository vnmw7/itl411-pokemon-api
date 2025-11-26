# backend/api/models.py
"""
System: ITL411 Pokémon API
Module: API Models
File URL: backend/api/models.py
Purpose: Defines Pydantic models for request validation and response structure.
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any

# --- Core Pokemon Models ---

class PokemonSummary(BaseModel):
    id: int
    name: str
    types: List[str]
    image: Optional[str]

class PokemonDetail(PokemonSummary):
    stats: Dict[str, int]
    abilities: List[str]

# Recursive model for evolution chain
class EvolutionNode(BaseModel):
    id: Optional[int] = None
    name: str
    image: Optional[str] = None
    types: Optional[List[str]] = None
    evolves_to: List['EvolutionNode'] = []

EvolutionNode.model_rebuild()

# --- Response Models (Standardized) ---

class StandardResponse(BaseModel):
    success: bool = True
    data: Optional[Dict[str, Any] | List[Any]] = None
    message: Optional[str] = None

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    error_code: str
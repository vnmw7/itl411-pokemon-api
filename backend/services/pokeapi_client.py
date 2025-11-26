# backend/services/pokeapi_client.py
"""
System: ITL411 Pokémon API
Module: Services
File URL: backend/services/pokeapi_client.py
Purpose: Manages interactions with PokeAPI, including async fetching, caching, and formatting.
"""

import httpx
import asyncio
from fastapi import HTTPException
from typing import List, Dict, Optional, Any
import logging
from backend.config import settings
from backend.api.models import PokemonSummary, PokemonDetail, EvolutionNode
from backend.utils.cache import async_ttl_cache

logger = logging.getLogger(__name__)

class PokeApiClient:
    def __init__(self, timeout: float):
        self.client = httpx.AsyncClient(timeout=timeout, headers={"User-Agent": "ITL411-Pokemon-API/1.0"})

    async def close(self):
        await self.client.aclose()

    @async_ttl_cache()
    async def fetch_data(self, url: str) -> dict:
        """Asynchronously fetches data from a URL with TTL caching."""
        try:
            response = await self.client.get(url)
            response.raise_for_status()
            return response.json()
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="PokeAPI request timed out")
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise HTTPException(status_code=404, detail="Resource not found on PokeAPI")
            logger.warning(f"Error from PokeAPI (URL: {url}): {e.response.status_code}")
            raise HTTPException(status_code=502, detail="Error fetching data from PokeAPI")
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Cannot connect to PokeAPI")

    # --- Formatting Helpers ---

    def _format_summary(self, data: dict) -> Optional[PokemonSummary]:
        try:
            sprites = data.get('sprites', {})
            image = (sprites.get('other', {}).get('official-artwork', {}).get('front_default') or 
                     sprites.get('front_default'))
            
            return PokemonSummary(
                id=data.get("id"),
                name=data.get("name"),
                types=[t["type"]["name"] for t in data.get("types", [])],
                image=image
            )
        except Exception as e:
            logger.warning(f"Failed to format summary for data ID {data.get('id')}: {e}")
            return None

    def _format_detail(self, data: dict) -> Optional[PokemonDetail]:
        summary = self._format_summary(data)
        if not summary:
            return None
        
        try:
            stats_dict = {stat['stat']['name']: stat['base_stat'] for stat in data.get('stats', [])}
            abilities = [a['ability']['name'] for a in data.get('abilities', [])]

            return PokemonDetail(
                **summary.model_dump(),
                stats=stats_dict,
                abilities=abilities
            )
        except Exception as e:
            logger.warning(f"Failed to format details for data ID {data.get('id')}: {e}")
            return None

    async def fetch_concurrently(self, urls: List[str], formatter_func) -> List[Any]:
        tasks = [self.fetch_data(url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        formatted_results = []
        for result in results:
            if isinstance(result, dict):
                formatted = formatter_func(result)
                if formatted:
                    formatted_results.append(formatted)
            elif isinstance(result, Exception):
                logger.warning(f"Skipping result due to fetch error: {result}")
        
        # Sort by ID for consistency
        formatted_results.sort(key=lambda x: x.id)
        return formatted_results

    # --- Service Methods ---

    async def get_list(self, limit: int, offset: int) -> Dict[str, Any]:
        data = await self.fetch_data(f"{settings.POKEAPI_BASE_URL}pokemon?limit={limit}&offset={offset}")
        urls = [p['url'] for p in data.get('results', [])]
        results = await self.fetch_concurrently(urls, self._format_summary)
        return {"count": data.get('count', 0), "results": results}

    async def get_by_type(self, type_filter: str, limit: int, offset: int) -> Dict[str, Any]:
        try:
            data = await self.fetch_data(f"{settings.POKEAPI_BASE_URL}type/{type_filter.lower()}")
        except HTTPException as e:
            if e.status_code == 404:
                 raise HTTPException(status_code=404, detail=f"Type '{type_filter}' not found.")
            raise e

        all_pokemon = [p['pokemon']['url'] for p in data.get('pokemon', [])]
        paginated_urls = all_pokemon[offset:offset+limit]
        
        results = await self.fetch_concurrently(paginated_urls, self._format_summary)
        return {"count": len(all_pokemon), "results": results}

    async def get_details_by_names(self, names: List[str]) -> List[PokemonSummary]:
        """Fetches details for a list of names concurrently."""
        urls = [f"{settings.POKEAPI_BASE_URL}pokemon/{name.lower()}" for name in names]
        results = await self.fetch_concurrently(urls, self._format_summary)
        return results

    async def get_details(self, name_or_id: str) -> PokemonDetail:
        try:
            url = f"{settings.POKEAPI_BASE_URL}pokemon/{str(name_or_id).lower().strip()}"
            data = await self.fetch_data(url)
        except HTTPException as e:
            if e.status_code == 404:
                 raise HTTPException(status_code=404, detail=f"Pokémon '{name_or_id}' not found.")
            raise e
            
        details = self._format_detail(data)
        if not details:
             raise HTTPException(status_code=500, detail="Failed to process Pokémon details.")
        return details

    async def get_evolution_chain(self, name_or_id: str) -> Dict[str, Any]:
        # 1. Get species data
        try:
            species_data = await self.fetch_data(f"{settings.POKEAPI_BASE_URL}pokemon-species/{str(name_or_id).lower().strip()}")
        except HTTPException as e:
            if e.status_code == 404:
                return {"chain": None, "message": f"Species data for '{name_or_id}' not found."}
            raise e
        
        if not species_data.get('evolution_chain') or not species_data['evolution_chain'].get('url'):
             return {"chain": None, "message": "No evolution chain available."}

        # 2. Get evolution chain data
        evolution_data = await self.fetch_data(species_data['evolution_chain']['url'])

        # 3. Process structure and extract names
        def process_and_extract_names(chain_link):
            names = [chain_link['species']['name']]
            structure = EvolutionNode(name=names[0], evolves_to=[])
            for evolution in chain_link.get('evolves_to', []):
                child_names, child_structure = process_and_extract_names(evolution)
                names.extend(child_names)
                structure.evolves_to.append(child_structure)
            return names, structure

        all_names, evolution_structure = process_and_extract_names(evolution_data['chain'])
        unique_names = list(set(all_names))
        
        # 4. Fetch details concurrently
        details_list = await self.get_details_by_names(unique_names)
        details_map = {p.name: p for p in details_list}

        # 5. Enhance the structure
        def enhance_chain_structure(node: EvolutionNode):
            details = details_map.get(node.name)
            if details:
                node.id = details.id
                node.image = details.image
                node.types = details.types
            for child in node.evolves_to:
                enhance_chain_structure(child)
        
        enhance_chain_structure(evolution_structure)
            
        return {"chain": evolution_structure}

# Singleton instance
pokeapi_client = PokeApiClient(timeout=settings.HTTP_TIMEOUT)
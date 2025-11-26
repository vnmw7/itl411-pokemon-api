# backend/services/recommender_service.py
"""
System: ITL411 Pokémon API
Module: Services
File URL: backend/services/recommender_service.py
Purpose: Manages the ML model (DBSCAN), data initialization from PokeAPI, and search indexing.
"""
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import DBSCAN
from sklearn.impute import SimpleImputer
from sklearn.metrics.pairwise import euclidean_distances
import logging
import httpx
import asyncio
from backend.config import settings

logger = logging.getLogger(__name__)

class RecommenderService:
    def __init__(self, eps, min_samples, limit):
        self.eps = eps
        self.min_samples = min_samples
        self.limit = limit
        self.df = None
        self.scaler = StandardScaler()
        self.model = DBSCAN(eps=self.eps, min_samples=self.min_samples)
        self.initialized = False
        self.features = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']

    async def _fetch_pokemon_details(self, client, url):
        """Helper to fetch details for a single Pokémon."""
        try:
            res = await client.get(url)
            if res.status_code == 200:
                data = res.json()
                stats = {s['stat']['name']: s['base_stat'] for s in data['stats']}
                
                return {
                    'id': data['id'],
                    'name': data['name'],
                    **{f: stats.get(f) for f in self.features}
                }
        except Exception as e:
            logger.warning(f"Failed to fetch or process data from {url}: {e}")
        return None

    async def initialize(self):
        """Fetches data from PokeAPI asynchronously, preprocesses it, and trains the model."""
        if self.initialized:
            return True
            
        logger.info(f"Initializing Recommender Service: Fetching {self.limit} Pokémon...")
        
        try:
            # Use a dedicated client with a longer timeout for initialization
            async with httpx.AsyncClient(timeout=settings.INIT_TIMEOUT) as client:
                # 1. Get the list of URLs
                response = await client.get(f"{settings.POKEAPI_BASE_URL}pokemon?limit={self.limit}")
                response.raise_for_status()
                pokemon_list = response.json().get('results', [])
                
                # 2. Concurrently fetch details
                tasks = [self._fetch_pokemon_details(client, p['url']) for p in pokemon_list]
                pokemon_data = await asyncio.gather(*tasks)
                
                # 3. Create DataFrame
                self.df = pd.DataFrame([data for data in pokemon_data if data])
        
        except Exception as e:
            logger.error(f"Failed during data initialization from PokeAPI: {e}")
            return False

        if self.df is None or self.df.empty:
            logger.error("Initialization failed: No data loaded.")
            return False

        # 4. Preprocessing
        imputer = SimpleImputer(strategy='median')
        self.df[self.features] = imputer.fit_transform(self.df[self.features])
        X_scaled = self.scaler.fit_transform(self.df[self.features])

        # 5. Train Model (Clustering)
        logger.info("Running DBSCAN clustering...")
        # Run the potentially CPU-bound training in a thread pool
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, self.model.fit, X_scaled)
        
        self.df['cluster'] = self.model.labels_

        self.initialized = True
        logger.info(f"Initialization complete. Clustered {len(self.df)} Pokémon.")
        return True

    def search_by_name(self, query: str, max_results=50):
        """Searches the internal dataset for partial name matches."""
        if not self.initialized:
            return []

        # Standardize input for common variations (e.g., spaces replaced by hyphens in PokeAPI)
        search_term = query.lower().strip().replace(' ', '-')
        matching_rows = self.df[self.df['name'].str.lower().str.contains(search_term)]
        
        return matching_rows.head(max_results)['name'].tolist()

    def get_recommendations(self, pokemon_name: str, num_recommendations=5):
        """Finds Pokémon in the same cluster. This runs synchronously."""
        if not self.initialized:
            return {"error": "Recommender not initialized."}

        search_name = pokemon_name.strip().lower().replace(' ', '-')
        pokemon_info = self.df[self.df['name'].str.lower() == search_name]

        if pokemon_info.empty:
            return {"error": f"Pokémon '{pokemon_name}' not found in the dataset."}

        cluster = pokemon_info.iloc[0]['cluster']

        if cluster == -1:
            return {"message": f"'{pokemon_name}' is statistically unique (outlier). No similar Pokémon found.", "recommendations": []}

        # Find others in the same cluster
        recommendations = self.df[(self.df['cluster'] == cluster) & (self.df['name'].str.lower() != search_name)]
        
        if len(recommendations) > num_recommendations:
            # Order by distance to the input Pokémon for more deterministic results
            input_pokemon_features = self.df[self.df['name'].str.lower() == search_name][self.features].iloc[0]
            recommendation_features = recommendations[self.features]
            
            # Calculate distances
            distances = euclidean_distances(
                [input_pokemon_features],
                recommendation_features
            )[0]
            
            # Add distances to dataframe and sort by distance
            recommendations = recommendations.copy()
            recommendations['distance'] = distances
            recommendations = recommendations.sort_values('distance').head(num_recommendations)
            recommendations = recommendations.drop('distance', axis=1)

        recommended_names = recommendations['name'].tolist()
        
        return {
            "input_pokemon": pokemon_name,
            "cluster_id": int(cluster),
            "recommendations": recommended_names
        }

# Singleton instance
recommender_service = RecommenderService(
    eps=settings.DBSCAN_EPS, 
    min_samples=settings.DBSCAN_MIN_SAMPLES,
    limit=settings.ML_DATASET_LIMIT
)
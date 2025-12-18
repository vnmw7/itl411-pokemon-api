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
from sklearn.decomposition import PCA
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
        self.pca = None
        self.pca_coords = None

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

        # 6. Compute PCA for 2D cluster visualization
        logger.info("Computing PCA for cluster visualization...")
        self.pca = PCA(n_components=2)
        self.pca_coords = self.pca.fit_transform(X_scaled)
        self.df['pca_x'] = self.pca_coords[:, 0]
        self.df['pca_y'] = self.pca_coords[:, 1]

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
        """Finds Pokémon in the same cluster with stats and similarity scores."""
        if not self.initialized:
            return {"error": "Recommender not initialized."}

        search_name = pokemon_name.strip().lower().replace(' ', '-')
        pokemon_info = self.df[self.df['name'].str.lower() == search_name]

        if pokemon_info.empty:
            return {"error": f"Pokémon '{pokemon_name}' not found in the dataset."}

        input_row = pokemon_info.iloc[0]
        cluster = input_row['cluster']

        # Build input pokemon object with stats
        input_stats = {f: int(input_row[f]) for f in self.features}
        input_offensive = int(input_row['attack'] + input_row['special-attack'])
        input_defensive = int(input_row['defense'] + input_row['special-defense'])

        input_pokemon_data = {
            "id": int(input_row['id']),
            "name": input_row['name'],
            "stats": input_stats,
            "offensive_power": input_offensive,
            "defensive_power": input_defensive,
            "cluster_id": int(cluster)
        }

        if cluster == -1:
            return {
                "message": f"'{pokemon_name}' is statistically unique (outlier). No similar Pokémon found.",
                "input_pokemon": input_pokemon_data,
                "recommendations": []
            }

        # Find others in the same cluster
        recommendations_df = self.df[
            (self.df['cluster'] == cluster) &
            (self.df['name'].str.lower() != search_name)
        ].copy()

        if recommendations_df.empty:
            return {
                "input_pokemon": input_pokemon_data,
                "recommendations": []
            }

        # Calculate distances for all recommendations
        input_features = input_row[self.features].values.reshape(1, -1)
        rec_features = recommendations_df[self.features].values
        distances = euclidean_distances(input_features, rec_features)[0]
        recommendations_df['distance'] = distances

        # Sort by distance and limit
        recommendations_df = recommendations_df.sort_values('distance').head(num_recommendations)

        # Calculate similarity percentage using exponential decay
        # sigma scales the decay - smaller sigma = faster decay
        max_distance = distances.max() if len(distances) > 0 else 1.0
        sigma = max(max_distance / 2.0, 0.1)  # Avoid division by zero

        recommendations_list = []
        for _, row in recommendations_df.iterrows():
            rec_stats = {f: int(row[f]) for f in self.features}
            similarity = 100.0 * np.exp(-row['distance'] / sigma)

            recommendations_list.append({
                "id": int(row['id']),
                "name": row['name'],
                "stats": rec_stats,
                "offensive_power": int(row['attack'] + row['special-attack']),
                "defensive_power": int(row['defense'] + row['special-defense']),
                "similarity_percent": round(similarity, 1),
                "distance": round(float(row['distance']), 4)
            })

        return {
            "input_pokemon": input_pokemon_data,
            "recommendations": recommendations_list
        }

    def get_cluster_visualization(self):
        """Returns all Pokemon with meaningful axis coordinates for visualization."""
        if not self.initialized:
            return {"error": "Recommender not initialized."}

        # Calculate meaningful coordinates:
        # X-axis: Offensive Power = attack + special-attack
        # Y-axis: Defensive Power = defense + special-defense
        offensive_raw = self.df['attack'] + self.df['special-attack']
        defensive_raw = self.df['defense'] + self.df['special-defense']

        # Get min/max for axis info
        off_min, off_max = int(offensive_raw.min()), int(offensive_raw.max())
        def_min, def_max = int(defensive_raw.min()), int(defensive_raw.max())

        # Normalize to 0-100 scale for better visualization spread
        offensive_normalized = ((offensive_raw - off_min) / (off_max - off_min)) * 100
        defensive_normalized = ((defensive_raw - def_min) / (def_max - def_min)) * 100

        # Build response with meaningful coordinates and stats
        points = []
        for idx, row in self.df.iterrows():
            loc = self.df.index.get_loc(idx)
            points.append({
                "id": int(row['id']),
                "name": row['name'],
                "x": round(float(offensive_normalized.iloc[loc]), 2),
                "y": round(float(defensive_normalized.iloc[loc]), 2),
                "cluster": int(row['cluster']),
                "stats": {f: int(row[f]) for f in self.features},
                "offensive_power": int(offensive_raw.iloc[loc]),
                "defensive_power": int(defensive_raw.iloc[loc])
            })

        # Compute cluster metadata
        cluster_counts = self.df['cluster'].value_counts().to_dict()

        return {
            "points": points,
            "cluster_info": {
                "counts": {str(k): v for k, v in cluster_counts.items()},
                "total_clusters": len([c for c in cluster_counts.keys() if c != -1]),
                "outlier_count": cluster_counts.get(-1, 0)
            },
            "axis_info": {
                "x_label": "Offensive Power (Atk + SpA)",
                "y_label": "Defensive Power (Def + SpD)",
                "x_range": [off_min, off_max],
                "y_range": [def_min, def_max]
            }
        }

# Singleton instance
recommender_service = RecommenderService(
    eps=settings.DBSCAN_EPS, 
    min_samples=settings.DBSCAN_MIN_SAMPLES,
    limit=settings.ML_DATASET_LIMIT
)
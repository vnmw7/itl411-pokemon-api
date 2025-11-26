"""
System: ITL411 Pokémon API
Module: Pokémon Recommendation System
File URL: backend/pokemon_recommender.py
Purpose: Pokémon recommendation system using DBSCAN clustering algorithm
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.cluster import DBSCAN
from sklearn.compose import ColumnTransformer
from sklearn.decomposition import PCA
import matplotlib.pyplot as plt
import seaborn as sns
import urllib.request
import json
import io
import base64

# -----------------------------------------------------------------------------
# Data Acquisition Functions
# -----------------------------------------------------------------------------

def fetch_pokemon_data(limit=151):
    """Fetches Pokémon data from PokéAPI up to a specified limit using urllib."""
    print(f"Attempting to fetch data for {limit} Pokémon from PokéAPI...")
    url = f"https://pokeapi.co/api/v2/pokemon?limit={limit}"
    pokemon_data = []
    headers = {'User-Agent': 'Mozilla/5.0'}  # Adding User-Agent can prevent some API issues

    try:
        # Basic fetch of the list of Pokémon URLs
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            pokemon_list = data.get('results', [])
    except Exception as e:
        print(f"Failed to fetch Pokémon list from PokeAPI: {e}")
        return pd.DataFrame()

    print("Fetching individual Pokémon details...")
    for i, pokemon in enumerate(pokemon_list):
        if (i + 1) % 50 == 0:
            print(f"  Fetched {i + 1}/{len(pokemon_list)}")
            
        pokemon_url = pokemon['url']
        try:
            # Fetch details for individual Pokémon
            req = urllib.request.Request(pokemon_url, headers=headers)
            with urllib.request.urlopen(req) as response:
                pokemon_details = json.loads(response.read().decode())
        except Exception as e:
            print(f"Error fetching details for {pokemon['name']}: {e}")
            continue

        # Extract stats
        stats = pokemon_details['stats']
        stat_dict = {stat['stat']['name']: stat['base_stat'] for stat in stats}
        
        # Extract types
        types = [t['type']['name'].capitalize() for t in pokemon_details['types']]

        data = {
            'name': pokemon_details['name'].capitalize(),
            'hp': stat_dict.get('hp'),
            'attack': stat_dict.get('attack'),
            'defense': stat_dict.get('defense'),
            'special-attack': stat_dict.get('special-attack'),
            'special-defense': stat_dict.get('special-defense'),
            'speed': stat_dict.get('speed'),
            'type1': types[0] if len(types) > 0 else 'None',
            'type2': types[1] if len(types) > 1 else 'None'
        }
        pokemon_data.append(data)
        
    print("Finished fetching Pokémon data.")
    return pd.DataFrame(pokemon_data)

def get_local_pokemon_data():
    """Provides a local dataset for demonstration when API access is restricted."""
    print("Using local Pokémon dataset.")
    data = {
        'name': ['Bulbasaur', 'Ivysaur', 'Venusaur', 'Charmander', 'Charmeleon', 'Charizard',
                 'Squirtle', 'Wartortle', 'Blastoise', 'Pikachu', 'Raichu', 'Caterpie', 'Metapod', 'Butterfree',
                 'Pidgey', 'Pidgeotto', 'Pidgeot', 'Geodude', 'Graveler', 'Golem',
                 'Abra', 'Kadabra', 'Alakazam', 'Machop', 'Machoke', 'Machamp',
                 'Eevee', 'Vaporeon', 'Jolteon', 'Flareon', 'Dratini', 'Dragonair', 'Dragonite',
                 'Mewtwo', 'Mew', 'Snorlax', 'Articuno', 'Zapdos', 'Moltres'],
        'type1': ['Grass', 'Grass', 'Grass', 'Fire', 'Fire', 'Fire', 'Water', 'Water', 'Water', 'Electric', 'Electric', 
                  'Bug', 'Bug', 'Bug', 'Normal', 'Normal', 'Normal', 'Rock', 'Rock', 'Rock', 'Psychic', 'Psychic', 
                  'Psychic', 'Fighting', 'Fighting', 'Fighting', 'Normal', 'Water', 'Electric', 'Fire', 'Dragon', 
                  'Dragon', 'Dragon', 'Psychic', 'Psychic', 'Normal', 'Ice', 'Electric', 'Fire'],
        'type2': ['Poison', 'Poison', 'Poison', 'None', 'None', 'Flying', 'None', 'None', 'None', 'None', 'None', 
                  'None', 'None', 'Flying', 'Flying', 'Flying', 'Flying', 'Ground', 'Ground', 'Ground', 'None', 'None', 
                  'None', 'None', 'None', 'None', 'None', 'None', 'None', 'None', 'None', 'None', 'Flying', 'None', 
                  'None', 'None', 'Flying', 'Flying', 'Flying'],
        'hp': [45, 60, 80, 39, 58, 78, 44, 59, 79, 35, 60, 45, 50, 60, 40, 63, 83, 40, 55, 80,
               25, 40, 55, 70, 80, 90, 55, 130, 65, 65, 41, 61, 91, 106, 100, 160, 90, 90, 90],
        'attack': [49, 62, 82, 52, 64, 84, 48, 63, 83, 55, 90, 30, 20, 45, 45, 60, 80, 80, 95, 120,
                   20, 35, 50, 80, 100, 130, 55, 65, 65, 130, 64, 84, 134, 110, 100, 110, 85, 90, 100],
        'defense': [49, 63, 83, 43, 58, 78, 65, 80, 100, 40, 55, 35, 55, 50, 40, 55, 75, 100, 115, 130,
                    15, 30, 45, 50, 70, 80, 50, 60, 60, 60, 45, 65, 95, 90, 100, 65, 100, 85, 90],
        'special-attack': [65, 80, 100, 60, 80, 109, 50, 65, 85, 50, 90, 20, 25, 90, 35, 50, 70, 30, 45, 55,
                           105, 120, 135, 35, 50, 65, 45, 110, 110, 95, 50, 70, 100, 154, 100, 65, 95, 125, 125],
        'special-defense': [65, 80, 100, 50, 65, 85, 64, 80, 105, 50, 80, 20, 25, 80, 35, 50, 70, 30, 45, 65,
                            55, 70, 95, 35, 60, 85, 65, 95, 95, 110, 50, 70, 100, 90, 100, 110, 125, 85, 85],
        'speed': [45, 60, 80, 65, 80, 100, 43, 58, 78, 90, 110, 45, 30, 70, 56, 71, 101, 20, 35, 45,
                  90, 105, 120, 35, 45, 55, 55, 60, 130, 65, 50, 70, 80, 130, 100, 30, 85, 100, 90]
    }
    df = pd.DataFrame(data)
    # Ensure 'None' is consistently handled
    df['type2'] = df['type2'].replace({np.nan: 'None'})
    return df

# -----------------------------------------------------------------------------
# ML Pipeline Functions
# -----------------------------------------------------------------------------

def preprocess_data(df):
    """Applies Standardization to numerical features and One-Hot Encoding to categorical features."""
    print("Preprocessing data (Standardization and One-Hot Encoding)...")
    
    # Ensure 'None' is used consistently (important if fetching from API)
    df['type2'] = df['type2'].fillna('None')

    numerical_features = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']
    categorical_features = ['type1', 'type2']

    # Create the ColumnTransformer
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numerical_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ]
    )

    # Apply the transformations
    # We drop 'name' as it's not a feature for clustering
    X_processed = preprocessor.fit_transform(df.drop('name', axis=1))
    
    # If the result is sparse (common with OneHotEncoder), convert to dense array
    if hasattr(X_processed, 'toarray'):
        X_processed = X_processed.toarray()

    print("Preprocessing complete.")
    return X_processed, preprocessor

def recommend_similar_pokemon(pokemon_name, df):
    """Recommends similar Pokémon based on DBSCAN clusters."""
    # Case-insensitive search by capitalizing
    pokemon_name = pokemon_name.capitalize()
    
    if pokemon_name not in df['name'].values:
        return {"error": f"Pokémon '{pokemon_name}' not found in the dataset."}

    cluster_label = df[df['name'] == pokemon_name]['cluster'].iloc[0]

    if cluster_label == -1:
        return {"message": f"Pokémon '{pokemon_name}' is considered an outlier (Noise) and has no strongly similar Pokémon based on these parameters."}

    similar_pokemon_df = df[(df['cluster'] == cluster_label) & (df['name'] != pokemon_name)]
    
    # Return relevant columns as dictionary
    result = similar_pokemon_df[['name', 'type1', 'type2', 'cluster']].to_dict('records')
    return {"similar_pokemon": result, "cluster": int(cluster_label)}

def create_visualization(X_processed, df):
    """Creates a visualization of the clusters using PCA for dimensionality reduction."""
    print("Creating cluster visualization...")
    
    # Reduce dimensions to 2
    pca = PCA(n_components=2)
    X_pca = pca.fit_transform(X_processed)
    
    df['PCA1'] = X_pca[:, 0]
    df['PCA2'] = X_pca[:, 1]

    plt.figure(figsize=(14, 10))
    
    # Define colors for clusters, ensuring noise (-1) is distinct
    unique_clusters = df['cluster'].unique()
    palette = sns.color_palette("hsv", len([c for c in unique_clusters if c != -1]))
    cluster_colors = {}
    # Sort clusters so colors are consistent across runs
    for i, cluster in enumerate(sorted([c for c in unique_clusters if c != -1])):
        cluster_colors[cluster] = palette[i]
    if -1 in unique_clusters:
        cluster_colors[-1] = (0.1, 0.1, 0.1)  # Gray/Black for noise

    sns.scatterplot(data=df, x='PCA1', y='PCA2', hue='cluster', palette=cluster_colors, s=100, alpha=0.8)

    # Annotate points for clarity
    for i, row in df.iterrows():
        plt.text(row['PCA1']+0.1, row['PCA2'], row['name'], fontsize=8)

    plt.title('Pokémon Clusters (Stats and Types) using DBSCAN (Visualized with PCA)')
    plt.xlabel('PCA Component 1')
    plt.ylabel('PCA Component 2')
    plt.legend(title='Cluster', bbox_to_anchor=(1.05, 1), loc='upper left')
    plt.grid(True)
    plt.tight_layout()
    
    # Convert plot to base64 string for web display
    img_buffer = io.BytesIO()
    plt.savefig(img_buffer, format='png')
    img_buffer.seek(0)
    img_str = base64.b64encode(img_buffer.read()).decode()
    plt.close()
    
    return img_str

class PokemonRecommender:
    """Main class for the Pokémon recommendation system."""
    
    def __init__(self, use_local_data=True, eps=1.5, min_samples=3):
        self.use_local_data = use_local_data
        self.eps = eps
        self.min_samples = min_samples
        self.df = None
        self.X_processed = None
        self.preprocessor = None
        self.dbscan = None
        
    def initialize(self):
        """Initialize the recommendation system by loading data and training the model."""
        # 1. Get Data
        if self.use_local_data:
            self.df = get_local_pokemon_data()
        else:
            self.df = fetch_pokemon_data(limit=151)

        if self.df.empty:
            print("No data to process.")
            return False
            
        # 2. Preprocess Data
        self.X_processed, self.preprocessor = preprocess_data(self.df)

        # 3. DBSCAN Clustering
        print("Applying DBSCAN clustering...")
        self.dbscan = DBSCAN(eps=self.eps, min_samples=self.min_samples)
        clusters = self.dbscan.fit_predict(self.X_processed)
        self.df['cluster'] = clusters
        
        print("\nCluster distribution (Cluster -1 is noise):")
        print(self.df['cluster'].value_counts().sort_index())
        
        return True
    
    def get_recommendations(self, pokemon_name):
        """Get recommendations for a specific Pokémon."""
        if self.df is None:
            return {"error": "System not initialized. Call initialize() first."}
        return recommend_similar_pokemon(pokemon_name, self.df)
    
    def get_visualization(self):
        """Get a base64 encoded visualization of the clusters."""
        if self.df is None:
            return {"error": "System not initialized. Call initialize() first."}
        return create_visualization(self.X_processed, self.df)
    
    def get_all_pokemon(self):
        """Get a list of all Pokémon in the dataset."""
        if self.df is None:
            return {"error": "System not initialized. Call initialize() first."}
        return self.df[['name', 'type1', 'type2', 'cluster']].to_dict('records')
    
    def get_cluster_info(self):
        """Get information about the clusters."""
        if self.df is None:
            return {"error": "System not initialized. Call initialize() first."}
        
        cluster_counts = self.df['cluster'].value_counts().sort_index().to_dict()
        return {
            "cluster_counts": {str(k): v for k, v in cluster_counts.items()},
            "total_pokemon": len(self.df),
            "parameters": {
                "eps": self.eps,
                "min_samples": self.min_samples
            }
        }
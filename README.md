# ITL411 Pokémon Recommendation System

A sophisticated Pokémon recommendation system that uses the DBSCAN clustering algorithm to find similar Pokémon based on their base stats and types. The system analyzes both numerical attributes (HP, Attack, Defense, Special Attack, Special Defense, Speed) and categorical attributes (Primary and Secondary types) to group Pokémon into meaningful clusters.

## Features

- **DBSCAN Clustering**: Uses density-based spatial clustering to identify groups of similar Pokémon
- **Dual Feature Analysis**: Combines both numerical stats and categorical types for comprehensive similarity matching
- **Interactive Web Interface**: Modern, responsive frontend built with Vite and vanilla JavaScript
- **RESTful API**: FastAPI backend with comprehensive endpoints
- **Data Visualization**: PCA-based cluster visualization to understand the grouping
- **Outlier Detection**: Identifies unique Pokémon (like Legendaries) as noise points
- **Real-time Search**: Autocomplete and search functionality

## System Architecture

### Backend (Python/FastAPI)
- **pokemon_recommender.py**: Core ML implementation with DBSCAN clustering
- **main.py**: FastAPI application with REST endpoints
- **requirements.txt**: Python dependencies

### Frontend (JavaScript/Vite)
- **pokemon.js**: Main application logic and API interactions
- **pokemon.css**: Styling for the responsive interface
- **index.html**: Main HTML structure

## Methodology

### Feature Engineering
- **Numerical Features**: HP, Attack, Defense, Special Attack, Special Defense, Speed
- **Categorical Features**: Primary Type, Secondary Type
- **Preprocessing**: StandardScaler for numerical features, OneHotEncoder for categorical features

### Clustering Algorithm
- **DBSCAN Parameters**: eps=1.5, min_samples=3 (optimized for the dataset)
- **Distance Metric**: Euclidean distance on preprocessed features
- **Outlier Handling**: Cluster -1 represents noise/outlier Pokémon

### Recommendation Logic
1. User selects a Pokémon
2. System identifies the cluster containing that Pokémon
3. Returns other Pokémon from the same cluster
4. Outliers get special handling with informative messages

## Installation and Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
- Windows: `venv\Scripts\activate`
- macOS/Linux: `source venv/bin/activate`

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Start the FastAPI server:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Endpoints

### Main Endpoints
- `GET /`: API information and available endpoints
- `GET /health`: Health check endpoint
- `GET /recommend/{pokemon_name}`: Get recommendations for a specific Pokémon
- `POST /recommend`: Alternative POST endpoint for recommendations
- `GET /pokemon`: Get all Pokémon in the dataset
- `GET /clusters`: Get cluster information and statistics
- `GET /visualization`: Get cluster visualization as base64 image
- `GET /pokemon/search/{search_term}`: Search Pokémon by name (partial match)

### Example API Usage
```bash
# Get recommendations for Pikachu
curl http://localhost:8000/recommend/Pikachu

# Get all Pokémon
curl http://localhost:8000/pokemon

# Get cluster information
curl http://localhost:8000/clusters
```

## Usage Instructions

1. **Start both servers** (backend on port 8000, frontend on port 5173)
2. **Open the frontend** in your browser at `http://localhost:5173`
3. **Search for a Pokémon** using the search bar
4. **View recommendations** and similar Pokémon
5. **Explore the visualization** to understand cluster groupings
6. **Check statistics** to see cluster distribution

## Sample Results

### Common Clusters Identified
- **Grass/Poison Cluster**: Bulbasaur, Ivysaur, Venusaur
- **Fire/Flying Cluster**: Charizard, Moltres
- **Electric Cluster**: Pikachu, Raichu, Jolteon, Zapdos
- **Rock/Ground Cluster**: Geodude, Graveler, Golem
- **Water Cluster**: Squirtle, Wartortle, Blastoise

### Outliers (Cluster -1)
- **Mewtwo**: Exceptionally high stats across the board
- **Alakazam**: Very high Special Attack, low physical stats
- **Snorlax**: Extremely high HP, unique stat distribution

## Configuration

### DBSCAN Parameters
- `eps`: Maximum distance between two samples for one to be considered as in the neighborhood of the other
- `min_samples`: Number of samples in a neighborhood for a point to be considered as a core point

These can be adjusted in the `PokemonRecommender` class initialization.

### Data Source
The system uses a local dataset of 39 representative Pokémon by default. To use the full PokéAPI:
1. Set `use_local_data=False` in the `PokemonRecommender` initialization
2. Ensure internet connectivity
3. The system will fetch data from PokéAPI (limit=151 by default)

## Development

### Project Structure
```
itl411-pokemon-api/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── pokemon_recommender.py  # ML implementation
│   └── requirements.txt        # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── pokemon.js         # Main application logic
│   │   ├── pokemon.css        # Styling
│   │   └── main.js            # Entry point
│   ├── index.html             # Main HTML
│   └── package.json           # Node.js dependencies
└── README.md                  # This file
```

### Adding New Features
1. Backend: Add new endpoints in `main.py`
2. ML Logic: Modify `pokemon_recommender.py`
3. Frontend: Update `pokemon.js` and `pokemon.css`

## Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure the FastAPI CORS middleware is configured correctly
2. **Connection Refused**: Make sure both servers are running on correct ports
3. **Module Not Found**: Install all dependencies from requirements.txt
4. **API Timeouts**: Check internet connectivity if using PokéAPI

### Performance Considerations
- The system uses a local dataset for faster loading
- Visualization is generated once and cached as base64
- API responses are optimized for frontend consumption

## Technologies Used

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **scikit-learn**: Machine learning library for DBSCAN clustering
- **pandas**: Data manipulation and analysis
- **matplotlib/seaborn**: Data visualization
- **urllib**: HTTP requests for PokéAPI

### Frontend
- **Vite**: Fast build tool and development server
- **Vanilla JavaScript**: No framework dependencies
- **CSS3**: Modern styling with animations and responsive design
- **Axios**: HTTP client for API requests

## Future Enhancements

- [ ] Real-time PokéAPI integration with caching
- [ ] Advanced filtering options (by type, stats range)
- [ ] Interactive 3D visualization
- [ ] User preference learning
- [ ] Mobile app version
- [ ] Export functionality for recommendations
- [ ] Advanced clustering algorithm comparison

## License

This project is part of the ITL411 course curriculum.
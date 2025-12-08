/**
 * System: ITL411 Pokémon API
 * Module: Configuration
 * File URL: frontend/src/config.js
 * Purpose: Centralized configuration for API endpoints and application settings
 */

// API Configuration
export const API_BASE_URL = 'https://lionfish-app-ff29q.ondigitalocean.app';

// Application Constants
export const DEBOUNCE_DELAY_MS = 300;

// Feature Flags
export const FEATURE_FLAGS = {
  enableEvolutionChain: true,
  enableRecommendations: true,
  enableTypeFiltering: true
};

// API Endpoints
export const API_ENDPOINTS = {
  pokemon: `${API_BASE_URL}/api/v1/pokemon`,
  pokemonSearch: `${API_BASE_URL}/api/v1/pokemon/search`,
  pokemonDetails: (id) => `${API_BASE_URL}/api/v1/pokemon/${id}`,
  pokemonEvolution: (id) => `${API_BASE_URL}/api/v1/pokemon/${id}/evolution`,
  recommendations: (name) => `${API_BASE_URL}/api/v1/recommend/${name}`
};

// Pagination Settings
export const PAGINATION = {
  defaultLimit: 20,
  maxLimit: 100
};

// UI Settings
export const UI_CONFIG = {
  gridMinCardWidth: 140,
  animationDuration: 300,
  loadingDelay: 500
};
/**
 * System: ITL411 Pokémon API
 * Module: Configuration
 * File URL: frontend/src/config.js
 * Purpose: Centralized configuration for API endpoints with environment-aware settings
 */

// Detect environment: Vite provides import.meta.env.DEV
const isDev = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Determine base URL
const getApiBaseUrl = () => {
  // Development: Use relative proxy endpoint
  if (isDev) {
    return '/api/v1';
  }

  // Production: Use absolute backend URL
  const backendUrl = import.meta.env.VITE_API_BASE_URL ||
    'https://lionfish-app-ff29q.ondigitalocean.app/api/v1';
  return backendUrl;
};

export const API_BASE_URL = getApiBaseUrl();

// Add environment info for debugging
export const ENV_INFO = {
  isDev,
  isProduction,
  apiBaseUrl: API_BASE_URL,
  viteMode: import.meta.env.MODE
};

export const CONFIG = {
  DEBOUNCE_MS: 300,
  DEFAULT_LIMIT: 50,
  ANIMATION_SPEED: 300,
  GRID_MIN_WIDTH: 140,
  API_TIMEOUT_MS: 30000,
  RETRY_ATTEMPTS: 3
};

export const API_ENDPOINTS = {
  pokemon: `${API_BASE_URL}/pokemon`,
  pokemonSearch: `${API_BASE_URL}/pokemon/search`,
  recommend: (pokemonName) => `${API_BASE_URL}/recommend/${encodeURIComponent(pokemonName)}`,
  clusterVisualization: `${API_BASE_URL}/cluster-visualization`,
};

// Backward compatibility exports
export const DEBOUNCE_DELAY_MS = CONFIG.DEBOUNCE_MS;
export const FEATURE_FLAGS = {
  enableEvolutionChain: true,
  enableRecommendations: true,
  enableTypeFiltering: true
};

export const PAGINATION = {
  defaultLimit: CONFIG.DEFAULT_LIMIT,
  maxLimit: 100
};

export const UI_CONFIG = {
  gridMinCardWidth: CONFIG.GRID_MIN_WIDTH,
  animationDuration: CONFIG.ANIMATION_SPEED,
  loadingDelay: 500
};
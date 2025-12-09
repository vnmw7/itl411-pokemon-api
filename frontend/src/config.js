/**
 * System: ITL411 Pokémon API
 * Module: Configuration
 * File URL: frontend/src/config.js
 * Purpose: Centralized configuration for API endpoints and application settings
 */

export const API_BASE_URL = 'https://lionfish-app-ff29q.ondigitalocean.app/api/v1';

export const CONFIG = {
  DEBOUNCE_MS: 300,
  DEFAULT_LIMIT: 50,
  ANIMATION_SPEED: 300,
  GRID_MIN_WIDTH: 140
};

export const API_ENDPOINTS = {
  pokemon: `${API_BASE_URL}/pokemon`,
  pokemonSearch: `${API_BASE_URL}/pokemon/search`,
};

// Keep existing exports for backward compatibility
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
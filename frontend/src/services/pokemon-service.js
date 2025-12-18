/**
 * System: ITL411 Pokémon API
 * Module: Pokémon Service
 * File URL: frontend/src/services/pokemon-service.js
 */

import { API_ENDPOINTS, CONFIG } from '../config.js';
import { apiClient } from '../utils/api-client.js';

export const PokemonService = {
  async getAll(limit = CONFIG.DEFAULT_LIMIT) {
    return await apiClient(`${API_ENDPOINTS.pokemon}?limit=${limit}`);
  },

  async search(term) {
    if (!term) return this.getAll();
    const url = `${API_ENDPOINTS.pokemonSearch}?name=${encodeURIComponent(term)}`;
    return await apiClient(url);
  },

  async getRecommendations(pokemonName, num = 5) {
    const url = `${API_ENDPOINTS.recommend(pokemonName)}?num=${num}`;
    return await apiClient(url);
  },

  async getClusterVisualization() {
    return await apiClient(API_ENDPOINTS.clusterVisualization);
  }
};
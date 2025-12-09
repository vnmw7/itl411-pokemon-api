/**
 * System: ITL411 Pokémon API
 * Module: Configuration Tests
 * File URL: frontend/tests/config.test.js
 * Purpose: Test configuration loading and environment detection
 */

import { describe, it, expect } from 'vitest';
import { API_BASE_URL, ENV_INFO, CONFIG, API_ENDPOINTS, DEBOUNCE_DELAY_MS, FEATURE_FLAGS, PAGINATION, UI_CONFIG } from '../src/config.js';

describe('Configuration', () => {
  describe('Environment Detection', () => {
    it('should have environment info', () => {
      expect(ENV_INFO).toBeDefined();
      expect(typeof ENV_INFO.isDev).toBe('boolean');
      expect(typeof ENV_INFO.isProduction).toBe('boolean');
      expect(ENV_INFO.apiBaseUrl).toBeDefined();
      expect(ENV_INFO.viteMode).toBeDefined();
    });

    it('should have API base URL', () => {
      expect(API_BASE_URL).toBeDefined();
      expect(typeof API_BASE_URL).toBe('string');
    });
  });

  describe('Configuration Constants', () => {
    it('should have correct default values', () => {
      expect(CONFIG.DEBOUNCE_MS).toBe(300);
      expect(CONFIG.DEFAULT_LIMIT).toBe(50);
      expect(CONFIG.ANIMATION_SPEED).toBe(300);
      expect(CONFIG.GRID_MIN_WIDTH).toBe(140);
      expect(CONFIG.API_TIMEOUT_MS).toBe(30000);
      expect(CONFIG.RETRY_ATTEMPTS).toBe(3);
    });
  });

  describe('API Endpoints', () => {
    it('should generate correct endpoint URLs', () => {
      expect(API_ENDPOINTS.pokemon).toContain('/pokemon');
      expect(API_ENDPOINTS.pokemonSearch).toContain('/search');
    });
  });

  describe('Backward Compatibility', () => {
    it('should export DEBOUNCE_DELAY_MS', () => {
      expect(DEBOUNCE_DELAY_MS).toBe(300);
    });

    it('should export FEATURE_FLAGS', () => {
      expect(FEATURE_FLAGS.enableEvolutionChain).toBe(true);
      expect(FEATURE_FLAGS.enableRecommendations).toBe(true);
      expect(FEATURE_FLAGS.enableTypeFiltering).toBe(true);
    });

    it('should export PAGINATION', () => {
      expect(PAGINATION.defaultLimit).toBe(50);
      expect(PAGINATION.maxLimit).toBe(100);
    });

    it('should export UI_CONFIG', () => {
      expect(UI_CONFIG.gridMinCardWidth).toBe(140);
      expect(UI_CONFIG.animationDuration).toBe(300);
      expect(UI_CONFIG.loadingDelay).toBe(500);
    });
  });
});
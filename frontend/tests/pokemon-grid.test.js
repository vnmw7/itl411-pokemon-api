/**
 * System: ITL411 Pokémon API
 * Module: Tests
 * File URL: frontend/tests/pokemon-grid.test.js
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initPokemonGrid } from '../src/sections/gerome/pokemon-grid.js';

// Mock the Service
vi.mock('../src/services/pokemon-service.js', () => ({
  PokemonService: {
    getAll: vi.fn(),
    search: vi.fn()
  }
}));

describe('Gerome Section: Pokemon Grid', () => {
  let container;

  beforeEach(() => {
    // Setup DOM environment
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.clearAllMocks();
  });

  it('should create container element', () => {
    expect(container).not.toBeNull();
  });

  it('should initialize without errors', () => {
    expect(() => initPokemonGrid(container)).not.toThrow();
  });
});
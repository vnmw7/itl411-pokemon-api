/**
 * System: ITL411 Pokémon API
 * Module: Pokémon Grid Component
 * File URL: frontend/src/sections/gerome/pokemon-grid.js
 * Purpose: Display Pokémon grid with Result Pattern error handling and accessibility
 */

import { API_ENDPOINTS, UI_CONFIG } from '../../config.js';

let allPokemon = [];
let isLoading = false;

/**
 * Result Pattern helper for API calls
 * @param {Promise} promise - The fetch promise
 * @returns {Promise<Object>} Result object with success, data, or error
 */
async function handleApiCall(promise) {
  try {
    const response = await promise;
    
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
    
    const data = await response.json();
    
    if (data.data && Array.isArray(data.data.results)) {
      return {
        success: true,
        data: data.data.results
      };
    } else if (data.data) {
      return {
        success: true,
        data: data.data
      };
    }
    
    return {
      success: false,
      error: 'Invalid data format received from API'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Network error occurred'
    };
  }
}

/**
 * Render error message in the grid
 * @param {string} message - Error message to display
 */
function renderError(message) {
  element.innerHTML = `
    <div class="task-instruction">
      <strong>Gerome's Task:</strong>
      1. Fetch data from <code>GET /api/v1/pokemon</code>.<br>
      2. Render grid of cards (Image, Name, Type).<br>
      3. On Click: <code>dispatchEvent(new CustomEvent('pokemon-selected', { detail: pokemon }))</code>
    </div>
    
    <div role="alert" aria-live="polite" style="text-align: center; padding: 40px; color: #d32f2f; background: #ffebee; border-radius: 12px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0;">⚠️ Error Loading Pokémon</h3>
      <p style="margin: 0;">${message}</p>
      <button onclick="location.reload()" style="margin-top: 15px; padding: 8px 16px; background: #d32f2f; color: white; border: none; border-radius: 6px; cursor: pointer;">
        Retry
      </button>
    </div>
  `;
}

/**
 * Render loading state
 */
function renderLoading() {
  element.innerHTML = `
    <div class="task-instruction">
      <strong>Gerome's Task:</strong>
      1. Fetch data from <code>GET /api/v1/pokemon</code>.<br>
      2. Render grid of cards (Image, Name, Type).<br>
      3. On Click: <code>dispatchEvent(new CustomEvent('pokemon-selected', { detail: pokemon }))</code>
    </div>
    
    <div role="status" aria-live="polite" style="text-align: center; padding: 40px; color: #666;">
      <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #EA5D60; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <p style="margin-top: 15px;">Loading Pokémon...</p>
    </div>
  `;
}

/**
 * Render the Pokémon grid
 * @param {Array} pokemonList - List of Pokémon to render
 */
function renderGrid(pokemonList) {
  if (pokemonList.length === 0) {
    element.innerHTML = `
      <div class="task-instruction">
        <strong>Gerome's Task:</strong>
        1. Fetch data from <code>GET /api/v1/pokemon</code>.<br>
        2. Render grid of cards (Image, Name, Type).<br>
        3. On Click: <code>dispatchEvent(new CustomEvent('pokemon-selected', { detail: pokemon }))</code>
      </div>
      
      <div role="status" aria-live="polite" style="text-align: center; padding: 40px; color: #666;">
        <p>No Pokémon found matching your search.</p>
      </div>
    `;
    return;
  }

  element.innerHTML = `
    <div class="task-instruction">
      <strong>Gerome's Task:</strong>
      1. Fetch data from <code>GET /api/v1/pokemon</code>.<br>
      2. Render grid of cards (Image, Name, Type).<br>
      3. On Click: <code>dispatchEvent(new CustomEvent('pokemon-selected', { detail: pokemon }))</code>
    </div>

    <div role="grid" aria-label="Pokémon grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(${UI_CONFIG.gridMinCardWidth}px, 1fr)); gap: 20px; padding-bottom: 20px;">
      ${pokemonList.map(p => `
        <div class="poke-card"
             data-id="${p.id}"
             data-name="${p.name}"
             role="gridcell"
             tabindex="0"
             aria-label="${p.name}, ${p.types ? p.types.map(t => t.type.name).join(', ') : p.type || 'Unknown type'}"
             style="background: white; padding: 20px; border-radius: 15px; text-align: center; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
          <img src="${p.sprites?.other?.['official-artwork']?.front_default || p.image}"
               alt="${p.name}"
               loading="lazy"
               style="width: 100px; height: 100px; margin: 0 auto;">
          <h3 style="margin: 10px 0; color: #333; font-size: 1.1rem; text-transform: capitalize;">${p.name}</h3>
          <div style="display: flex; justify-content: center; gap: 5px; flex-wrap: wrap;">
            ${(p.types ? p.types.map(t => `
              <span style="background: #f4f4f4; padding: 5px 15px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; color: #666;">
                ${t.type.name}
              </span>
            `) : [`<span style="background: #f4f4f4; padding: 5px 15px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; color: #666;">${p.type || 'Unknown'}</span>`]).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // Add event listeners for cards
  element.querySelectorAll('.poke-card').forEach(card => {
    // Click event
    card.addEventListener('click', () => {
      const selected = allPokemon.find(pokemon => pokemon.id == card.dataset.id);
      if (selected) {
        document.dispatchEvent(new CustomEvent('pokemon-selected', { detail: selected }));
      }
    });

    // Keyboard support
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const selected = allPokemon.find(pokemon => pokemon.id == card.dataset.id);
        if (selected) {
          document.dispatchEvent(new CustomEvent('pokemon-selected', { detail: selected }));
        }
      }
    });
  });
}

/**
 * Fetch Pokémon data from API
 */
async function fetchPokemon() {
  if (isLoading) return;
  
  isLoading = true;
  renderLoading();

  const result = await handleApiCall(fetch(API_ENDPOINTS.pokemon));
  
  isLoading = false;
  
  if (result.success) {
    allPokemon = result.data;
    renderGrid(allPokemon);
  } else {
    renderError(result.error);
  }
}

export function initPokemonGrid(element) {
  // Initial fetch
  fetchPokemon();

  // Filter Logic (Listening to Isaiah)
  document.addEventListener('pokemon-search', (e) => {
    const term = e.detail.toLowerCase().trim();
    
    if (term === '') {
      renderGrid(allPokemon);
    } else {
      const filtered = allPokemon.filter(p =>
        p.name.toLowerCase().includes(term)
      );
      renderGrid(filtered);
    }
  });
}
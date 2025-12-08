/**
 * System: ITL411 Pokémon API
 * Module: Stats and Evolution Component
 * File URL: frontend/src/sections/kia/stats-evolution.js
 * Purpose: Display Pokémon stats and recursive evolution chain with parallel data fetching
 */

import { API_ENDPOINTS, FEATURE_FLAGS } from '../../config.js';

let currentPokemon = null;

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
    
    if (data.data) {
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
 * Render loading state
 */
function renderLoading() {
  element.innerHTML = `
    <div class="task-instruction">
      <strong>Kia's Task:</strong>
      1. Listen for 'pokemon-selected' event.<br>
      2. Fetch full details: <code>GET /api/v1/pokemon/{id}</code>.<br>
      3. Render "Base Stats" and "Evolution Chain".
    </div>
    
    <div role="status" aria-live="polite" style="text-align: center; padding: 20px; color: #666;">
      <div style="display: inline-block; width: 30px; height: 30px; border: 3px solid #f3f3f3; border-top: 3px solid #EA5D60; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <p style="margin-top: 10px;">Loading stats...</p>
    </div>
  `;
}

/**
 * Render error message
 * @param {string} message - Error message to display
 */
function renderError(message) {
  element.innerHTML = `
    <div class="task-instruction">
      <strong>Kia's Task:</strong>
      1. Listen for 'pokemon-selected' event.<br>
      2. Fetch full details: <code>GET /api/v1/pokemon/{id}</code>.<br>
      3. Render "Base Stats" and "Evolution Chain".
    </div>
    
    <div role="alert" aria-live="polite" style="text-align: center; padding: 20px; color: #d32f2f; background: #ffebee; border-radius: 8px; margin: 10px 0;">
      <p>⚠️ ${message}</p>
    </div>
  `;
}

/**
 * Get stat bar color based on value
 * @param {number} value - Stat value (0-255)
 * @returns {string} CSS color
 */
function getStatBarColor(value) {
  if (value >= 150) return '#4CAF50'; // Green - Excellent
  if (value >= 100) return '#8BC34A'; // Light Green - Good
  if (value >= 70) return '#FFC107'; // Amber - Average
  if (value >= 40) return '#FF9800'; // Orange - Below Average
  return '#F44336'; // Red - Poor
}

/**
 * Render base stats
 * @param {Object} stats - Pokémon stats object
 */
function renderBaseStats(stats) {
  const statNames = {
    'hp': 'HP',
    'attack': 'ATK',
    'defense': 'DEF',
    'special-attack': 'SP.ATK',
    'special-defense': 'SP.DEF',
    'speed': 'SPD'
  };

  return `
    <section aria-label="Base Stats">
      <h4 style="text-align: center; margin-bottom: 20px; color: #2B2F42;">Base Stats</h4>
      
      ${stats.map(stat => {
        const statName = statNames[stat.stat.name] || stat.stat.name.toUpperCase();
        const statValue = stat.base_stat;
        const statPercentage = (statValue / 255) * 100;
        const statColor = getStatBarColor(statValue);
        
        return `
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <span style="width: 60px; font-weight: 600; font-size: 0.75rem; color: #8F9396;">${statName}</span>
            <div style="flex: 1; height: 8px; background: #eee; border-radius: 4px; overflow: hidden; margin: 0 10px; position: relative;">
              <div style="width: ${statPercentage}%; height: 100%; background: ${statColor}; border-radius: 4px; transition: width 0.5s ease;"></div>
            </div>
            <span style="width: 35px; text-align: right; font-size: 0.8rem; font-weight: 600; color: #2B2F42;">${statValue}</span>
          </div>
        `;
      }).join('')}
    </section>
  `;
}

/**
 * Recursively render evolution chain
 * @param {Object} node - Evolution chain node
 * @returns {string} HTML string for evolution chain
 */
function renderEvolutionChain(node) {
  if (!node) return '';
  
  const pokemonName = node.species?.name || 'Unknown';
  const pokemonId = node.species?.url?.split('/').filter(Boolean).pop() || '';
  const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
  
  // Evolution details
  let evolutionDetails = '';
  if (node.evolution_details && node.evolution_details.length > 0) {
    const detail = node.evolution_details[0];
    if (detail.min_level) {
      evolutionDetails = `<div style="font-size: 0.7rem; color: #666;">Lv. ${detail.min_level}</div>`;
    } else if (detail.item) {
      evolutionDetails = `<div style="font-size: 0.7rem; color: #666;">${detail.item.name.replace('-', ' ')}</div>`;
    }
  }
  
  // Current evolution stage
  const currentStage = `
    <div style="text-align: center; min-width: 80px;">
      <img src="${imageUrl}"
           alt="${pokemonName}"
           style="width: 60px; height: 60px; border-radius: 50%; border: 2px solid #EA5D60; background: white; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      <div style="margin-top: 5px; font-size: 0.8rem; font-weight: 600; color: #2B2F42; text-transform: capitalize;">${pokemonName}</div>
      ${evolutionDetails}
    </div>
  `;
  
  // Recursively render next evolution
  const nextEvolutions = node.evolves_to || [];
  const nextStagesHtml = nextEvolutions.map(evo => renderEvolutionChain(evo)).join('');
  
  if (nextStagesHtml) {
    return `
      <div style="display: flex; align-items: center; gap: 10px;">
        ${currentStage}
        <span style="color: #ccc; font-size: 1.5rem;">→</span>
        ${nextStagesHtml}
      </div>
    `;
  }
  
  return currentStage;
}

/**
 * Render evolution section
 * @param {Object} evolutionData - Evolution chain data
 */
function renderEvolution(evolutionData) {
  if (!evolutionData || !evolutionData.chain) {
    return `
      <section aria-label="Evolution Chain">
        <h4 style="text-align: center; margin: 30px 0 15px 0; color: #2B2F42;">Evolution</h4>
        <div style="text-align: center; color: #666; padding: 20px;">
          <p>No evolution data available</p>
        </div>
      </section>
    `;
  }

  return `
    <section aria-label="Evolution Chain">
      <h4 style="text-align: center; margin: 30px 0 15px 0; color: #2B2F42;">Evolution Chain</h4>
      <div style="display: flex; justify-content: center; align-items: center; padding: 20px; overflow-x: auto;">
        ${renderEvolutionChain(evolutionData.chain)}
      </div>
    </section>
  `;
}

/**
 * Fetch and render Pokémon stats and evolution
 * @param {Object} pokemon - Selected Pokémon object
 */
async function fetchAndRenderStats(pokemon) {
  if (!pokemon || !pokemon.id) {
    renderError('Invalid Pokémon data');
    return;
  }
  
  renderLoading();
  
  try {
    // Parallel fetching of stats and evolution data
    const [statsResult, evolutionResult] = await Promise.all([
      handleApiCall(fetch(API_ENDPOINTS.pokemonDetails(pokemon.id))),
      FEATURE_FLAGS.enableEvolutionChain ?
        handleApiCall(fetch(API_ENDPOINTS.pokemonEvolution(pokemon.id))) :
        Promise.resolve({ success: true, data: null })
    ]);
    
    let html = `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #f6f8fc; animation: slideUp 0.4s ease;">
    `;
    
    // Render stats
    if (statsResult.success && statsResult.data && statsResult.data.stats) {
      html += renderBaseStats(statsResult.data.stats);
    } else {
      html += `
        <section aria-label="Base Stats">
          <h4 style="text-align: center; margin-bottom: 20px; color: #2B2F42;">Base Stats</h4>
          <div style="text-align: center; color: #666; padding: 20px;">
            <p>Stats data not available</p>
          </div>
        </section>
      `;
    }
    
    // Render evolution
    if (FEATURE_FLAGS.enableEvolutionChain) {
      if (evolutionResult.success) {
        html += renderEvolution(evolutionResult.data);
      } else {
        html += `
          <section aria-label="Evolution Chain">
            <h4 style="text-align: center; margin: 30px 0 15px 0; color: #2B2F42;">Evolution</h4>
            <div style="text-align: center; color: #d32f2f; padding: 20px;">
              <p>⚠️ Failed to load evolution data</p>
            </div>
          </section>
        `;
      }
    }
    
    html += `</div>`;
    element.innerHTML = html;
    
  } catch (error) {
    renderError('Failed to load Pokémon data');
  }
}

export function initPokemonStats(element) {
  element.innerHTML = `
    <div class="task-instruction">
      <strong>Kia's Task:</strong>
      1. Listen for 'pokemon-selected' event.<br>
      2. Fetch full details: <code>GET /api/v1/pokemon/{id}</code>.<br>
      3. Render "Base Stats" and "Evolution Chain".
    </div>
  `;

  document.addEventListener('pokemon-selected', (e) => {
    currentPokemon = e.detail;
    
    if (currentPokemon) {
      fetchAndRenderStats(currentPokemon);
    }
  });
}
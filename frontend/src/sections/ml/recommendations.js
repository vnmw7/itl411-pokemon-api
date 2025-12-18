/**
 * System: ITL411 Pokemon API
 * Module: ML Recommendations Component
 * File URL: frontend/src/sections/ml/recommendations.js
 * Purpose: Display ML-based Pokemon recommendations using DBSCAN clustering
 */

import './recommendations.css';
import { PokemonService } from '../../services/pokemon-service.js';

let recommendationsElement = null;
let currentPokemon = null;
let inputPokemonWithStats = null;
let recommendations = [];

const TYPE_COLORS = {
  normal: '#A8A878', fire: '#F08030', water: '#6890F0', electric: '#F8D030',
  grass: '#78C850', ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0',
  ground: '#E0C068', flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
  rock: '#B8A038', ghost: '#705898', dragon: '#7038F8', dark: '#705848',
  steel: '#B8B8D0', fairy: '#EE99AC'
};

function getTypeColor(type) {
  return TYPE_COLORS[String(type).toLowerCase()] || '#68A090';
}

function renderLoading() {
  if (!recommendationsElement) return;
  recommendationsElement.innerHTML = `
    <div class="recommendations-section">
      <h4 class="recommendations-title">Similar Pokemon</h4>
      <div class="recommendations-loading">
        <div class="recommendations-spinner"></div>
        <p>Finding similar Pokemon...</p>
      </div>
    </div>
  `;
}

function renderEmptyState() {
  if (!recommendationsElement) return;
  recommendationsElement.innerHTML = `
    <div class="recommendations-section">
      <h4 class="recommendations-title">Similar Pokemon</h4>
      <p class="recommendations-empty">Select a Pokemon to see ML recommendations</p>
    </div>
  `;
}

function renderError(message) {
  if (!recommendationsElement) return;
  recommendationsElement.innerHTML = `
    <div class="recommendations-section">
      <h4 class="recommendations-title">Similar Pokemon</h4>
      <div class="recommendations-error">
        <p>${message}</p>
      </div>
    </div>
  `;
}

function renderUniqueMessage(pokemonName) {
  if (!recommendationsElement) return;
  recommendationsElement.innerHTML = `
    <div class="recommendations-section">
      <h4 class="recommendations-title">Similar Pokemon</h4>
      <div class="recommendations-unique">
        <p><strong>${pokemonName}</strong> is statistically unique!</p>
        <p class="recommendations-unique-sub">No similar Pokemon found based on base stats.</p>
      </div>
    </div>
  `;
}

function renderRecommendations(recs) {
  if (!recommendationsElement) return;

  const cardsHtml = recs.map((pokemon, index) => {
    const types = pokemon.types || [];
    const typeChips = types.map(t => {
      const typeName = typeof t === 'string' ? t : (t.type?.name || t.name || t);
      return `<span class="rec-type-chip" style="background: ${getTypeColor(typeName)}">${typeName}</span>`;
    }).join('');

    const imageUrl = pokemon.image ||
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;

    // Similarity badge from API response
    const similarityBadge = pokemon.similarity_percent !== undefined
      ? `<span class="similarity-badge">${Math.round(pokemon.similarity_percent)}% similar</span>`
      : '';

    return `
      <div class="recommendation-card" data-index="${index}" tabindex="0" role="button" aria-label="Compare with ${pokemon.name}">
        ${similarityBadge}
        <img src="${imageUrl}" alt="${pokemon.name}" class="rec-image" loading="lazy">
        <div class="rec-info">
          <span class="rec-id">#${String(pokemon.id).padStart(3, '0')}</span>
          <h5 class="rec-name">${pokemon.name}</h5>
          <div class="rec-types">${typeChips}</div>
        </div>
      </div>
    `;
  }).join('');

  recommendationsElement.innerHTML = `
    <div class="recommendations-section">
      <h4 class="recommendations-title">Similar Pokemon</h4>
      <p class="recommendations-subtitle">Based on DBSCAN clustering of base stats</p>
      <div class="recommendations-scroll">
        ${cardsHtml}
      </div>
    </div>
  `;

  // Add click handlers for comparison
  const cards = recommendationsElement.querySelectorAll('.recommendation-card');
  cards.forEach((card, idx) => {
    card.addEventListener('click', () => handleComparisonSelect(idx));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleComparisonSelect(idx);
      }
    });
  });
}

function handleComparisonSelect(index) {
  const recommended = recommendations[index];
  if (!recommended) return;

  // Use inputPokemonWithStats (has full stats from API) for comparison
  const selectedWithStats = inputPokemonWithStats || currentPokemon;
  if (!selectedWithStats) return;

  // Highlight selected card
  const cards = recommendationsElement.querySelectorAll('.recommendation-card');
  cards.forEach((card, idx) => {
    card.classList.toggle('selected', idx === index);
  });

  // Dispatch event for stat-charts to update comparison
  document.dispatchEvent(new CustomEvent('comparison-selected', {
    detail: { selected: selectedWithStats, recommended }
  }));
}

async function fetchAndRenderRecommendations(pokemon) {
  if (!pokemon || !pokemon.name) {
    renderEmptyState();
    return;
  }

  renderLoading();

  const result = await PokemonService.getRecommendations(pokemon.name, 5);

  if (!result.success) {
    // Check for 503 (service unavailable)
    if (result.error && result.error.includes('503')) {
      renderError('ML service is initializing. Please try again shortly.');
    } else if (result.error && result.error.includes('404')) {
      renderError(`Pokemon "${pokemon.name}" not found in ML dataset.`);
    } else {
      renderError(result.error || 'Failed to load recommendations');
    }
    return;
  }

  const data = result.data;
  recommendations = data.recommendations || [];
  inputPokemonWithStats = data.input_pokemon || null;

  // Check if Pokemon is unique (outlier in clustering)
  if (data.message && data.message.includes('unique')) {
    renderUniqueMessage(pokemon.name);
    return;
  }

  if (recommendations.length === 0) {
    renderUniqueMessage(pokemon.name);
    return;
  }

  renderRecommendations(recommendations);

  // Dispatch event for charts with full stats
  document.dispatchEvent(new CustomEvent('recommendations-loaded', {
    detail: { input: inputPokemonWithStats || currentPokemon, recommendations }
  }));
}

export function initRecommendations(element) {
  recommendationsElement = element;
  renderEmptyState();

  document.addEventListener('pokemon-selected', (e) => {
    currentPokemon = e.detail;
    if (currentPokemon) {
      fetchAndRenderRecommendations(currentPokemon);
    } else {
      renderEmptyState();
    }
  });
}

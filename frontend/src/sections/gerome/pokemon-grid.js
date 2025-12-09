/**
 * System: ITL411 Pokémon API
 * Module: Pokémon Grid Component
 * File URL: frontend/src/sections/gerome/pokemon-grid.js
 */

import { PokemonService } from '../../services/pokemon-service.js';
import { ErrorHandler } from '../../utils/error-handler.js';
import './pokemon-grid.css'; // Vite CSS injection

export function initPokemonGrid(element) {
  // --- State ---
  let allPokemon = [];
  let isLoading = false;

  // --- Render Helpers (Scoped) ---

  const renderLoading = () => {
    element.innerHTML = `
      <div role="status" aria-live="polite" style="text-align: center; padding: 40px;">
        <div class="loading-spinner"></div>
        <p style="margin-top: 15px; color: #666;">Loading Pokémon...</p>
      </div>
    `;
  };

  const renderError = (message) => {
    element.innerHTML = `
      <div role="alert" style="text-align: center; padding: 40px; color: var(--error-text);">
        <h3>⚠️ Error Loading Data</h3>
        <p>${message}</p>
        <button id="retry-button" style="margin-top: 10px; padding: 8px 16px; cursor: pointer;">Retry</button>
      </div>
    `;
    
    // Re-attach listener to dynamic element
    element.querySelector('#retry-button')?.addEventListener('click', () => loadData());
  };

  const renderGrid = (list) => {
    if (!list || list.length === 0) {
      element.innerHTML = `<div style="text-align: center; padding: 40px;">No Pokémon found.</div>`;
      return;
    }

    const gridHtml = list.map(p => {
      const types = p.types 
        ? p.types.map(t => typeof t === 'string' ? t : t.type.name) 
        : [p.type || 'unknown'];
      
      const image = p.sprites?.other?.['official-artwork']?.front_default || p.image || '';

      return `
        <article class="poke-card" 
             data-id="${p.id}" 
             role="button" 
             tabindex="0"
             aria-label="View details for ${p.name}">
          <img src="${image}" alt="${p.name}" loading="lazy">
          <h3>${p.name}</h3>
          <div>
            ${types.map(t => `<span class="type-badge">${t}</span>`).join('')}
          </div>
        </article>
      `;
    }).join('');

    element.innerHTML = `<div class="pokemon-grid">${gridHtml}</div>`;

    // Event Delegation
    const handleSelect = (id) => {
      const selected = allPokemon.find(p => p.id == id);
      if (selected) {
        document.dispatchEvent(new CustomEvent('pokemon-selected', { detail: selected }));
      }
    };

    element.querySelectorAll('.poke-card').forEach(card => {
      card.addEventListener('click', () => handleSelect(card.dataset.id));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSelect(card.dataset.id);
        }
      });
    });
  };

  // --- Logic ---

  async function loadData(term = '') {
    if (isLoading) return;
    isLoading = true;
    renderLoading();

    let result;
    if (term) {
      result = await PokemonService.search(term);
    } else {
      result = await PokemonService.getAll();
    }

    isLoading = false;

    if (result.success) {
      allPokemon = result.data; // Cache for local filtering if needed
      renderGrid(result.data);
    } else {
      ErrorHandler.log('PokemonGrid', result.error);
      renderError(ErrorHandler.format(result.error));
    }
  }

  // --- Initialization ---

  // 1. Initial Load
  loadData();

  // 2. Listen for Search
  document.addEventListener('pokemon-search', (e) => {
    const term = e.detail ? e.detail.toLowerCase().trim() : '';
    // Option A: Client-side filtering (faster if data is loaded)
    // Option B: Server-side search (better for large datasets)
    // We will use Server-side search as implemented in the Service
    loadData(term);
  });
}
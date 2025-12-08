/**
 * System: ITL411 Pokémon API
 * Module: Search Bar Component
 * File URL: frontend/src/sections/isaiah/search-bar.js
 * Purpose: Search functionality with debouncing to prevent API spam
 */

import { DEBOUNCE_DELAY_MS } from '../../config.js';

export function initSearchSection(element) {
  element.innerHTML = `
    <div class="task-instruction">
      <strong>Isaiah's Task:</strong>
      1. Create an Input field for "Search".<br>
      2. On user input, dispatch event: <code>new CustomEvent('pokemon-search', { detail: term })</code>
    </div>

    <div class="search-wrapper" role="search" aria-label="Pokémon search" style="display: flex; gap: 10px;">
      <input type="text"
             id="search-input"
             placeholder="Search Pokémon..."
             aria-label="Search for Pokémon by name"
             style="width: 100%; padding: 15px; border-radius: 12px; border: 1px solid #eee; box-shadow: 0 4px 15px rgba(0,0,0,0.05); font-size: 1rem;">
      <button id="search-button" style="padding: 0 25px; background: #EA5D60; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 1rem;" aria-label="Search">
        Search
      </button>
    </div>
  `;

  // Debounce timer variable
  let debounceTimer = null;

  // Debounced search function
  const debouncedSearch = (searchTerm) => {
    console.log(`[Isaiah] Dispatching search: ${searchTerm}`);
    document.dispatchEvent(new CustomEvent('pokemon-search', { detail: searchTerm }));
  };

  // LOGIC
  const input = element.querySelector('#search-input');
  const button = element.querySelector('#search-button');

  // Input event with debouncing
  input.addEventListener('input', (e) => {
    const searchTerm = e.target.value.trim();
    
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Set new timer
    debounceTimer = setTimeout(() => {
      debouncedSearch(searchTerm);
    }, DEBOUNCE_DELAY_MS);
  });

  // Button click for immediate search
  button.addEventListener('click', () => {
    const searchTerm = input.value.trim();
    
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Immediate search on button click
    debouncedSearch(searchTerm);
  });

  // Support Enter key for search
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const searchTerm = input.value.trim();
      
      // Clear existing timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      // Immediate search on Enter
      debouncedSearch(searchTerm);
    }
  });
}
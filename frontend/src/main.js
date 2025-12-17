// src/main.js
import './style.css';
import { initSearchSection } from './sections/isaiah/search-bar.js';
import { initPokemonGrid } from './sections/gerome/pokemon-grid.js';
import { initPokemonOverview } from './sections/nicole/pokemon-overview.js';
import { initPokemonStats } from './sections/kia/stats-evolution.js';

// 1. Set up the Layout HTML
document.querySelector('#app').innerHTML = `
  <header style="padding: 20px 40px; background: white; display: flex; align-items: center; gap: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); z-index: 10;">
    <div style="width: 40px; height: 40px; background: #EA5D60; border-radius: 50%;"></div>
    <h2 style="font-weight: 700; font-size: 1.5rem; color: #2B2F42;">ITL411 <span style="font-weight: 400;">PokéDex</span></h2>
  </header>

  <div id="main-container">
    <div class="content-area">
      <div id="isaiah-search-container"></div>
      <div id="gerome-grid-container"></div>
    </div>

    <div class="sidebar-area">
      <div id="nicole-overview-container"></div>
      <div id="kia-stats-container"></div>
    </div>
  </div>
`;

// 2. Initialize Member Components (no need for DOMContentLoaded here)
const searchEl   = document.getElementById('isaiah-search-container');
const gridEl     = document.getElementById('gerome-grid-container');
const overviewEl = document.getElementById('nicole-overview-container');
const statsEl    = document.getElementById('kia-stats-container');

if (searchEl)   initSearchSection(searchEl);
if (gridEl)     initPokemonGrid(gridEl);
if (overviewEl) initPokemonOverview(overviewEl);
if (statsEl)    initPokemonStats(statsEl);

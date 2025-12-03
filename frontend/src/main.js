// src/main.js
import './style.css';
import { initTopSection } from './sections/member1/top-section.js';
import { initBottomSection } from './sections/member2/bottom-section.js';
import { initSidebar } from './sections/member3/sidebar.js';

//Main layout structure
document.querySelector('#app').innerHTML = `
  <div id="layout">
    <!-- Left Column (60% width) -->
    <div class="left-column">
      <div class="card" id="top-card">
        <div class="card-header">
          <h2 class="card-title">Isaiah</h2>
          
        </div>
        <div id="top-section-content" class="card-content"></div>
      </div>

      <div class="card" id="bottom-card">
        <div class="card-header">
          <h2 class="card-title">Gerome</h2>
        
        </div>
        <div id="bottom-section-content" class="card-content"></div>
      </div>
    </div>

    <!-- Right Sidebar (40% width) -->
    <div class="right-column">
      <div class="card" id="sidebar-card">
        <div class="card-header">
          <h2 class="card-title">Nicole</h2>
     
        </div>
        <div id="sidebar-content" class="card-content"></div>
      </div>
    </div>
  </div>
`;

document.addEventListener('DOMContentLoaded', () => {
  initTopSection();
  initBottomSection();
  initSidebar();
});
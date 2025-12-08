/* MEMBER: Kia
 * --------------------------------------------------------
 * YOUR TASKS:
 * 1. Listen for the 'pokemon-selected' event.
 * 2. Fetch detailed stats (GET /pokemon/{id}).
 * 3. Render Base Stats (Bars) and Evolution Chain.
 * --------------------------------------------------------
 */

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
    const p = e.detail;
    
    // Kia: Fetch real stats here later. For now, we use random numbers for UI demo.
    
    element.innerHTML = `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #f6f8fc; animation: slideUp 0.4s ease;">
        
        <h4 style="text-align: center; margin-bottom: 20px; color: #2B2F42;">Base Stats</h4>
        
        ${['HP', 'ATK', 'DEF', 'SPD'].map(stat => `
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <span style="width: 40px; font-weight: 600; font-size: 0.75rem; color: #8F9396;">${stat}</span>
            <div style="flex: 1; height: 8px; background: #eee; border-radius: 4px; overflow: hidden; margin: 0 10px;">
                <div style="width: ${Math.random() * 50 + 40}%; height: 100%; background: #FF5959; border-radius: 4px;"></div>
            </div>
            <span style="width: 30px; text-align: right; font-size: 0.8rem; font-weight: 600; color: #2B2F42;">${Math.floor(Math.random() * 100)}</span>
          </div>
        `).join('')}

        <h4 style="text-align: center; margin: 30px 0 15px 0; color: #2B2F42;">Evolution</h4>
        
        <div style="display: flex; justify-content: center; align-items: center; gap: 15px; opacity: 0.8;">
           <div style="width: 40px; height: 40px; background: #eee; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem;">?</div>
           <span style="color: #ccc;">→</span>
           <div style="width: 50px; height: 50px; background: #EA5D60; border-radius: 50%; border: 3px solid white; box-shadow: 0 5px 15px rgba(234, 93, 96, 0.4);"></div>
           <span style="color: #ccc;">→</span>
           <div style="width: 40px; height: 40px; background: #eee; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem;">?</div>
        </div>
      </div>
    `;
  });
}
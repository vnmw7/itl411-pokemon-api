/* MEMBER: Nicole
 * --------------------------------------------------------
 * YOUR TASKS:
 * 1. Listen for the 'pokemon-selected' event.
 * 2. Update the Top Sidebar with the selected Pokémon's details.
 * --------------------------------------------------------
 */

export function initPokemonOverview(element) {
  // Initial State
  element.innerHTML = `
    <div class="task-instruction">
      <strong>Nicole's Task:</strong>
      1. Listen for 'pokemon-selected' event.<br>
      2. Show: Large Image, Name, ID, Types.<br>
      3. (Optional) Fetch description from API.
    </div>
    <div style="text-align: center; color: #ccc; margin-top: 50px;">Select a Pokémon to view details</div>
  `;

  document.addEventListener('pokemon-selected', (e) => {
    const p = e.detail;
    
    element.innerHTML = `
      <div style="animation: fadeIn 0.3s ease; text-align: center;">
        <img src="${p.image}" style="width: 200px; height: 200px; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.15));">
        
        <div style="color: #999; font-weight: 700; margin-top: 15px; font-size: 1rem;">
            #${String(p.id).padStart(3, '0')}
        </div>
        
        <h1 style="font-size: 2.5rem; color: #2B2F42; margin: 5px 0; text-transform: capitalize;">
            ${p.name}
        </h1>
        
        <div style="display: flex; justify-content: center; gap: 10px; margin-top: 10px;">
           <span style="background: #6390F0; color: white; padding: 6px 20px; border-radius: 8px; font-weight: 600;">
             ${p.type}
           </span>
        </div>
      </div>
    `;
  });
}
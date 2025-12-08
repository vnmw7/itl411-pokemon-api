/**
 * System: ITL411 Pokémon API
 * Module: Pokémon Overview Component
 * File URL: frontend/src/sections/nicole/pokemon-overview.js
 * Purpose: Display selected Pokémon details with semantic HTML and accessibility
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
    <div id="pokemon-placeholder" role="status" aria-live="polite" style="text-align: center; color: #ccc; margin-top: 50px;">
      <p>Select a Pokémon to view details</p>
    </div>
  `;

  document.addEventListener('pokemon-selected', (e) => {
    const pokemon = e.detail;
    
    if (!pokemon) return;
    
    // Extract types data (handle both old format and new API format)
    const types = pokemon.types ?
      pokemon.types.map(t => t.type.name) :
      [pokemon.type].filter(Boolean);
    
    // Get image URL (handle both old format and new API format)
    const imageUrl = pokemon.sprites?.other?.['official-artwork']?.front_default ||
                     pokemon.image ||
                     'https://via.placeholder.com/200';
    
    element.innerHTML = `
      <article role="tabpanel" aria-labelledby="pokemon-name" style="animation: fadeIn 0.3s ease; text-align: center;">
        <header>
          <img id="pokemon-image"
               src="${imageUrl}"
               alt="${pokemon.name}"
               style="width: 200px; height: 200px; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.15)); border-radius: 12px;">
          
          <div style="color: #999; font-weight: 700; margin-top: 15px; font-size: 1rem;">
              #${String(pokemon.id).padStart(3, '0')}
          </div>
          
          <h1 id="pokemon-name" style="font-size: 2.5rem; color: #2B2F42; margin: 5px 0; text-transform: capitalize;">
              ${pokemon.name}
          </h1>
        </header>
        
        <section aria-label="Pokémon types">
          <div style="display: flex; justify-content: center; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
             ${types.map(type => `
               <span class="type-badge"
                     style="background: ${getTypeColor(type)}; color: white; padding: 6px 20px; border-radius: 8px; font-weight: 600; text-transform: capitalize;">
                 ${type}
               </span>
             `).join('')}
          </div>
        </section>
        
        ${pokemon.height || pokemon.weight ? `
          <section aria-label="Physical attributes" style="margin-top: 20px; display: flex; justify-content: center; gap: 30px; color: #666; font-size: 0.9rem;">
            ${pokemon.height ? `
              <div>
                <strong>Height:</strong> ${pokemon.height / 10} m
              </div>
            ` : ''}
            ${pokemon.weight ? `
              <div>
                <strong>Weight:</strong> ${pokemon.weight / 10} kg
              </div>
            ` : ''}
          </section>
        ` : ''}
        
        ${pokemon.abilities ? `
          <section aria-label="Abilities" style="margin-top: 20px;">
            <h3 style="font-size: 1.1rem; color: #2B2F42; margin-bottom: 10px;">Abilities</h3>
            <div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
              ${pokemon.abilities.map(ability => `
                <span style="background: #f0f0f0; color: #333; padding: 4px 12px; border-radius: 6px; font-size: 0.8rem; text-transform: capitalize;">
                  ${ability.ability.name.replace('-', ' ')}
                </span>
              `).join('')}
            </div>
          </section>
        ` : ''}
      </article>
    `;
  });
}

/**
 * Get color for Pokémon type
 * @param {string} type - Pokémon type name
 * @returns {string} CSS color value
 */
function getTypeColor(type) {
  const typeColors = {
    normal: '#A8A878',
    fire: '#F08030',
    water: '#6890F0',
    electric: '#F8D030',
    grass: '#78C850',
    ice: '#98D8D8',
    fighting: '#C03028',
    poison: '#A040A0',
    ground: '#E0C068',
    flying: '#A890F0',
    psychic: '#F85888',
    bug: '#A8B820',
    rock: '#B8A038',
    ghost: '#705898',
    dragon: '#7038F8',
    dark: '#705848',
    steel: '#B8B8D0',
    fairy: '#EE99AC'
  };
  
  return typeColors[type.toLowerCase()] || '#68A090';
}
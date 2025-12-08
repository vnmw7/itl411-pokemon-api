/* MEMBER: Gerome
 * --------------------------------------------------------
 * YOUR TASKS:
 * 1. Fetch the list of Pokémon (GET /pokemon).
 * 2. Render the Grid of Cards.
 * 3. Filter the list when Isaiah searches.
 * 4. Dispatch 'pokemon-selected' when a card is clicked.
 * --------------------------------------------------------
 */

export function initPokemonGrid(element) {
  // MOCK DATA (Replace this with fetch('/api/v1/pokemon') later)
  const mockPokemon = [
    { id: 1, name: 'Bulbasaur', type: 'Grass', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png' },
    { id: 4, name: 'Charmander', type: 'Fire', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png' },
    { id: 7, name: 'Squirtle', type: 'Water', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png' },
    { id: 25, name: 'Pikachu', type: 'Electric', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png' },
    { id: 387, name: 'Turtwig', type: 'Grass', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/387.png' },
  ];

  function render(list) {
    element.innerHTML = `
      <div class="task-instruction">
        <strong>Gerome's Task:</strong>
        1. Fetch data from <code>GET /api/v1/pokemon</code>.<br>
        2. Render grid of cards (Image, Name, Type).<br>
        3. On Click: <code>dispatchEvent(new CustomEvent('pokemon-selected', { detail: pokemon }))</code>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 20px; padding-bottom: 20px;">
        ${list.map(p => `
          <div class="poke-card" data-id="${p.id}" style="background: white; padding: 20px; border-radius: 15px; text-align: center; cursor: pointer; transition: transform 0.2s; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
            <img src="${p.image}" style="width: 100px; height: 100px; margin: 0 auto;">
            <h3 style="margin: 10px 0; color: #333; font-size: 1.1rem; text-transform: capitalize;">${p.name}</h3>
            <span style="background: #f4f4f4; padding: 5px 15px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; color: #666;">${p.type}</span>
          </div>
        `).join('')}
      </div>
    `;

    // Click Logic
    element.querySelectorAll('.poke-card').forEach(card => {
      card.addEventListener('click', () => {
        const selected = mockPokemon.find(p => p.id == card.dataset.id);
        document.dispatchEvent(new CustomEvent('pokemon-selected', { detail: selected }));
      });
    });
  }

  render(mockPokemon);

  // Filter Logic (Listening to Isaiah)
  document.addEventListener('pokemon-search', (e) => {
    const term = e.detail.toLowerCase();
    render(mockPokemon.filter(p => p.name.toLowerCase().includes(term)));
  });
}
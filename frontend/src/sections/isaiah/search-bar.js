/* MEMBER: Isaiah
 * --------------------------------------------------------
 * YOUR TASKS:
 * 1. Create the Search Bar UI.
 * 2. Listen for user input.
 * 3. Dispatch 'pokemon-search' event so Gerome can filter the grid.
 * --------------------------------------------------------
 */

export function initSearchSection(element) {
  element.innerHTML = `
    <div class="task-instruction">
      <strong>Isaiah's Task:</strong>
      1. Create an Input field for "Search".<br>
      2. On user input, dispatch event: <code>new CustomEvent('pokemon-search', { detail: term })</code>
    </div>

    <div class="search-wrapper" style="display: flex; gap: 10px;">
      <input type="text" 
             id="search-input"
             placeholder="Search Pokémon..." 
             style="width: 100%; padding: 15px; border-radius: 12px; border: 1px solid #eee; box-shadow: 0 4px 15px rgba(0,0,0,0.05); font-size: 1rem;">
      <button style="padding: 0 25px; background: #EA5D60; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 1rem;">
        Search
      </button>
    </div>
  `;

  // LOGIC
  const input = element.querySelector('#search-input');
  input.addEventListener('input', (e) => {
    // Broadcast the search term to Gerome (Grid)
    document.dispatchEvent(new CustomEvent('pokemon-search', { detail: e.target.value }));
  });
}
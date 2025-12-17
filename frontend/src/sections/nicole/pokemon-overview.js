/**
 * System: ITL411 Pokémon API
 * Module: Pokémon Overview Component
 * File URL: frontend/src/sections/nicole/pokemon-overview.js
 * Purpose: Display selected Pokémon details with semantic HTML, accessibility, and smooth fade-in animations
 */

export function initPokemonOverview(element) {
  injectPokemonOverviewStyles();

  // Initial placeholder
  element.innerHTML = `
    <div class="pokemon-overview-root">
      <article class="pokemon-card pokemon-card--empty" role="status" aria-live="polite">
        <p class="pokemon-empty-text">Select a Pokémon to view details</p>
      </article>
    </div>
 `;

  document.addEventListener('pokemon-selected', (e) => {
  const pokemon = e.detail;
  console.log('[Overview] received pokemon-selected', pokemon?.name, pokemon?.id);
  if (!pokemon) return;

  // SAFE type mapping (works for PokeAPI objects OR simple strings)
  const types = pokemon.types
    ? pokemon.types.map((t) =>
        typeof t === 'string'
          ? t
          : t.type?.name || t.name || 'unknown'
      )
    : [pokemon.type || 'unknown'];

  const imageUrl =
    pokemon.sprites?.other?.['official-artwork']?.front_default ||
    pokemon.image ||
    'https://via.placeholder.com/260';

  const paddedId =
    pokemon.id != null ? String(pokemon.id).padStart(3, '0') : '???';

  element.innerHTML = `
    <div class="pokemon-overview-root">
      <article class="pokemon-card fade-in" role="tabpanel" aria-labelledby="pokemon-name">
        <div class="pokemon-card-header">
          <div class="pokemon-card-header-bg"></div>

          <div class="pokemon-card-id-pill">
            <span class="pokemon-card-id">#${paddedId}</span>
          </div>

          <div class="pokemon-card-art-wrapper">
            <img
              id="pokemon-image"
              class="pokemon-card-art"
              src="${imageUrl}"
              alt="${pokemon.name}"
              loading="lazy"
            />
          </div>
        </div>

        <div class="pokemon-card-body">
          <h1 id="pokemon-name" class="pokemon-name">
            ${pokemon.name}
          </h1>

          <section aria-label="Pokémon types" class="pokemon-types-section">
            <div class="pokemon-types-row">
              ${types
                .map(
                  (type) => `
                    <span
                      class="pokemon-type-pill fade-in"
                      style="background:${getTypeColor(type)};"
                    >
                      ${type}
                    </span>`
                )
                .join('')}
            </div>
          </section>
        </div>
      </article>
    </div>
  `;
});

}

/**
 * Inject component-scoped styles only once
 */
function injectPokemonOverviewStyles() {
  if (document.getElementById("pokemon-overview-styles")) return;

  const style = document.createElement("style");
  style.id = "pokemon-overview-styles";
  style.textContent = `
    .pokemon-overview-root {
      min-height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      background: radial-gradient(circle at top, #e0f2ff 0, #f3f4ff 40%, #f9fafb 100%);
      box-sizing: border-box;
    }

    .pokemon-card {
      position: relative;
      width: 100%;
      max-width: 360px;
      min-height: 540px;
      border-radius: 28px;
      background: #ffffff;
      box-shadow:
        0 20px 45px rgba(15, 23, 42, 0.18),
        0 0 0 1px rgba(148, 163, 184, 0.06);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .pokemon-card--empty {
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: #9ca3af;
      font-weight: 500;
      font-size: 0.975rem;
      padding: 2rem;
    }

    .pokemon-empty-text {
      margin: 0;
    }

    .pokemon-card-header {
      position: relative;
      padding: 1.5rem 1.5rem 0.5rem;
    }

    .pokemon-card-header-bg {
      position: absolute;
      inset: -40% -40% auto;
      height: 220px;
      background: linear-gradient(135deg, #60a5fa, #6366f1);
      opacity: 0.95;
      border-radius: 0 0 60% 60%;
      z-index: 0;
    }

    .pokemon-card-id-pill {
      position: relative;
      z-index: 1;
      display: inline-flex;
      padding: 0.35rem 0.8rem;
      font-size: 0.85rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #e5e7eb;
      background: rgba(15, 23, 42, 0.45);
      border-radius: 999px;
      box-shadow: 0 8px 18px rgba(15, 23, 42, 0.35);
    }

    .pokemon-card-art-wrapper {
      position: relative;
      z-index: 1;
      margin-top: 0.75rem;
      display: flex;
      justify-content: center;
    }

    .pokemon-card-art {
      width: 210px;
      height: 210px;
      object-fit: contain;
      filter: drop-shadow(0 18px 32px rgba(15, 23, 42, 0.35));
      transform: translateY(10px);
    }

    .pokemon-card-body {
      flex: 1;
      padding: 1.75rem 1.75rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.9rem;
    }

    .pokemon-name {
      margin: 0;
      font-size: 2rem;
      line-height: 1.1;
      font-weight: 800;
      color: #111827;
      text-transform: capitalize;
      letter-spacing: 0.02em;
    }

    .pokemon-types-section {
      width: 100%;
    }

    .pokemon-types-row {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .pokemon-type-pill {
      padding: 0.35rem 1rem;
      border-radius: 999px;
      color: #ffffff;
      font-weight: 600;
      font-size: 0.85rem;
      text-transform: capitalize;
      box-shadow: 0 8px 16px rgba(15, 23, 42, 0.22);
      letter-spacing: 0.03em;
    }

    .fade-in {
      animation: pokemonFadeInUp 0.45s ease-out;
    }

    @keyframes pokemonFadeInUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (min-width: 768px) {
      .pokemon-card {
        max-width: 430px;
        min-height: 620px;
      }

      .pokemon-card-art {
        width: 240px;
        height: 240px;
      }

      .pokemon-name {
        font-size: 2.2rem;
      }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Get color for Pokémon type
 */
function getTypeColor(type) {
  const typeColors = {
    normal: "#A8A878",
    fire: "#F08030",
    water: "#6890F0",
    electric: "#F8D030",
    grass: "#78C850",
    ice: "#98D8D8",
    fighting: "#C03028",
    poison: "#A040A0",
    ground: "#E0C068",
    flying: "#A890F0",
    psychic: "#F85888",
    bug: "#A8B820",
    rock: "#B8A038",
    ghost: "#705898",
    dragon: "#7038F8",
    dark: "#705848",
    steel: "#B8B8D0",
    fairy: "#EE99AC",
  };
  return typeColors[String(type).toLowerCase()] || "#68A090";
}

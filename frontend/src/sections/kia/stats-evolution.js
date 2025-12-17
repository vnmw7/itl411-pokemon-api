/**
 * System: ITL411 Pokémon API
 * Module: Stats and Evolution Component
 * File URL: frontend/src/sections/kia/stats-evolution.js
 * Purpose: Display Pokémon stats and recursive evolution chain with parallel data fetching
 */

import { API_ENDPOINTS, FEATURE_FLAGS } from '../../config.js';

let currentPokemon = null;
let statsElement = null; // will hold the DOM element for this component

/* ---------- UI + Data helpers ---------- */

function getTypeColor(type) {
  const map = {
    normal:"#A8A878", fire:"#F08030", water:"#6890F0", electric:"#F8D030",
    grass:"#78C850", ice:"#98D8D8", fighting:"#C03028", poison:"#A040A0",
    ground:"#E0C068", flying:"#A890F0", psychic:"#F85888", bug:"#A8B820",
    rock:"#B8A038", ghost:"#705898", dragon:"#7038F8", dark:"#705848",
    steel:"#B8B8D0", fairy:"#EE99AC"
  };
  return map[String(type).toLowerCase()] || "#68A090";
}

function metersFromDecimeters(dm) { return (Number(dm || 0) / 10).toFixed(1) + "m"; }
function kgFromHectograms(hg)     { return (Number(hg || 0) / 10).toFixed(1) + "Kg"; }

/**
 * Try to normalize stats from various shapes into:
 * [{ base_stat: number, stat: { name: string } }, ...]
 */
function getStatsFromObject(obj) {
  if (!obj) return null;

  // PokeAPI shape: stats: [{ base_stat, stat: { name } }, ...]
  if (Array.isArray(obj.stats) && obj.stats.length) {
    const ok = obj.stats.every(s => typeof s?.base_stat === 'number' && s?.stat?.name);
    if (ok) return obj.stats;
  }

  // Common flattened shapes
  const flat = {
    hp: obj.hp ?? obj.HP,
    attack: obj.attack ?? obj.ATK ?? obj.atk,
    defense: obj.defense ?? obj.DEF ?? obj.def,
    ['special-attack']: obj['special-attack'] ?? obj.sp_attack ?? obj.spa ?? obj.spAtk,
    ['special-defense']: obj['special-defense'] ?? obj.sp_defense ?? obj.spd ?? obj.spDef,
    speed: obj.speed ?? obj.SPD ?? obj.spe
  };

  const entries = Object.entries(flat).filter(([, v]) => typeof v === 'number');
  if (entries.length) {
    return entries.map(([name, val]) => ({ base_stat: val, stat: { name } }));
  }
  return null;
}

/** Pick an English Pokédex entry (species API) */
function pickEnglishFlavorText(speciesJson) {
  const arr = speciesJson?.flavor_text_entries || [];
  const en = arr.find(x => x.language?.name === 'en');
  return en?.flavor_text?.replace(/\f/g, ' ')?.replace(/\s+/g, ' ').trim() || null;
}

/** Compute weaknesses (2×/4×) from Pokémon type names using PokeAPI type endpoints */
async function computeWeaknesses(typeNames) {
  if (!Array.isArray(typeNames) || !typeNames.length) return [];

  const typeJsons = await Promise.all(typeNames.map(t =>
    fetch(`https://pokeapi.co/api/v2/type/${t}`).then(r => r.ok ? r.json() : null).catch(() => null)
  ));

  // Collect attack types that do double damage TO the Pokémon (incoming damage)
  const counts = new Map(); // attackType -> count
  typeJsons.forEach(j => {
    const list = j?.damage_relations?.double_damage_from || [];
    list.forEach(({ name }) => counts.set(name, (counts.get(name) || 0) + 1));
  });

  return [...counts.entries()]
    .sort((a,b) => b[1]-a[1])
    .map(([name, c]) => ({ type: name, mult: c >= 2 ? '4x' : '2x' }));
}

/* ---------- Result helper for API calls ---------- */
async function handleApiCall(promise) {
  try {
    const response = await promise;

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const data = await response.json();

    // Wrapped as { data: ... }
    if (data && data.data) return { success: true, data: data.data };
    // Plain JSON (PokeAPI)
    if (data) return { success: true, data };

    return { success: false, error: 'Invalid data format received from API' };
  } catch (error) {
    return { success: false, error: error.message || 'Network error occurred' };
  }
}

/* ---------- Render helpers (existing + new sections) ---------- */

/**
 * Render loading state
 */
function renderLoading() {
  if (!statsElement) return;

  statsElement.innerHTML = `
    <div class="task-instruction">
      <strong>Kia's Task:</strong>
      1. Listen for 'pokemon-selected' event.<br>
      2. Fetch full details: <code>GET /api/v1/pokemon/{id}</code>.<br>
      3. Render "Base Stats" and "Evolution Chain".
    </div>

    <div role="status" aria-live="polite" style="text-align: center; padding: 20px; color: #666;">
      <div style="display: inline-block; width: 30px; height: 30px; border: 3px solid #f3f3f3; border-top: 3px solid #EA5D60; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <p style="margin-top: 10px;">Loading stats...</p>
    </div>
  `;
}

/**
 * Render error message
 */
function renderError(message) {
  if (!statsElement) return;

  statsElement.innerHTML = `
    <div class="task-instruction">
      <strong>Kia's Task:</strong>
      1. Listen for 'pokemon-selected' event.<br>
      2. Fetch full details: <code>GET /api/v1/pokemon/{id}</code>.<br>
      3. Render "Base Stats" and "Evolution Chain".
    </div>

    <div role="alert" aria-live="polite" style="text-align: center; padding: 20px; color: #d32f2f; background: #ffebee; border-radius: 8px; margin: 10px 0;">
      <p>⚠️ ${message}</p>
    </div>
  `;
}

/**
 * Get stat bar color based on value
 */
function getStatBarColor(value) {
  if (value >= 150) return '#4CAF50';   // Green - Excellent
  if (value >= 100) return '#8BC34A';   // Light Green - Good
  if (value >= 70)  return '#FFC107';   // Amber - Average
  if (value >= 40)  return '#FF9800';   // Orange - Below Average
  return '#F44336';                     // Red - Poor
}

/**
 * Render base stats
 */
function renderBaseStats(stats) {
  const statNames = {
    'hp': 'HP',
    'attack': 'ATK',
    'defense': 'DEF',
    'special-attack': 'SP.ATK',
    'special-defense': 'SP.DEF',
    'speed': 'SPD'
  };

  return `
    <section aria-label="Base Stats">
      <h4 style="text-align: center; margin-bottom: 20px; color: #2B2F42;">Base Stats</h4>

      ${stats.map(stat => {
        const statName = statNames[stat.stat.name] || stat.stat.name.toUpperCase();
        const statValue = stat.base_stat;
        const statPercentage = (statValue / 255) * 100;
        const statColor = getStatBarColor(statValue);

        return `
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <span style="width: 60px; font-weight: 600; font-size: 0.75rem; color: #8F9396;">${statName}</span>
            <div style="flex: 1; height: 8px; background: #eee; border-radius: 4px; overflow: hidden; margin: 0 10px; position: relative;">
              <div style="width: ${statPercentage}%; height: 100%; background: ${statColor}; border-radius: 4px; transition: width 0.5s ease;"></div>
            </div>
            <span style="width: 35px; text-align: right; font-size: 0.8rem; font-weight: 600; color: #2B2F42;">${statValue}</span>
          </div>
        `;
      }).join('')}
    </section>
  `;
}

/** Ability chips */
function renderAbilityChips(abilities) {
  if (!abilities?.length) return '';
  const list = abilities.map(a => {
    const name = (a.ability?.name || a.name || '').replace(/-/g, ' ');
    return `<span style="
      display:inline-flex;align-items:center;padding:6px 14px;border-radius:999px;
      background:#f4f6fb;color:#2B2F42;font-weight:600;font-size:.85rem;margin:4px;
      border:1px solid #e8ecf7;">${name}</span>`;
  }).join('');
  return `
    <section aria-label="Abilities">
      <h4 style="text-align:center;margin:18px 0 12px;color:#2B2F42;">Abilities</h4>
      <div style="display:flex;justify-content:center;flex-wrap:wrap">${list}</div>
    </section>
  `;
}

/** Height/Weight/Base EXP chips */
function renderInfoChips({ height, weight, baseExp }) {
  return `
    <section aria-label="Info">
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;max-width:420px;margin:12px auto 0">
        <div style="background:#f6f8fc;border-radius:12px;padding:12px;text-align:center">
          <div style="color:#8F9396;font-weight:700;letter-spacing:.08em;font-size:.75rem">HEIGHT</div>
          <div style="font-weight:700;color:#2B2F42;margin-top:6px">${height}</div>
        </div>
        <div style="background:#f6f8fc;border-radius:12px;padding:12px;text-align:center">
          <div style="color:#8F9396;font-weight:700;letter-spacing:.08em;font-size:.75rem">WEIGHT</div>
          <div style="font-weight:700;color:#2B2F42;margin-top:6px">${weight}</div>
        </div>
        <div style="background:#f6f8fc;border-radius:12px;padding:12px;text-align:center;grid-column:1/-1">
          <div style="color:#8F9396;font-weight:700;letter-spacing:.08em;font-size:.75rem">BASE EXP</div>
          <div style="font-weight:700;color:#2B2F42;margin-top:6px">${baseExp ?? '—'}</div>
        </div>
      </div>
    </section>
  `;
}

/** Pokédex entry text */
function renderPokedexEntry(text) {
  if (!text) return '';
  return `
    <section aria-label="Pokédex Entry">
      <h4 style="text-align:center;margin:18px 0 8px;color:#2B2F42;letter-spacing:.08em">POKÉDEX ENTRY</h4>
      <p style="max-width:520px;margin:0 auto;text-align:center;color:#4b5563;line-height:1.6">${text}</p>
    </section>
  `;
}

/** Weaknesses chips (2x / 4x) */
function renderWeaknesses(items) {
  if (!items?.length) return '';
  const row = items.map(({ type, mult }) => `
    <span style="
      display:inline-flex;align-items:center;gap:8px;padding:6px 10px;border-radius:10px;
      background:#f6f8fc;border:1px solid #eef1f7;margin:4px">
      <span style="
        display:inline-flex;align-items:center;justify-content:center;
        width:26px;height:26px;border-radius:999px;color:#111827;font-weight:800;
        background:#fff;border:1px solid #e5e7eb;">${mult}</span>
      <span style="
        display:inline-flex;align-items:center;padding:6px 12px;border-radius:999px;
        color:#fff;font-weight:700;text-transform:capitalize;
        background:${getTypeColor(type)}">${type}</span>
    </span>
  `).join('');
  return `
    <section aria-label="Weaknesses">
      <div style="display:flex;justify-content:center;align-items:center;gap:10px;margin:18px 0 8px">
        <h4 style="margin:0;color:#2B2F42">Weaknesses</h4>
      </div>
      <div style="display:flex;justify-content:center;flex-wrap:wrap">${row}</div>
    </section>
  `;
}

/**
 * Recursively render evolution chain
 */
function renderEvolutionChain(node) {
  if (!node) return '';

  const pokemonName = node.species?.name || 'Unknown';
  const pokemonId = node.species?.url?.split('/').filter(Boolean).pop() || '';
  const imageUrl =
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;

  // Evolution details
  let evolutionDetails = '';
  if (node.evolution_details && node.evolution_details.length > 0) {
    const detail = node.evolution_details[0];
    if (detail.min_level) {
      evolutionDetails = `<div style="font-size: 0.7rem; color: #666;">Lv. ${detail.min_level}</div>`;
    } else if (detail.item) {
      evolutionDetails = `<div style="font-size: 0.7rem; color: #666;">${detail.item.name.replace('-', ' ')}</div>`;
    }
  }

  // Current evolution stage
  const currentStage = `
    <div style="text-align: center; min-width: 80px;">
      <img src="${imageUrl}"
           alt="${pokemonName}"
           style="width: 60px; height: 60px; border-radius: 50%; border: 2px solid #EA5D60; background: white; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      <div style="margin-top: 5px; font-size: 0.8rem; font-weight: 600; color: #2B2F42; text-transform: capitalize;">${pokemonName}</div>
      ${evolutionDetails}
    </div>
  `;

  // Recursively render next evolution
  const nextEvolutions = node.evolves_to || [];
  const nextStagesHtml = nextEvolutions.map(evo => renderEvolutionChain(evo)).join('');

  if (nextStagesHtml) {
    return `
      <div style="display: flex; align-items: center; gap: 10px;">
        ${currentStage}
        <span style="color: #ccc; font-size: 1.5rem;">→</span>
        ${nextStagesHtml}
      </div>
    `;
  }

  return currentStage;
}

/**
 * Render evolution section
 */
function renderEvolution(evolutionData) {
  if (!evolutionData || !evolutionData.chain) {
    return `
      <section aria-label="Evolution Chain">
        <h4 style="text-align: center; margin: 30px 0 15px 0; color: #2B2F42;">Evolution</h4>
        <div style="text-align: center; color: #666; padding: 20px;">
          <p>No evolution data available</p>
        </div>
      </section>
    `;
  }

  return `
    <section aria-label="Evolution Chain">
      <h4 style="text-align: center; margin: 30px 0 15px 0; color: #2B2F42;">Evolution Chain</h4>
      <div style="display: flex; justify-content: center; align-items: center; padding: 20px; overflow-x: auto;">
        ${renderEvolutionChain(evolutionData.chain)}
      </div>
    </section>
  `;
}

/* ---------- Fetch + Render orchestration ---------- */

/**
 * Fetch and render Pokémon stats, entry, abilities, info chips, weaknesses, and evolution.
 */
async function fetchAndRenderStats(pokemon) {
  if (!pokemon || !pokemon.id) {
    renderError('Invalid Pokémon data');
    return;
  }

  renderLoading();

  try {
    const enableEvolution = !!(FEATURE_FLAGS && FEATURE_FLAGS.enableEvolutionChain);
    const hasDetailsEndpoint = API_ENDPOINTS && typeof API_ENDPOINTS.pokemonDetails === 'function';
    const hasEvolutionEndpoint = API_ENDPOINTS && typeof API_ENDPOINTS.pokemonEvolution === 'function';

    // 1) Try your configured API for details/evolution
    let [detailsRes, evoRes] = await Promise.all([
      hasDetailsEndpoint ? handleApiCall(fetch(API_ENDPOINTS.pokemonDetails(pokemon.id))) : Promise.resolve({ success:false }),
      enableEvolution && hasEvolutionEndpoint ? handleApiCall(fetch(API_ENDPOINTS.pokemonEvolution(pokemon.id))) : Promise.resolve({ success:true, data:null })
    ]);

    // 2) If details missing, fallback to PokeAPI
    if (!detailsRes.success) {
      detailsRes = await handleApiCall(fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.id}`));
    }

    // 3) Species entry + weaknesses (independent)
    const [speciesRes, weaknesses] = await Promise.all([
      handleApiCall(fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemon.id}`)),
      (async () => {
        const typeNames =
          (detailsRes.data?.types?.map(t => t.type?.name).filter(Boolean)) ||
          (pokemon.types?.map(t => typeof t === 'string' ? t : (t.type?.name || t.name))) ||
          [];
        return await computeWeaknesses(typeNames);
      })()
    ]);

    // --- Resolve evolution data regardless of custom endpoint availability ---
    let evolutionData = null;
    if (enableEvolution) {
      // 1) Try custom endpoint result first
      if (hasEvolutionEndpoint && evoRes && evoRes.success) {
        evolutionData = evoRes.data;
      }
      // 2) Fallback to PokeAPI using species.evolution_chain.url
      if (!evolutionData && speciesRes.success && speciesRes.data?.evolution_chain?.url) {
        const chainRes = await handleApiCall(fetch(speciesRes.data.evolution_chain.url));
        if (chainRes.success) {
          evolutionData = chainRes.data; // shape: { id, baby_trigger_item, chain: { ... } }
        }
      }
    }

    if (!statsElement) return;

    // 4) Data normalization
    const details = detailsRes.success ? detailsRes.data : null;
    const statsArray =
      getStatsFromObject(details) ||
      getStatsFromObject(pokemon) || [];

    const abilities = details?.abilities || pokemon.abilities || [];
    const height    = details?.height ?? pokemon.height;
    const weight    = details?.weight ?? pokemon.weight;
    const baseExp   = details?.base_experience ?? pokemon.base_experience;
    const flavor    = speciesRes.success ? pickEnglishFlavorText(speciesRes.data) : null;

    // 5) Assemble UI
    let html = `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #f6f8fc; animation: slideUp 0.4s ease;">
    `;

    html += renderPokedexEntry(flavor);
    html += renderAbilityChips(abilities);
    html += renderInfoChips({
      height: height != null ? metersFromDecimeters(height) : '—',
      weight: weight != null ? kgFromHectograms(weight) : '—',
      baseExp
    });
    html += renderWeaknesses(weaknesses);

    // Base stats
    if (Array.isArray(statsArray) && statsArray.length) {
      html += renderBaseStats(statsArray);
    } else {
      html += `
        <section aria-label="Base Stats">
          <h4 style="text-align: center; margin-bottom: 20px; color: #2B2F42;">Base Stats</h4>
          <div style="text-align: center; color: #666; padding: 20px;">
            <p>Stats data not available</p>
          </div>
        </section>
      `;
    }

    // Evolution (optional)
    if (enableEvolution) {
      if (evolutionData) {
        html += renderEvolution(evolutionData);
      } else {
        html += `
          <section aria-label="Evolution Chain">
            <h4 style="text-align: center; margin: 30px 0 15px 0; color: #2B2F42;">Evolution</h4>
            <div style="text-align: center; color: #666; padding: 20px;">
              <p>No evolution data available</p>
            </div>
          </section>
        `;
      }
    }

    html += `</div>`;
    statsElement.innerHTML = html;

  } catch (error) {
    console.error('[Stats] Unexpected error while loading Pokémon data:', error);
    renderError('Failed to load Pokémon data');
  }
}

/* ---------- Public initializer ---------- */
export function initPokemonStats(element) {
  statsElement = element;

  statsElement.innerHTML = `
    <div class="task-instruction">
      <strong>Kia's Task:</strong>
      1. Listen for 'pokemon-selected' event.<br>
      2. Fetch full details: <code>GET /api/v1/pokemon/{id}</code>.<br>
      3. Render "Base Stats" and "Evolution Chain".
    </div>
  `;

  document.addEventListener('pokemon-selected', (e) => {
    currentPokemon = e.detail;
    if (currentPokemon) {
      fetchAndRenderStats(currentPokemon);
    }
  });
}

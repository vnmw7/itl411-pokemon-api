/**
 * System: ITL411 Pokemon API
 * Module: Cluster Scatter Plot Component
 * File URL: frontend/src/sections/ml/stat-charts.js
 * Purpose: Interactive 2D scatter plot visualization of DBSCAN clusters
 */

import './stat-charts.css';
import Chart from 'chart.js/auto';
import { PokemonService } from '../../services/pokemon-service.js';

// Module state
let chartsElement = null;
let scatterChart = null;
let comparisonChart = null;
let clusterData = null;
let currentPokemonName = null;
let recommendedPokemonNames = [];
let comparisonData = null;
let isLoading = false;

// Color palette for clusters (15 distinct colors)
const CLUSTER_COLORS = [
  '#EA5D60', '#60A5FA', '#78C850', '#F8D030', '#A890F0',
  '#F85888', '#98D8D8', '#A040A0', '#E0C068', '#B8A038',
  '#705898', '#7038F8', '#705848', '#B8B8D0', '#EE99AC'
];
const OUTLIER_COLOR = '#9CA3AF';
const HIGHLIGHT_COLOR = '#FBBF24';

function getClusterColor(cluster) {
  if (cluster === -1) return OUTLIER_COLOR;
  return CLUSTER_COLORS[cluster % CLUSTER_COLORS.length];
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Helper to find a pokemon's position in the chart
function findPointInChart(chart, pokemonName) {
  if (!chart || !pokemonName) return null;
  for (const dataset of chart.data.datasets) {
    for (let i = 0; i < dataset.data.length; i++) {
      if (dataset.data[i].name.toLowerCase() === pokemonName.toLowerCase()) {
        const meta = chart.getDatasetMeta(chart.data.datasets.indexOf(dataset));
        const point = meta.data[i];
        if (point) {
          return { x: point.x, y: point.y };
        }
      }
    }
  }
  return null;
}

// Chart.js plugin for drawing connection lines between selected and recommended pokemon
const connectionLinesPlugin = {
  id: 'connectionLines',
  afterDatasetsDraw: (chart) => {
    const options = chart.options.plugins.connectionLines;
    if (!options || !options.connections || options.connections.length === 0) return;

    const ctx = chart.ctx;
    ctx.save();
    ctx.strokeStyle = options.lineColor || '#FBBF24';
    ctx.lineWidth = options.lineWidth || 2;
    ctx.setLineDash([5, 5]);
    ctx.globalAlpha = 0.7;

    options.connections.forEach(conn => {
      const fromPoint = findPointInChart(chart, conn.from);
      const toPoint = findPointInChart(chart, conn.to);

      if (fromPoint && toPoint) {
        ctx.beginPath();
        ctx.moveTo(fromPoint.x, fromPoint.y);
        ctx.lineTo(toPoint.x, toPoint.y);
        ctx.stroke();
      }
    });

    ctx.restore();
  }
};

function destroyChart() {
  if (scatterChart) {
    scatterChart.destroy();
    scatterChart = null;
  }
}

function renderLoadingState() {
  if (!chartsElement) return;
  destroyChart();
  chartsElement.innerHTML = `
    <div class="charts-section">
      <h4 class="charts-title">DBSCAN Cluster Visualization</h4>
      <div class="scatter-loading">
        <div class="scatter-spinner"></div>
        <p>Loading cluster data...</p>
      </div>
    </div>
  `;
}

function renderErrorState(message) {
  if (!chartsElement) return;
  destroyChart();
  chartsElement.innerHTML = `
    <div class="charts-section">
      <h4 class="charts-title">DBSCAN Cluster Visualization</h4>
      <div class="scatter-error">
        <p>${message}</p>
      </div>
    </div>
  `;
}

function renderEmptyState() {
  if (!chartsElement) return;
  destroyChart();
  chartsElement.innerHTML = `
    <div class="charts-section">
      <h4 class="charts-title">DBSCAN Cluster Visualization</h4>
      <p class="charts-empty">Loading cluster visualization...</p>
    </div>
  `;
}

function destroyComparisonChart() {
  if (comparisonChart) {
    comparisonChart.destroy();
    comparisonChart = null;
  }
}

function createComparisonChartContainer() {
  const container = document.getElementById('comparison-chart-container');
  if (!container) return;

  container.innerHTML = `
    <div class="comparison-section">
      <h4 class="comparison-title">Stat Comparison</h4>
      <div class="comparison-toggle">
        <button class="toggle-btn active" data-type="radar">Radar</button>
        <button class="toggle-btn" data-type="bar">Bar</button>
      </div>
      <div class="comparison-wrapper">
        <canvas id="comparison-chart"></canvas>
      </div>
      <p class="comparison-hint">Click a recommendation card to compare stats</p>
    </div>
  `;

  // Add toggle handlers
  const toggleBtns = container.querySelectorAll('.toggle-btn');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const chartType = btn.dataset.type;
      if (comparisonData) {
        renderComparisonChart(comparisonData.selected, comparisonData.recommended, chartType);
      }
    });
  });
}

function renderComparisonChart(selectedPokemon, recommendedPokemon, chartType = 'radar') {
  destroyComparisonChart();

  const canvas = document.getElementById('comparison-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const statLabels = ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed'];
  const statKeys = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];

  const selectedStats = statKeys.map(key => selectedPokemon.stats?.[key] || 0);
  const recommendedStats = statKeys.map(key => recommendedPokemon.stats?.[key] || 0);

  comparisonData = { selected: selectedPokemon, recommended: recommendedPokemon };

  const selectedName = selectedPokemon.name || 'Selected';
  const recommendedName = recommendedPokemon.name || 'Recommended';

  const config = {
    type: chartType,
    data: {
      labels: statLabels,
      datasets: [
        {
          label: selectedName,
          data: selectedStats,
          backgroundColor: chartType === 'radar' ? 'rgba(234, 93, 96, 0.3)' : 'rgba(234, 93, 96, 0.8)',
          borderColor: '#EA5D60',
          borderWidth: 2,
          pointBackgroundColor: '#EA5D60'
        },
        {
          label: recommendedName,
          data: recommendedStats,
          backgroundColor: chartType === 'radar' ? 'rgba(96, 165, 250, 0.3)' : 'rgba(96, 165, 250, 0.8)',
          borderColor: '#60A5FA',
          borderWidth: 2,
          pointBackgroundColor: '#60A5FA'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            font: { size: 11 }
          }
        }
      },
      scales: chartType === 'radar' ? {
        r: {
          angleLines: { color: 'rgba(0, 0, 0, 0.1)' },
          grid: { color: 'rgba(0, 0, 0, 0.1)' },
          pointLabels: { font: { size: 10 } },
          suggestedMin: 0,
          suggestedMax: 160
        }
      } : {
        y: {
          beginAtZero: true,
          max: 200
        }
      }
    }
  };

  comparisonChart = new Chart(ctx, config);
}

function createChartContainer() {
  if (!chartsElement) return;
  destroyChart();
  destroyComparisonChart();

  chartsElement.innerHTML = `
    <div class="charts-section">
      <h4 class="charts-title">DBSCAN Cluster Visualization</h4>
      <div class="cluster-info" id="cluster-info"></div>
      <div class="chart-container">
        <div class="chart-wrapper scatter-wrapper">
          <canvas id="scatter-chart"></canvas>
        </div>
      </div>
      <p class="scatter-hint">Click on any point to select that Pokemon. Green points are similar Pokemon.</p>
    </div>
    <div id="comparison-chart-container"></div>
  `;
}

function updateClusterInfo(data, selectedPoint) {
  const infoEl = document.getElementById('cluster-info');
  if (!infoEl || !data.cluster_info) return;

  const { total_clusters, outlier_count } = data.cluster_info;

  // Show selected pokemon stats if available
  let selectedInfo = '';
  if (selectedPoint) {
    const clusterLabel = selectedPoint.cluster === -1 ? 'Outlier' : `Cluster ${selectedPoint.cluster}`;
    const offPower = selectedPoint.offensive_power || '';
    const defPower = selectedPoint.defensive_power || '';
    const powerInfo = offPower && defPower ? ` | Off: ${offPower}, Def: ${defPower}` : '';
    selectedInfo = `<span class="selected-info">Selected: <strong>${selectedPoint.name}</strong> (${clusterLabel}${powerInfo})</span>`;
  }

  infoEl.innerHTML = `
    <span class="cluster-stat">${total_clusters} clusters</span>
    <span class="cluster-stat">${outlier_count} outliers</span>
    ${selectedInfo}
  `;
}

function groupPointsByCluster(points) {
  const groups = {};
  points.forEach(p => {
    const key = p.cluster.toString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });
  return groups;
}

function createScatterChart(data, selectedPokemonName = null, recommendedNames = []) {
  const canvas = document.getElementById('scatter-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const points = data.points;

  // Find selected Pokemon
  const selectedPoint = selectedPokemonName
    ? points.find(p => p.name.toLowerCase() === selectedPokemonName.toLowerCase())
    : null;

  const selectedCluster = selectedPoint?.cluster;

  // Build set of recommended pokemon names for highlighting
  const recommendedSet = new Set(recommendedNames.map(n => n.toLowerCase()));

  // Update cluster info display
  updateClusterInfo(data, selectedPoint);

  // Group points by cluster
  const clusterGroups = groupPointsByCluster(points);
  const clusterKeys = Object.keys(clusterGroups).sort((a, b) => {
    // Put outliers (-1) last
    if (a === '-1') return 1;
    if (b === '-1') return -1;
    return parseInt(a) - parseInt(b);
  });

  // Build datasets - one per cluster
  const datasets = clusterKeys.map(clusterKey => {
    const clusterNum = parseInt(clusterKey);
    const clusterPoints = clusterGroups[clusterKey];
    const baseColor = getClusterColor(clusterNum);

    return {
      label: clusterNum === -1 ? 'Outliers' : `Cluster ${clusterNum}`,
      data: clusterPoints.map(p => ({
        x: p.x,
        y: p.y,
        name: p.name,
        id: p.id,
        cluster: p.cluster,
        stats: p.stats,
        offensive_power: p.offensive_power,
        defensive_power: p.defensive_power,
        isSelected: selectedPoint && p.id === selectedPoint.id,
        isRecommended: recommendedSet.has(p.name.toLowerCase())
      })),
      backgroundColor: clusterPoints.map(p => {
        const isSelected = selectedPoint && p.id === selectedPoint.id;
        const isRecommended = recommendedSet.has(p.name.toLowerCase());
        if (isSelected) return HIGHLIGHT_COLOR;
        if (isRecommended) return '#10B981'; // Green for recommended
        if (selectedCluster !== undefined) {
          return p.cluster === selectedCluster
            ? baseColor
            : hexToRgba(baseColor, 0.2);
        }
        return baseColor;
      }),
      pointRadius: clusterPoints.map(p => {
        const isSelected = selectedPoint && p.id === selectedPoint.id;
        const isRecommended = recommendedSet.has(p.name.toLowerCase());
        if (isSelected) return 10;
        if (isRecommended) return 8;
        return 5;
      }),
      pointHoverRadius: 8,
      borderColor: clusterPoints.map(p => {
        const isSelected = selectedPoint && p.id === selectedPoint.id;
        const isRecommended = recommendedSet.has(p.name.toLowerCase());
        if (isSelected) return '#000';
        if (isRecommended) return '#059669';
        return 'transparent';
      }),
      borderWidth: clusterPoints.map(p => {
        const isSelected = selectedPoint && p.id === selectedPoint.id;
        const isRecommended = recommendedSet.has(p.name.toLowerCase());
        return (isSelected || isRecommended) ? 2 : 0;
      })
    };
  });

  // Build connections from selected pokemon to recommendations
  const connections = [];
  if (selectedPokemonName && recommendedNames.length > 0) {
    recommendedNames.forEach(recName => {
      connections.push({ from: selectedPokemonName, to: recName });
    });
  }

  // Get axis labels from backend or use defaults
  const xLabel = data.axis_info?.x_label || 'Offensive Power (Atk + SpA)';
  const yLabel = data.axis_info?.y_label || 'Defensive Power (Def + SpD)';

  scatterChart = new Chart(ctx, {
    type: 'scatter',
    data: { datasets },
    plugins: [connectionLinesPlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: {
            usePointStyle: true,
            boxWidth: 8,
            padding: 8,
            font: { size: 10 }
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const point = context.raw;
              const clusterLabel = point.cluster === -1 ? 'Outlier' : `Cluster ${point.cluster}`;
              const recLabel = point.isRecommended ? ' [Similar]' : '';
              return [
                `${point.name}${recLabel}`,
                `${clusterLabel}`,
                `Off: ${point.offensive_power || 'N/A'}, Def: ${point.defensive_power || 'N/A'}`
              ];
            }
          }
        },
        connectionLines: {
          connections: connections,
          lineColor: '#FBBF24',
          lineWidth: 2
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: xLabel,
            font: { size: 11 }
          },
          grid: { color: 'rgba(0, 0, 0, 0.05)' }
        },
        y: {
          title: {
            display: true,
            text: yLabel,
            font: { size: 11 }
          },
          grid: { color: 'rgba(0, 0, 0, 0.05)' }
        }
      },
      onClick: (event, elements) => handlePointClick(event, elements)
    }
  });
}

function handlePointClick(event, elements) {
  if (elements.length === 0) return;

  const element = elements[0];
  const datasetIndex = element.datasetIndex;
  const pointIndex = element.index;
  const point = scatterChart.data.datasets[datasetIndex].data[pointIndex];

  // Dispatch event to trigger pokemon selection in other components
  document.dispatchEvent(new CustomEvent('scatter-pokemon-clicked', {
    detail: { name: point.name, id: point.id }
  }));
}

function updateScatterHighlight(pokemonName, recNames = null) {
  if (!clusterData) return;

  currentPokemonName = pokemonName;
  if (recNames !== null) {
    recommendedPokemonNames = recNames;
  }
  destroyChart();
  createChartContainer();
  createScatterChart(clusterData, pokemonName, recommendedPokemonNames);
}

async function fetchClusterData() {
  if (clusterData) return clusterData;
  if (isLoading) return null;

  isLoading = true;
  renderLoadingState();

  try {
    const response = await PokemonService.getClusterVisualization();
    if (response && response.data) {
      clusterData = response.data;
      return clusterData;
    } else {
      renderErrorState('Failed to load cluster data');
      return null;
    }
  } catch (error) {
    console.error('Error fetching cluster visualization:', error);
    renderErrorState('Error loading cluster data');
    return null;
  } finally {
    isLoading = false;
  }
}

export async function initStatCharts(element) {
  chartsElement = element;
  renderEmptyState();

  // Fetch cluster data on initialization
  const data = await fetchClusterData();
  if (data) {
    createChartContainer();
    createScatterChart(data, null, []);
  }

  // Listen for pokemon selection from grid
  document.addEventListener('pokemon-selected', (e) => {
    const pokemon = e.detail;
    if (pokemon && pokemon.name) {
      // Clear previous recommendations when selecting a new pokemon
      recommendedPokemonNames = [];
      comparisonData = null;
      updateScatterHighlight(pokemon.name, []);
    } else {
      // No selection - show all points without highlight
      if (clusterData) {
        currentPokemonName = null;
        recommendedPokemonNames = [];
        comparisonData = null;
        destroyChart();
        destroyComparisonChart();
        createChartContainer();
        createScatterChart(clusterData, null, []);
      }
    }
  });

  // Listen for scatter point clicks to sync with grid selection
  document.addEventListener('scatter-pokemon-clicked', (e) => {
    const { name } = e.detail;
    if (name && name !== currentPokemonName) {
      // Clear recommendations and update highlight
      recommendedPokemonNames = [];
      comparisonData = null;
      updateScatterHighlight(name, []);
    }
  });

  // Listen for recommendations loaded to draw connection lines
  document.addEventListener('recommendations-loaded', (e) => {
    const { input, recommendations } = e.detail;
    if (input && recommendations && clusterData) {
      const recNames = recommendations.map(r => r.name);
      const inputName = input.name;
      updateScatterHighlight(inputName, recNames);
    }
  });

  // Listen for comparison selection to render comparison chart
  document.addEventListener('comparison-selected', (e) => {
    const { selected, recommended } = e.detail;
    if (selected && recommended) {
      createComparisonChartContainer();
      renderComparisonChart(selected, recommended, 'radar');
    }
  });
}

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
let clusterData = null;
let currentPokemonName = null;
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

function createChartContainer() {
  if (!chartsElement) return;
  destroyChart();

  chartsElement.innerHTML = `
    <div class="charts-section">
      <h4 class="charts-title">DBSCAN Cluster Visualization</h4>
      <div class="cluster-info" id="cluster-info"></div>
      <div class="chart-container">
        <div class="chart-wrapper scatter-wrapper">
          <canvas id="scatter-chart"></canvas>
        </div>
      </div>
      <p class="scatter-hint">Click on any point to select that Pokemon</p>
    </div>
  `;
}

function updateClusterInfo(data, selectedPoint) {
  const infoEl = document.getElementById('cluster-info');
  if (!infoEl || !data.cluster_info) return;

  const { total_clusters, outlier_count } = data.cluster_info;
  const variance = data.pca_variance || [];
  const varianceText = variance.length >= 2
    ? `(${(variance[0] * 100).toFixed(1)}% + ${(variance[1] * 100).toFixed(1)}% variance)`
    : '';

  let selectedInfo = '';
  if (selectedPoint) {
    const clusterLabel = selectedPoint.cluster === -1 ? 'Outlier' : `Cluster ${selectedPoint.cluster}`;
    selectedInfo = `<span class="selected-info">Selected: <strong>${selectedPoint.name}</strong> (${clusterLabel})</span>`;
  }

  infoEl.innerHTML = `
    <span class="cluster-stat">${total_clusters} clusters</span>
    <span class="cluster-stat">${outlier_count} outliers</span>
    <span class="cluster-stat pca-info">${varianceText}</span>
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

function createScatterChart(data, selectedPokemonName = null) {
  const canvas = document.getElementById('scatter-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const points = data.points;

  // Find selected Pokemon
  const selectedPoint = selectedPokemonName
    ? points.find(p => p.name.toLowerCase() === selectedPokemonName.toLowerCase())
    : null;

  const selectedCluster = selectedPoint?.cluster;

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
    const isSelectedCluster = selectedCluster !== undefined && clusterNum === selectedCluster;
    const baseColor = getClusterColor(clusterNum);

    return {
      label: clusterNum === -1 ? 'Outliers' : `Cluster ${clusterNum}`,
      data: clusterPoints.map(p => ({
        x: p.x,
        y: p.y,
        name: p.name,
        id: p.id,
        cluster: p.cluster,
        isSelected: selectedPoint && p.id === selectedPoint.id
      })),
      backgroundColor: clusterPoints.map(p => {
        if (selectedPoint && p.id === selectedPoint.id) return HIGHLIGHT_COLOR;
        if (selectedCluster !== undefined) {
          return p.cluster === selectedCluster
            ? baseColor
            : hexToRgba(baseColor, 0.2);
        }
        return baseColor;
      }),
      pointRadius: clusterPoints.map(p =>
        selectedPoint && p.id === selectedPoint.id ? 10 : 5
      ),
      pointHoverRadius: 8,
      borderColor: clusterPoints.map(p =>
        selectedPoint && p.id === selectedPoint.id ? '#000' : 'transparent'
      ),
      borderWidth: clusterPoints.map(p =>
        selectedPoint && p.id === selectedPoint.id ? 2 : 0
      )
    };
  });

  scatterChart = new Chart(ctx, {
    type: 'scatter',
    data: { datasets },
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
              return `${point.name} (${clusterLabel})`;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'PCA Component 1',
            font: { size: 11 }
          },
          grid: { color: 'rgba(0, 0, 0, 0.05)' }
        },
        y: {
          title: {
            display: true,
            text: 'PCA Component 2',
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

function updateScatterHighlight(pokemonName) {
  if (!clusterData) return;

  currentPokemonName = pokemonName;
  destroyChart();
  createChartContainer();
  createScatterChart(clusterData, pokemonName);
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
    createScatterChart(data, null);
  }

  // Listen for pokemon selection from grid
  document.addEventListener('pokemon-selected', (e) => {
    const pokemon = e.detail;
    if (pokemon && pokemon.name) {
      updateScatterHighlight(pokemon.name);
    } else {
      // No selection - show all points without highlight
      if (clusterData) {
        currentPokemonName = null;
        destroyChart();
        createChartContainer();
        createScatterChart(clusterData, null);
      }
    }
  });

  // Listen for scatter point clicks to sync with grid selection
  document.addEventListener('scatter-pokemon-clicked', (e) => {
    const { name } = e.detail;
    if (name && name !== currentPokemonName) {
      // Update our own highlight
      updateScatterHighlight(name);
    }
  });
}

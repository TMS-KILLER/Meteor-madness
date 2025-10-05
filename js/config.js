// NASA API конфигурация (online mode restored)
const NASA_API_KEY = 'ooHgXAVEeyOgGeLh8cC90YBP4gpKwYfNEJKRwN9T';
const NASA_API_URL = 'https://api.nasa.gov/neo/rest/v1/neo/browse';

// Глобальные переменные (offline mode - removed NASA API keys)
let scene, camera, renderer, controls;
let earth, asteroid, impactMarker;
let selectedAsteroid = null;
let impactLocation = { lat: 0, lng: 0 };
let isSimulationRunning = false;
let particles = [];
let explosionParticles = [];
let mapMarker = null;
let crater = null;
let showFallVisualization = false;
let atmosphereGlow = null;
let targetIndicator = null; // Индикатор цели для астероида

// Для пагинации астероидов
let currentPage = 0;
let allAsteroids = [];

// Инициализация сцены
async function init() {
    // Создание сцены
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Камера
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        10000
    );
    camera.position.z = 30;

    // Рендерер
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Управление камерой
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 15;
    controls.maxDistance = 100;

    // Освещение
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(50, 30, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    // Создание звездного фона
    createStarfield();

    // Создание Земли
    createEarth();

    // Создание Солнца
    createSun();

    // Обработка изменения размера окна
    window.addEventListener('resize', onWindowResize);

    // Загрузка данных NASA
    await loadNASAData();

    // Обработчики кнопок
    document.getElementById('start-simulation').addEventListener('click', startSimulation);
    document.getElementById('reset-simulation').addEventListener('click', resetSimulation);
    document.getElementById('toggle-visualization').addEventListener('click', toggleVisualization);
    document.getElementById('load-more-asteroids').addEventListener('click', loadMoreAsteroids);
    
    // Обработчик ввода координат
    document.getElementById('set-coordinates').addEventListener('click', setCoordinatesFromInput);

    // Скрыть экран загрузки
    document.getElementById('loading-screen').classList.add('hidden');

    // Запуск анимации
    animate();
}

// Обработка изменения размера окна
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Анимация
function animate() {
    requestAnimationFrame(animate);

    // REMOVED: Earth rotation to keep coordinates aligned with map
    // earth.rotation.y += 0.001;

    // Вращение астероида
    if (asteroid && !isSimulationRunning) {
        asteroid.rotation.x += 0.01;
        asteroid.rotation.y += 0.02;
    }

    // Обновление частиц
    updateParticles();

    controls.update();
    renderer.render(scene, camera);
}

// Запуск при загрузке страницы
window.addEventListener('DOMContentLoaded', init);

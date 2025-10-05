// Инициализация сцены
async function init() {
    console.log('🚀 Initializing application...');
    
    // Создание сцены
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Получаем размеры canvas контейнера
    const container = document.getElementById('canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Камера
    camera = new THREE.PerspectiveCamera(
        75,
        width / height,
        0.1,
        10000
    );
    camera.position.z = 30;

    // Рендерер
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: false,
        powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Управление камерой
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 15;
    controls.maxDistance = 100;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
    };

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
    
    // Инициализация мобильной адаптации
    if (typeof initMobile === 'function') {
        initMobile();
    }

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

    // Вывод информации о тестировании
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('🌍 METEOR MADNESS - NASA Space Apps Challenge 2025');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('📍 COORDINATE TESTING FUNCTIONS:');
    console.log('  • testCoordinates()     - Log coordinates for known cities');
    console.log('  • showTestMarkers()     - Show colored markers on globe');
    console.log('  • clearTestMarkers()    - Remove test markers');
    console.log('');
    console.log('🔧 COORDINATE SYSTEM:');
    console.log('  • Latitude: -90° (South) to +90° (North)');
    console.log('  • Longitude: -180° (West) to +180° (East)');
    console.log('  • 0°,0° = Gulf of Guinea (West Africa coast)');
    console.log('');
    console.log('✅ All systems ready! Select asteroid and impact location.');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    // Запуск анимации
    animate();
}

// Обработка изменения размера окна
function onWindowResize() {
    const container = document.getElementById('canvas-container');
    if (!container || !camera || !renderer) return;
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    
    console.log(`📐 Window resized: ${width}x${height}`);
}

// Анимация
function animate() {
    requestAnimationFrame(animate);

    // 🌍 ВРАЩЕНИЕ ЗЕМЛИ (реалистичное, с данными NASA)
    // Земля вращается против часовой стрелки, если смотреть сверху (с Северного полюса)
    // Скорость: 1 оборот за 24 секунды (ускорено в 3600 раз от реальной)
    if (earth && window.earthRotationSpeed) {
        earth.rotation.y += window.earthRotationSpeed;
        
        // Важно: маркер и кратер вращаются ВМЕСТЕ с Землей (они дочерние объекты)
        // Метеорит падает на ДВИЖУЩУЮСЯ цель - это учтено в simulation.js
    }

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

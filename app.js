// NASA API конфигурация
const NASA_API_KEY = 'ooHgXAVEeyOgGeLh8cC90YBP4gpKwYfNEJKRwN9T';
const NASA_API_URL = 'https://api.nasa.gov/neo/rest/v1/neo/browse';

// Используются официальные текстуры NASA:
// - Земля: NASA Blue Marble (world.topo.bathy)
// - Рельеф: GEBCO Bathymetry
// - Океаны: NASA Earth Observatory
// - Астероиды: NASA текстуры реальных астероидов

// Глобальные переменные
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

// Инициализация
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
    
    // Обработчик ввода координат
    document.getElementById('set-coordinates').addEventListener('click', setCoordinatesFromInput);

    // Скрыть экран загрузки
    document.getElementById('loading-screen').classList.add('hidden');

    // Запуск анимации
    animate();
}

// Создание звездного поля
function createStarfield() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 0.5,
        transparent: true,
        opacity: 0.8
    });

    const starsVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);
}

// Создание Земли
function createEarth() {
    const geometry = new THREE.SphereGeometry(10, 64, 64);
    
    // Официальные текстуры NASA
    const textureLoader = new THREE.TextureLoader();
    
    // NASA Blue Marble - основная текстура Земли
    const earthTexture = textureLoader.load('https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg');
    
    // NASA Earth Bump Map (рельеф)
    const bumpTexture = textureLoader.load('https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73934/gebco_bathy.5400x2700_8bit.jpg');
    
    // NASA Night Lights для specular (океаны отражают больше)
    const specularTexture = textureLoader.load('https://eoimages.gsfc.nasa.gov/images/imagerecords/79000/79765/dnb_land_ocean_ice.2012.54000x27000_geo.jpg');

    const material = new THREE.MeshPhongMaterial({
        map: earthTexture,
        bumpMap: bumpTexture,
        bumpScale: 0.3,
        specularMap: specularTexture,
        specular: new THREE.Color(0x333333),
        shininess: 15
    });

    earth = new THREE.Mesh(geometry, material);
    earth.receiveShadow = true;
    scene.add(earth);

    // Атмосфера
    const atmosphereGeometry = new THREE.SphereGeometry(10.5, 64, 64);
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
        color: 0x4488ff,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    earth.add(atmosphere);
    
    console.log('🌍 Земля создана с официальными текстурами NASA');
}

// Создание Солнца
function createSun() {
    const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(50, 30, 50);

    const sunLight = new THREE.PointLight(0xffff00, 2, 200);
    sun.add(sunLight);
    scene.add(sun);
}

// Загрузка данных NASA
async function loadNASAData() {
    try {
        const response = await fetch(`${NASA_API_URL}?api_key=${NASA_API_KEY}`);
        const data = await response.json();
        
        const asteroids = data.near_earth_objects.slice(0, 10);
        displayAsteroids(asteroids);
    } catch (error) {
        console.error('Ошибка загрузки данных NASA:', error);
        document.getElementById('asteroid-list').innerHTML = 
            '<p style="color: #ff4444;">Ошибка загрузки данных. Проверьте подключение к интернету.</p>';
    }
}

// Отображение списка астероидов
function displayAsteroids(asteroids) {
    const container = document.getElementById('asteroid-list');
    container.innerHTML = '';

    asteroids.forEach(asteroid => {
        const card = document.createElement('div');
        card.className = 'asteroid-card';
        
        const diameterMin = asteroid.estimated_diameter.meters.estimated_diameter_min.toFixed(0);
        const diameterMax = asteroid.estimated_diameter.meters.estimated_diameter_max.toFixed(0);
        const isHazardous = asteroid.is_potentially_hazardous_asteroid;

        card.innerHTML = `
            <div class="asteroid-name">
                ${asteroid.name}
                ${isHazardous ? '<span class="hazard-badge">⚠️ Опасный</span>' : ''}
            </div>
            <div class="asteroid-size">
                Диаметр: ${diameterMin}-${diameterMax} м
            </div>
        `;

        card.addEventListener('click', () => selectAsteroid(asteroid, card));
        container.appendChild(card);
    });
}

// Выбор астероида
function selectAsteroid(asteroid, cardElement) {
    // Убрать выделение с других карточек
    document.querySelectorAll('.asteroid-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    cardElement.classList.add('selected');
    selectedAsteroid = asteroid;

    // Отобразить информацию
    const infoSection = document.getElementById('asteroid-info');
    const detailsDiv = document.getElementById('asteroid-details');
    
    const diameterAvg = (
        (asteroid.estimated_diameter.meters.estimated_diameter_min +
        asteroid.estimated_diameter.meters.estimated_diameter_max) / 2
    ).toFixed(0);

    const velocity = asteroid.close_approach_data && asteroid.close_approach_data[0] 
        ? parseFloat(asteroid.close_approach_data[0].relative_velocity.kilometers_per_second).toFixed(2)
        : '20';

    detailsDiv.innerHTML = `
        <div class="detail-row">
            <span class="detail-label">Название:</span>
            <span class="detail-value">${asteroid.name}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Диаметр:</span>
            <span class="detail-value">${diameterAvg} м</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Скорость:</span>
            <span class="detail-value">${velocity} км/с</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Опасность:</span>
            <span class="detail-value">${asteroid.is_potentially_hazardous_asteroid ? 'Да' : 'Нет'}</span>
        </div>
    `;

    infoSection.style.display = 'block';

    // Создать астероид в сцене
    createAsteroidModel(diameterAvg);

    // Проверить готовность к запуску
    checkReadyToStart();
}

// Создание модели астероида
function createAsteroidModel(diameter) {
    // Удалить предыдущий астероид
    if (asteroid) {
        scene.remove(asteroid);
    }

    const size = diameter / 100; // Масштабирование
    const geometry = new THREE.DodecahedronGeometry(size, 1);
    
    const textureLoader = new THREE.TextureLoader();
    
    // NASA текстура астероида (используем текстуру Весты - реального астероида)
    // Или можно использовать текстуру Луны NASA для более реалистичного вида
    const asteroidTexture = textureLoader.load('https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57730/vesta_messenger_720.jpg');
    
    const material = new THREE.MeshPhongMaterial({
        map: asteroidTexture,
        bumpMap: asteroidTexture,
        bumpScale: 0.5,
        color: 0x888888
    });

    asteroid = new THREE.Mesh(geometry, material);
    asteroid.position.set(0, 0, 50);
    asteroid.castShadow = true;
    scene.add(asteroid);
    
    console.log(`☄️ Астероид создан с текстурой NASA (диаметр: ${diameter}м)`);
}

// Установка координат вручную
function setCoordinatesFromInput() {
    const latInput = parseFloat(document.getElementById('lat-input').value);
    const lngInput = parseFloat(document.getElementById('lng-input').value);
    
    if (isNaN(latInput) || isNaN(lngInput)) {
        alert('Пожалуйста, введите корректные координаты!');
        return;
    }
    
    if (latInput < -90 || latInput > 90) {
        alert('Широта должна быть от -90 до 90');
        return;
    }
    
    if (lngInput < -180 || lngInput > 180) {
        alert('Долгота должна быть от -180 до 180');
        return;
    }
    
    setImpactLocation(latInput, lngInput);
}

// Обработка клика по Земле - УДАЛЕНО

// Установка места падения
function setImpactLocation(lat, lng, point = null) {
    impactLocation = { lat, lng, point };

    // Обновить UI
    document.getElementById('lat').textContent = lat.toFixed(2) + '°';
    document.getElementById('lng').textContent = lng.toFixed(2) + '°';

    // Если точка не передана, рассчитать её
    if (!point) {
        // ТОЧНОЕ преобразование координат для соответствия карте и текстуре Земли
        const latRad = lat * (Math.PI / 180);
        const lngRad = lng * (Math.PI / 180);
        const radius = 10;
        
        point = new THREE.Vector3();
        // Исправленная формула с правильным смещением для текстуры Земли
        point.x = radius * Math.cos(latRad) * Math.sin(lngRad + Math.PI);
        point.y = radius * Math.sin(latRad);
        point.z = radius * Math.cos(latRad) * Math.cos(lngRad + Math.PI);
        
        impactLocation.point = point;
        
        console.log(`🎯 Координаты установлены: Lat=${lat.toFixed(4)}°, Lng=${lng.toFixed(4)}°`);
        console.log(`🎯 3D позиция: X=${point.x.toFixed(4)}, Y=${point.y.toFixed(4)}, Z=${point.z.toFixed(4)}`);
    }

    // Создать маркер - удаляем старый если есть
    if (impactMarker) {
        if (impactMarker.parent) {
            impactMarker.parent.remove(impactMarker);
        }
        scene.remove(impactMarker);
        if (impactMarker.geometry) impactMarker.geometry.dispose();
        if (impactMarker.material) impactMarker.material.dispose();
    }

    const markerGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    impactMarker = new THREE.Mesh(markerGeometry, markerMaterial);
    impactMarker.position.copy(point).normalize().multiplyScalar(10.1);
    earth.add(impactMarker);

    // Обновить маркер на карте
    updateMapMarker(lat, lng);

    checkReadyToStart();
}

// Экспорт для использования из HTML
window.setImpactLocation = setImpactLocation;

// Проверка готовности к запуску
function checkReadyToStart() {
    const startButton = document.getElementById('start-simulation');
    if (selectedAsteroid && impactMarker) {
        startButton.disabled = false;
    }
}

// Запуск симуляции
function startSimulation() {
    if (isSimulationRunning) return;
    
    isSimulationRunning = true;
    document.getElementById('start-simulation').disabled = true;

    // Расчет энергии удара
    calculateImpact();

    // Анимация падения
    animateImpact();
}

// Расчет параметров удара
function calculateImpact() {
    const diameter = (
        selectedAsteroid.estimated_diameter.meters.estimated_diameter_min +
        selectedAsteroid.estimated_diameter.meters.estimated_diameter_max
    ) / 2;

    const velocity = selectedAsteroid.close_approach_data && selectedAsteroid.close_approach_data[0]
        ? parseFloat(selectedAsteroid.close_approach_data[0].relative_velocity.kilometers_per_second)
        : 20;

    const mass = (4/3) * Math.PI * Math.pow(diameter/2, 3) * 2500; // плотность ~2500 кг/м³
    const kineticEnergy = 0.5 * mass * Math.pow(velocity * 1000, 2); // Джоули
    const megatons = kineticEnergy / (4.184 * 10**15); // конвертация в мегатонны TNT
    const craterDiameter = 1.8 * Math.pow(diameter, 0.78) * Math.pow(velocity, 0.44);

    const impactInfo = document.getElementById('impact-info');
    const impactDetails = document.getElementById('impact-details');
    
    impactDetails.innerHTML = `
        <div class="detail-row">
            <span class="detail-label">Масса:</span>
            <span class="detail-value">${(mass / 1000000).toFixed(2)} тонн</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Энергия удара:</span>
            <span class="detail-value">${megatons.toFixed(2)} мегатонн TNT</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Диаметр кратера:</span>
            <span class="detail-value">${craterDiameter.toFixed(0)} м</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Радиус разрушения:</span>
            <span class="detail-value">${(craterDiameter * 2).toFixed(0)} м</span>
        </div>
    `;

    impactInfo.style.display = 'block';
}

// Анимация удара
function animateImpact() {
    const startPos = asteroid.position.clone();
    const endPos = impactLocation.point.clone().normalize().multiplyScalar(10);
    const duration = 5000; // 5 секунд для более детальной анимации
    const startTime = Date.now();

    // Получаем данные астероида
    const diameter = (
        selectedAsteroid.estimated_diameter.meters.estimated_diameter_min +
        selectedAsteroid.estimated_diameter.meters.estimated_diameter_max
    ) / 2;
    
    const velocity = selectedAsteroid.close_approach_data && selectedAsteroid.close_approach_data[0]
        ? parseFloat(selectedAsteroid.close_approach_data[0].relative_velocity.kilometers_per_second)
        : 20;
    
    const craterDiameter = 1.8 * Math.pow(diameter, 0.78) * Math.pow(velocity, 0.44);
    const mass = (4/3) * Math.PI * Math.pow(diameter/2, 3) * 2500;
    const kineticEnergy = 0.5 * mass * Math.pow(velocity * 1000, 2);
    
    // Создаем свечение атмосферы при входе
    if (showFallVisualization) {
        createAtmosphericEntry();
    }

    function updateImpact() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Кривая ускорения (более реалистичная - гравитационное ускорение)
        const easedProgress = 1 - Math.pow(1 - progress, 2);

        asteroid.position.lerpVectors(startPos, endPos, easedProgress);
        
        // Вращение на основе реальных данных
        const rotationSpeed = Math.min(velocity / 10, 0.2);
        asteroid.rotation.x += rotationSpeed;
        asteroid.rotation.y += rotationSpeed * 0.7;

        // Визуализация падения
        if (showFallVisualization) {
            // След с интенсивностью зависящей от скорости - больше частиц
            if (Math.random() > 0.3) {
                createEnhancedTrailParticle(asteroid.position.clone(), velocity, progress);
            }
            
            // Нагрев при входе в атмосферу (последние 30% пути) - чаще
            if (progress > 0.7 && Math.random() > 0.4) {
                createAtmosphericHeating(asteroid.position.clone(), progress);
            }
            
            // Ударная волна перед астероидом - раньше и чаще
            if (progress > 0.8 && Math.random() > 0.6) {
                createShockwave(asteroid.position.clone(), endPos, progress);
            }
        } else {
            // Простой след - тоже улучшим
            if (Math.random() > 0.5) {
                createTrailParticle(asteroid.position.clone());
            }
        }

        if (progress < 1) {
            requestAnimationFrame(updateImpact);
        } else {
            // Взрыв при ударе
            createRealisticExplosion(endPos, craterDiameter, kineticEnergy, velocity, diameter);
            scene.remove(asteroid);
            asteroid = null;
            
            // Удалить геомаркер после удара - ИСПРАВЛЕНО
            if (impactMarker) {
                // Удаляем маркер из его родителя (earth)
                if (impactMarker.parent) {
                    impactMarker.parent.remove(impactMarker);
                }
                // Также пробуем удалить из scene на случай, если он там
                scene.remove(impactMarker);
                // Очищаем геометрию и материал
                if (impactMarker.geometry) impactMarker.geometry.dispose();
                if (impactMarker.material) impactMarker.material.dispose();
                impactMarker = null;
            }
            
            // Убрать свечение атмосферы
            if (atmosphereGlow) {
                scene.remove(atmosphereGlow);
                if (atmosphereGlow.geometry) atmosphereGlow.geometry.dispose();
                if (atmosphereGlow.material) atmosphereGlow.material.dispose();
                atmosphereGlow = null;
            }
            
            // Показать информацию о месте падения
            showImpactLocationInfo(impactLocation.lat, impactLocation.lng, craterDiameter);
        }
    }

    updateImpact();
}

// Создание частицы следа
function createTrailParticle(position) {
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 1
    });
    const particle = new THREE.Mesh(geometry, material);
    particle.position.copy(position);
    scene.add(particle);

    particles.push({ mesh: particle, life: 1 });
}

// Улучшенная частица следа с учетом скорости
function createEnhancedTrailParticle(position, velocity, progress) {
    const size = 0.15 + (velocity / 80);
    const geometry = new THREE.SphereGeometry(size, 20, 20);
    
    // Цвет зависит от температуры (скорости) - более яркие цвета
    const temperature = velocity * progress;
    let color;
    if (temperature > 30) {
        color = 0xffffff; // Белый - очень горячо
    } else if (temperature > 20) {
        color = 0xffff88; // Светло-желтый - горячо
    } else if (temperature > 10) {
        color = 0xff9933; // Ярко-оранжевый - тепло
    } else {
        color = 0xff5500; // Ярко-красный - начальная стадия
    }
    
    const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.9
    });
    const particle = new THREE.Mesh(geometry, material);
    particle.position.copy(position);
    
    // Добавить внутреннее свечение
    const glowGeometry = new THREE.SphereGeometry(size * 1.5, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    particle.add(glow);
    
    scene.add(particle);
    particles.push({ mesh: particle, life: 1.5, enhanced: true });
}

// Создание эффекта входа в атмосферу
function createAtmosphericEntry() {
    const glowGeometry = new THREE.SphereGeometry(10.8, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide
    });
    atmosphereGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(atmosphereGlow);
}

// Эффект нагрева при входе в атмосферу
function createAtmosphericHeating(position, progress) {
    const heatIntensity = (progress - 0.7) / 0.3; // От 0 до 1
    
    for (let i = 0; i < 8; i++) {
        const size = 0.08 + Math.random() * 0.25;
        const geometry = new THREE.SphereGeometry(size, 12, 12);
        
        // Более интенсивные цвета нагрева
        const colors = [0xffffff, 0xffff44, 0xff8833, 0xff4411];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.9
        });
        const heatParticle = new THREE.Mesh(geometry, material);
        
        const offset = new THREE.Vector3(
            (Math.random() - 0.5) * 1.2,
            (Math.random() - 0.5) * 1.2,
            (Math.random() - 0.5) * 1.2
        );
        heatParticle.position.copy(position).add(offset);
        
        // Добавить движение частиц
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.05,
            (Math.random() - 0.5) * 0.05,
            (Math.random() - 0.5) * 0.05
        );
        
        scene.add(heatParticle);
        particles.push({ 
            mesh: heatParticle, 
            life: 0.8, 
            isHeat: true,
            velocity: velocity
        });
    }
}

// Ударная волна перед астероидом
function createShockwave(position, target, progress) {
    const direction = new THREE.Vector3().subVectors(target, position).normalize();
    const shockwavePos = position.clone().add(direction.multiplyScalar(2));
    
    const geometry = new THREE.RingGeometry(0.3, 0.5, 32);
    const material = new THREE.MeshBasicMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    const shockwave = new THREE.Mesh(geometry, material);
    shockwave.position.copy(shockwavePos);
    shockwave.lookAt(target);
    scene.add(shockwave);

    particles.push({ mesh: shockwave, life: 0.3, isShockwave: true });
}

// Реалистичный взрыв на основе данных NASA - УЛУЧШЕННАЯ ВЕРСИЯ
function createRealisticExplosion(position, craterDiameter, kineticEnergy, velocity, diameter) {
    const megatons = kineticEnergy / (4.184 * 10**15);
    
    // Главная вспышка - размер зависит от энергии
    const flashSize = Math.min(3 + (megatons / 50), 12);
    const flashGeometry = new THREE.SphereGeometry(flashSize, 32, 32);
    const flashMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1
    });
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.copy(position);
    scene.add(flash);

    // Анимация вспышки с пульсацией
    let flashScale = 1;
    let flashPulse = 0;
    const flashInterval = setInterval(() => {
        flashScale += 0.4;
        flashPulse += 0.2;
        const pulse = 1 + Math.sin(flashPulse) * 0.3;
        flash.scale.set(flashScale * pulse, flashScale * pulse, flashScale * pulse);
        flash.material.opacity -= 0.025;

        if (flash.material.opacity <= 0) {
            scene.remove(flash);
            clearInterval(flashInterval);
        }
    }, 40);

    // Огненный шар - больше частиц для реалистичности
    const particleCount = Math.min(200 + Math.floor(diameter / 5), 800);
    
    for (let i = 0; i < particleCount; i++) {
        const particleSize = 0.08 + Math.random() * 0.3;
        const particleGeometry = new THREE.SphereGeometry(particleSize, 12, 12);
        
        // Более разнообразные цвета взрыва
        const colors = [0xffffff, 0xffff99, 0xffcc44, 0xff8844, 0xff4422, 0xff1100, 0xcc0000];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 1
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.copy(position);

        // Более реалистичная скорость разлета
        const explosionSpeed = 0.3 + (velocity / 30);
        const direction = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        ).normalize();
        
        const speed = Math.random() * explosionSpeed + 0.05;
        const velocity3D = direction.multiplyScalar(speed);

        scene.add(particle);
        explosionParticles.push({ 
            mesh: particle, 
            velocity: velocity3D, 
            life: 1.5 + Math.random() * 0.5,
            fadeSpeed: 0.003 + Math.random() * 0.007,
            initialSize: particleSize
        });
    }

    // Дополнительные искры
    for (let i = 0; i < 50; i++) {
        const sparkGeometry = new THREE.SphereGeometry(0.02 + Math.random() * 0.08, 8, 8);
        const sparkMaterial = new THREE.MeshBasicMaterial({
            color: Math.random() > 0.5 ? 0xffff00 : 0xff4400,
            transparent: true,
            opacity: 1
        });
        const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
        spark.position.copy(position);

        const sparkVelocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.8,
            (Math.random() - 0.5) * 0.8,
            (Math.random() - 0.5) * 0.8
        );

        scene.add(spark);
        explosionParticles.push({ 
            mesh: spark, 
            velocity: sparkVelocity, 
            life: 0.8,
            fadeSpeed: 0.02,
            isSpark: true
        });
    }

    // Ударная волна на поверхности
    createGroundShockwave(position, craterDiameter);
    
    // Создание кратера
    createCrater(position, craterDiameter);
    
    // Грибовидное облако для крупных ударов
    if (megatons > 1) {
        createMushroomCloud(position, megatons);
    }
    
    // Световая волна
    createLightWave(position, megatons);
}

// Световая волна от взрыва
function createLightWave(position, megatons) {
    const waveSize = Math.min(15 + megatons * 5, 50);
    let currentSize = 2;
    
    const waveInterval = setInterval(() => {
        currentSize += 3;
        
        const waveGeometry = new THREE.SphereGeometry(currentSize, 32, 32);
        const waveMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffaa,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide
        });
        const wave = new THREE.Mesh(waveGeometry, waveMaterial);
        wave.position.copy(position);
        scene.add(wave);
        
        explosionParticles.push({ 
            mesh: wave, 
            life: 0.3, 
            isWave: true,
            fadeSpeed: 0.02
        });
        
        if (currentSize >= waveSize) {
            clearInterval(waveInterval);
        }
    }, 80);
}

// Ударная волна по поверхности
function createGroundShockwave(position, craterDiameter) {
    const maxRadius = Math.min(craterDiameter / 200, 3);
    let currentRadius = 0.1;
    
    const shockwaveInterval = setInterval(() => {
        currentRadius += 0.15;
        
        const ringGeometry = new THREE.RingGeometry(currentRadius, currentRadius + 0.2, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(position).normalize().multiplyScalar(10.01);
        ring.lookAt(0, 0, 0);
        earth.add(ring);
        
        explosionParticles.push({ mesh: ring, life: 0.5, isRing: true, parent: earth });
        
        if (currentRadius >= maxRadius) {
            clearInterval(shockwaveInterval);
        }
    }, 100);
}

// Грибовидное облако для мощных взрывов
function createMushroomCloud(position, megatons) {
    const cloudSize = Math.min(1 + megatons / 10, 4);
    const cloudParticles = 50;
    
    for (let i = 0; i < cloudParticles; i++) {
        setTimeout(() => {
            const angle = (i / cloudParticles) * Math.PI * 2;
            const radius = cloudSize * (0.5 + Math.random() * 0.5);
            const height = cloudSize * (1 + Math.random() * 0.5);
            
            const particleGeometry = new THREE.SphereGeometry(0.2 + Math.random() * 0.3, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.5 ? 0x555555 : 0x888888,
                transparent: true,
                opacity: 0.6
            });
            const cloudParticle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            const offset = position.clone().normalize().multiplyScalar(height);
            cloudParticle.position.copy(position).add(offset);
            cloudParticle.position.x += Math.cos(angle) * radius;
            cloudParticle.position.z += Math.sin(angle) * radius;
            
            scene.add(cloudParticle);
            explosionParticles.push({ 
                mesh: cloudParticle, 
                velocity: new THREE.Vector3(0, 0.02, 0), 
                life: 2,
                isCloud: true,
                fadeSpeed: 0.002
            });
        }, i * 50);
    }
}

// Создание взрыва - СТАРАЯ ВЕРСИЯ УДАЛЕНА, ЗАМЕНЕНА НА createRealisticExplosion

// Создание реалистичного кратера
function createCrater(position, craterDiameterMeters) {
    // Масштабируем диаметр кратера для 3D модели (1 единица = 1000 км на Земле)
    // Радиус Земли в модели = 10 единиц, реальный радиус = 6371 км
    // Масштаб: 1 единица модели = 637.1 км
    const scale = 637100; // метров в одной единице модели
    const craterRadiusInUnits = (craterDiameterMeters / 2) / scale;
    
    // Ограничиваем размер кратера для визуализации
    const visualRadius = Math.min(Math.max(craterRadiusInUnits * 50, 0.3), 3);
    
    // Создаем группу для кратера
    const craterGroup = new THREE.Group();
    
    // Основной кратер (темный круг)
    const craterGeometry = new THREE.CircleGeometry(visualRadius, 64);
    const craterMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a1a1a,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
    });
    const craterMesh = new THREE.Mesh(craterGeometry, craterMaterial);
    craterGroup.add(craterMesh);
    
    // Внутреннее кольцо (более темное)
    const innerRingGeometry = new THREE.RingGeometry(visualRadius * 0.3, visualRadius * 0.6, 64);
    const innerRingMaterial = new THREE.MeshPhongMaterial({
        color: 0x0d0d0d,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
    });
    const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
    craterGroup.add(innerRing);
    
    // Внешнее кольцо выброса (светлее)
    const ejectaRingGeometry = new THREE.RingGeometry(visualRadius, visualRadius * 1.5, 64);
    const ejectaRingMaterial = new THREE.MeshPhongMaterial({
        color: 0x3a3a3a,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
    });
    const ejectaRing = new THREE.Mesh(ejectaRingGeometry, ejectaRingMaterial);
    craterGroup.add(ejectaRing);
    
    // Позиционируем кратер на поверхности Земли
    craterGroup.position.copy(position).normalize().multiplyScalar(10.02);
    craterGroup.lookAt(0, 0, 0);
    
    earth.add(craterGroup);
    crater = craterGroup;
    
    console.log(`Кратер создан: диаметр ${craterDiameterMeters.toFixed(0)}м, визуальный радиус ${visualRadius.toFixed(2)} единиц`);
}

// Сброс симуляции
function resetSimulation() {
    isSimulationRunning = false;
    
    if (asteroid) {
        scene.remove(asteroid);
        asteroid = null;
    }

    if (impactMarker) {
        // Удаляем маркер правильно
        if (impactMarker.parent) {
            impactMarker.parent.remove(impactMarker);
        }
        scene.remove(impactMarker);
        if (impactMarker.geometry) impactMarker.geometry.dispose();
        if (impactMarker.material) impactMarker.material.dispose();
        impactMarker = null;
    }

    if (crater) {
        if (crater.parent) {
            crater.parent.remove(crater);
        }
        // Очистить все дочерние элементы кратера
        crater.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
        crater = null;
    }

    particles.forEach(p => scene.remove(p.mesh));
    particles = [];
    explosionParticles.forEach(p => scene.remove(p.mesh));
    explosionParticles = [];

    selectedAsteroid = null;
    impactLocation = { lat: 0, lng: 0 };

    document.getElementById('asteroid-info').style.display = 'none';
    document.getElementById('impact-info').style.display = 'none';
    document.getElementById('lat').textContent = '0°';
    document.getElementById('lng').textContent = '0°';
    document.getElementById('start-simulation').disabled = true;

    // Сбросить маркер на карте
    if (mapMarker) {
        mapMarker.remove();
        mapMarker = null;
    }

    document.querySelectorAll('.asteroid-card').forEach(card => {
        card.classList.remove('selected');
    });
}

// Переключение визуализации падения
function toggleVisualization() {
    showFallVisualization = !showFallVisualization;
    const button = document.getElementById('toggle-visualization');
    
    if (showFallVisualization) {
        button.textContent = '🔥 Визуализация падения: ВКЛ';
        button.classList.add('active');
    } else {
        button.textContent = '🔥 Визуализация падения: ВЫКЛ';
        button.classList.remove('active');
    }
}

// Обновление маркера на карте
function updateMapMarker(lat, lng) {
    if (!window.mapInitialized) return;
    
    if (mapMarker) {
        mapMarker.setLatLng([lat, lng]);
    } else {
        mapMarker = L.marker([lat, lng], {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        }).addTo(window.map);
        mapMarker.bindPopup('Место падения').openPopup();
    }
    
    window.map.setView([lat, lng], 5);
}

// Обновление частиц
function updateParticles() {
    // След
    particles.forEach((particle, index) => {
        particle.life -= particle.enhanced ? 0.012 : 0.02;
        particle.mesh.material.opacity = particle.life;
        
        if (particle.isHeat) {
            particle.mesh.position.y += 0.02; // Поднимается вверх быстрее
            if (particle.velocity) {
                particle.mesh.position.add(particle.velocity);
            }
        }
        
        if (!particle.isShockwave) {
            particle.mesh.scale.multiplyScalar(0.97);
        }

        if (particle.life <= 0) {
            scene.remove(particle.mesh);
            particles.splice(index, 1);
        }
    });

    // Взрыв
    explosionParticles.forEach((particle, index) => {
        if (particle.velocity) {
            particle.mesh.position.add(particle.velocity);
            // Добавить гравитацию для частиц взрыва
            if (!particle.isSpark && !particle.isWave) {
                particle.velocity.y -= 0.001;
            }
        }
        
        const fadeSpeed = particle.fadeSpeed || 0.01;
        particle.life -= fadeSpeed;
        particle.mesh.material.opacity = Math.max(0, particle.life);
        
        // Уменьшение размера частиц со временем
        if (particle.initialSize && particle.life < 0.5) {
            const scale = particle.life * 2;
            particle.mesh.scale.set(scale, scale, scale);
        }

        if (particle.life <= 0) {
            if (particle.parent) {
                particle.parent.remove(particle.mesh);
            } else {
                scene.remove(particle.mesh);
            }
            explosionParticles.splice(index, 1);
        }
    });
}

// Показать детальную информацию о месте падения после удара
function showImpactLocationInfo(lat, lng, craterDiameter) {
    const impactDetails = document.getElementById('impact-details');
    
    // Определить регион
    let locationName = getLocationName(lat, lng);
    
    // Определить тип местности
    let terrainType = getTerrainType(lat, lng);
    
    // Определить полушария
    let hemisphere = getHemisphere(lat, lng);
    
    // Определить климатическую зону
    let climateZone = getClimateZone(lat);
    
    // Определить часовой пояс (приблизительно)
    let timeZone = Math.round(lng / 15);
    let timeZoneStr = `UTC${timeZone >= 0 ? '+' : ''}${timeZone}`;
    
    // Добавить детальную информацию о месте падения
    const locationInfo = `
        <div class="detail-row" style="border-top: 2px solid #4CAF50; margin-top: 10px; padding-top: 10px;">
            <span class="detail-label">📍 Место падения:</span>
            <span class="detail-value">${locationName}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Координаты:</span>
            <span class="detail-value">${lat.toFixed(4)}° ${lat >= 0 ? 'С.Ш.' : 'Ю.Ш.'}, ${lng.toFixed(4)}° ${lng >= 0 ? 'В.Д.' : 'З.Д.'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Полушария:</span>
            <span class="detail-value">${hemisphere}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Тип местности:</span>
            <span class="detail-value">${terrainType}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Климатическая зона:</span>
            <span class="detail-value">${climateZone}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Часовой пояс:</span>
            <span class="detail-value">${timeZoneStr}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Площадь поражения:</span>
            <span class="detail-value">~${(Math.PI * Math.pow(craterDiameter * 2, 2) / 1000000).toFixed(2)} км²</span>
        </div>
    `;
    
    impactDetails.innerHTML += locationInfo;
    
    console.log(`💥 Детальная информация о падении:`);
    console.log(`   Регион: ${locationName}`);
    console.log(`   Координаты: ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
    console.log(`   Местность: ${terrainType}`);
    console.log(`   Климат: ${climateZone}`);
}

// Определить тип местности по координатам
function getTerrainType(lat, lng) {
    // Проверка на океаны (упрощенная логика)
    const isOcean = 
        (lng > -180 && lng < -80 && lat > -60 && lat < 60) || // Тихий
        (lng > -80 && lng < 20 && lat > -60 && lat < 60) || // Атлантический
        (lng > 20 && lng < 120 && lat > -60 && lat < 30) || // Индийский
        (lat > 60) || // Северный Ледовитый
        (lat < -60); // Южный
    
    if (isOcean) return "🌊 Океан/Море";
    
    // Горные регионы
    if ((lat > 25 && lat < 40 && lng > 70 && lng < 105) || // Гималаи
        (lat > 35 && lat < 50 && lng > -125 && lng < -100) || // Скалистые горы
        (lat > -40 && lat < -20 && lng > -75 && lng < -65)) { // Анды
        return "⛰️ Горная местность";
    }
    
    // Пустыни
    if ((lat > 15 && lat < 35 && lng > -10 && lng < 35) || // Сахара
        (lat > 25 && lat < 40 && lng > 40 && lng < 65) || // Аравийская
        (lat > -30 && lat < -20 && lng > 115 && lng < 140)) { // Австралийская
        return "🏜️ Пустыня";
    }
    
    // Тропические леса
    if ((lat > -10 && lat < 10 && lng > -80 && lng < -40) || // Амазония
        (lat > -5 && lat < 5 && lng > 10 && lng < 30)) { // Конго
        return "🌴 Тропический лес";
    }
    
    // Тундра/Арктика
    if (lat > 66 || lat < -66) return "❄️ Тундра/Полярная область";
    
    // Лесная зона
    if (lat > 45 && lat < 66) return "🌲 Лесная зона (тайга)";
    
    // Степь/Равнина
    if (lat > 30 && lat < 50) return "🌾 Степь/Равнина";
    
    return "🏞️ Равнинная местность";
}

// Определить полушария
function getHemisphere(lat, lng) {
    const ns = lat >= 0 ? "Северное" : "Южное";
    const ew = lng >= 0 ? "Восточное" : "Западное";
    return `${ns}, ${ew}`;
}

// Определить климатическую зону
function getClimateZone(lat) {
    const absLat = Math.abs(lat);
    
    if (absLat > 66.5) return "❄️ Полярный климат";
    if (absLat > 60) return "🌨️ Субполярный климат";
    if (absLat > 45) return "🌡️ Умеренный климат";
    if (absLat > 30) return "🌤️ Субтропический климат";
    if (absLat > 23.5) return "🌞 Тропический климат";
    return "☀️ Экваториальный климат";
}

// Определить детальное название местоположения по координатам
function getLocationName(lat, lng) {
    // Северная Америка - детальная разбивка
    if (lat > 15 && lat < 72 && lng > -170 && lng < -52) {
        // Канада
        if (lat > 49 && lng > -141 && lng < -53) {
            if (lng > -95) return "Восточная Канада";
            if (lng > -120) return "Центральная Канада (Прерии)";
            return "Западная Канада";
        }
        // США
        if (lat > 24 && lat < 49 && lng > -125 && lng < -66) {
            if (lng > -80) return "Восточное побережье США";
            if (lng > -95) return "Средний Запад США";
            if (lng > -110) return "Великие равнины США";
            return "Западное побережье США";
        }
        // Мексика и Центральная Америка
        if (lat > 15 && lng > -118 && lng < -86) return "Мексика";
        if (lat > 7 && lng > -92 && lng < -77) return "Центральная Америка";
        return "Северная Америка";
    }
    
    // Южная Америка - детальная разбивка
    if (lat > -55 && lat < 15 && lng > -81 && lng < -34) {
        if (lat > -5 && lng > -80 && lng < -66) return "Колумбия/Венесуэла";
        if (lat > -18 && lng > -77 && lng < -48) return "Бразилия";
        if (lat > -35 && lat < -18 && lng > -70 && lng < -53) return "Аргентина";
        if (lat > -25 && lng > -75 && lng < -66) return "Перу/Боливия";
        if (lat > -40 && lng > -75 && lng < -66) return "Чили";
        return "Южная Америка";
    }
    
    // Европа - детальная разбивка
    if (lat > 35 && lat < 72 && lng > -25 && lng < 45) {
        if (lat > 66) return "Северная Скандинавия";
        if (lat > 55 && lng > 10 && lng < 32) return "Скандинавия (Швеция/Норвегия)";
        if (lat > 55 && lng > -10 && lng < 10) return "Британские острова";
        if (lat > 50 && lng > 5 && lng < 15) return "Германия";
        if (lat > 45 && lng > -5 && lng < 8) return "Франция";
        if (lat > 40 && lng > 8 && lng < 19) return "Италия";
        if (lat > 36 && lng > -10 && lng < 5) return "Испания/Португалия";
        if (lat > 40 && lng > 19 && lng < 30) return "Балканы";
        if (lat > 45 && lng > 15 && lng < 30) return "Восточная Европа";
        if (lat > 50 && lng > 20 && lng < 40) return "Восточная Европа (Польша/Украина)";
        return "Европа";
    }
    
    // Россия
    if (lat > 40 && lat < 80 && lng > 25 && lng < 180) {
        if (lng < 60) return "Европейская часть России";
        if (lng < 100) return "Западная Сибирь";
        if (lng < 140) return "Восточная Сибирь";
        return "Дальний Восток России";
    }
    
    // Азия - детальная разбивка
    if (lat > -10 && lat < 80 && lng > 45 && lng < 180) {
        // Ближний Восток
        if (lat > 12 && lat < 42 && lng > 34 && lng < 65) return "Ближний Восток";
        // Центральная Азия
        if (lat > 35 && lat < 50 && lng > 50 && lng < 90) return "Центральная Азия";
        // Южная Азия
        if (lat > 5 && lat < 35 && lng > 65 && lng < 95) return "Южная Азия (Индия/Пакистан)";
        // Юго-Восточная Азия
        if (lat > -10 && lat < 25 && lng > 95 && lng < 115) return "Юго-Восточная Азия";
        // Восточная Азия
        if (lat > 20 && lat < 50 && lng > 100 && lng < 145) {
            if (lng > 130) return "Япония";
            if (lat > 35) return "Северо-Восточный Китай";
            return "Восточный Китай";
        }
        return "Азия";
    }
    
    // Африка - детальная разбивка
    if (lat > -35 && lat < 37 && lng > -18 && lng < 50) {
        if (lat > 20 && lng > -10 && lng < 32) return "Северная Африка (Сахара)";
        if (lat > 15 && lng > 30 && lng < 50) return "Северо-Восточная Африка";
        if (lat > -10 && lat < 15 && lng > 10 && lng < 40) return "Центральная Африка";
        if (lat > -35 && lat < -10 && lng > 15 && lng < 40) return "Южная Африка";
        if (lat > -5 && lng > -18 && lng < 15) return "Западная Африка";
        return "Африка";
    }
    
    // Австралия и Океания
    if (lat > -50 && lat < -10 && lng > 110 && lng < 180) {
        if (lng > 140 && lat > -30) return "Восточная Австралия";
        if (lng < 130) return "Западная Австралия";
        return "Австралия";
    }
    
    // Антарктида
    if (lat < -60) {
        if (lng > -60 && lng < 20) return "Западная Антарктида";
        return "Восточная Антарктида";
    }
    
    // Океаны - детальная разбивка
    if (lng > -180 && lng < -80 && lat > -60 && lat < 60) return "Тихий океан";
    if (lng > -80 && lng < 20 && lat > -60 && lat < 60) return "Атлантический океан";
    if (lng > 20 && lng < 120 && lat > -60 && lat < 30) return "Индийский океан";
    if (lat > 60) return "Северный Ледовитый океан";
    if (lat < -60) return "Южный океан";
    
    return "Мировой океан";
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

    // Вращение Земли
    earth.rotation.y += 0.001;

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

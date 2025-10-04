// Загрузка данных NASA
async function loadNASAData() {
    try {
        console.log('Попытка загрузки данных NASA...');
        
        const response = await fetch(`${NASA_API_URL}?page=${currentPage}&size=20&api_key=${NASA_API_KEY}`, {
            signal: AbortSignal.timeout(10000) // Таймаут 10 секунд
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('✅ NASA данные загружены, страница:', currentPage);
        console.log('Найдено астероидов на странице:', data.near_earth_objects.length);
        
        // Добавляем к существующему списку
        const newAsteroids = data.near_earth_objects;
        allAsteroids = allAsteroids.concat(newAsteroids);
        
        // ВАЖНО: Ищем импактор-2025 или создаем его
        await addImpactor2025();
        
        displayAsteroids(allAsteroids);
        
        // Показать кнопку "Загрузить ещё" если есть следующая страница
        const loadMoreBtn = document.getElementById('load-more-asteroids');
        if (data.links && data.links.next) {
            loadMoreBtn.style.display = 'block';
            loadMoreBtn.textContent = `📥 Загрузить ещё астероидов (загружено: ${allAsteroids.length})`;
        } else {
            loadMoreBtn.style.display = 'none';
        }
        
    } catch (error) {
        console.error('❌ Ошибка загрузки данных NASA:', error);
        
        // Используем запасные данные
        console.log('⚠️ Загружаем запасные данные...');
        loadFallbackData();
    }
}

// Запасные данные если NASA API недоступен
function loadFallbackData() {
    const selectElement = document.getElementById('asteroid-select');
    
    // Создаем реалистичные тестовые астероиды
    allAsteroids = [
        {
            id: "IMPACTOR-2025",
            name: "IMPACTOR-2025 (Симуляция)",
            is_potentially_hazardous_asteroid: true,
            estimated_diameter: {
                meters: {
                    estimated_diameter_min: 800,
                    estimated_diameter_max: 1200
                }
            },
            close_approach_data: [{
                relative_velocity: {
                    kilometers_per_second: "25.5"
                },
                miss_distance: {
                    kilometers: "0"
                }
            }]
        },
        {
            id: "2023-ABC",
            name: "2023 ABC (Симуляция)",
            is_potentially_hazardous_asteroid: true,
            estimated_diameter: {
                meters: {
                    estimated_diameter_min: 400,
                    estimated_diameter_max: 600
                }
            },
            close_approach_data: [{
                relative_velocity: {
                    kilometers_per_second: "20.0"
                },
                miss_distance: {
                    kilometers: "50000"
                }
            }]
        },
        {
            id: "2024-XYZ",
            name: "2024 XYZ (Симуляция)",
            is_potentially_hazardous_asteroid: false,
            estimated_diameter: {
                meters: {
                    estimated_diameter_min: 100,
                    estimated_diameter_max: 200
                }
            },
            close_approach_data: [{
                relative_velocity: {
                    kilometers_per_second: "15.0"
                },
                miss_distance: {
                    kilometers: "100000"
                }
            }]
        },
        {
            id: "TUNGUSKA",
            name: "Тунгусский метеорит (1908)",
            is_potentially_hazardous_asteroid: true,
            estimated_diameter: {
                meters: {
                    estimated_diameter_min: 50,
                    estimated_diameter_max: 80
                }
            },
            close_approach_data: [{
                relative_velocity: {
                    kilometers_per_second: "27.0"
                },
                miss_distance: {
                    kilometers: "0"
                }
            }]
        },
        {
            id: "CHELYABINSK",
            name: "Челябинский метеорит (2013)",
            is_potentially_hazardous_asteroid: false,
            estimated_diameter: {
                meters: {
                    estimated_diameter_min: 17,
                    estimated_diameter_max: 20
                }
            },
            close_approach_data: [{
                relative_velocity: {
                    kilometers_per_second: "19.0"
                },
                miss_distance: {
                    kilometers: "0"
                }
            }]
        }
    ];
    
    console.log('✅ Запасные данные загружены:', allAsteroids.length, 'астероидов');
    displayAsteroids(allAsteroids);
}

// Загрузить больше астероидов
function loadMoreAsteroids() {
    currentPage++;
    loadNASAData();
}

// Отображение списка астероидов в выпадающем списке
function displayAsteroids(asteroids) {
    const selectElement = document.getElementById('asteroid-select');
    
    // Очищаем старые опции, кроме первой (placeholder)
    selectElement.innerHTML = '<option value="">-- Выберите астероид --</option>';

    // СОРТИРУЕМ: Опасные астероиды первыми, потом по размеру
    const sortedAsteroids = [...asteroids].sort((a, b) => {
        // Сначала опасные
        if (a.is_potentially_hazardous_asteroid && !b.is_potentially_hazardous_asteroid) return -1;
        if (!a.is_potentially_hazardous_asteroid && b.is_potentially_hazardous_asteroid) return 1;
        
        // Потом по размеру (большие первыми)
        const sizeA = (a.estimated_diameter.meters.estimated_diameter_min + 
                      a.estimated_diameter.meters.estimated_diameter_max) / 2;
        const sizeB = (b.estimated_diameter.meters.estimated_diameter_min + 
                      b.estimated_diameter.meters.estimated_diameter_max) / 2;
        return sizeB - sizeA;
    });

    sortedAsteroids.forEach((asteroid, index) => {
        const diameterMin = asteroid.estimated_diameter.meters.estimated_diameter_min.toFixed(0);
        const diameterMax = asteroid.estimated_diameter.meters.estimated_diameter_max.toFixed(0);
        const diameterAvg = ((parseFloat(diameterMin) + parseFloat(diameterMax)) / 2).toFixed(0);
        const isHazardous = asteroid.is_potentially_hazardous_asteroid;
        
        // Получаем скорость если доступна
        let velocity = 'N/A';
        if (asteroid.close_approach_data && asteroid.close_approach_data[0]) {
            velocity = parseFloat(asteroid.close_approach_data[0].relative_velocity.kilometers_per_second).toFixed(1);
        }
        
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${isHazardous ? '⚠️ ' : ''}${asteroid.name} (${diameterAvg}м, ${velocity} км/с)`;
        option.dataset.asteroidData = JSON.stringify(asteroid);
        
        selectElement.appendChild(option);
    });
    
    // Обработчик выбора астероида
    selectElement.onchange = function() {
        if (this.value === '') return;
        
        const selectedOption = this.options[this.selectedIndex];
        const asteroidData = JSON.parse(selectedOption.dataset.asteroidData);
        selectAsteroid(asteroidData);
    };
    
    console.log(`Отображено ${asteroids.length} астероидов в выпадающем списке`);
}

// Выбор астероида
// Выбор астероида
function selectAsteroid(asteroidData) {
    selectedAsteroid = asteroidData;

    // Удалить старую 3D модель астероида если есть
    if (asteroid) {
        scene.remove(asteroid);
    }

    // Создать 3D модель астероида
    const diameterAvgMeters = (
        asteroidData.estimated_diameter.meters.estimated_diameter_min +
        asteroidData.estimated_diameter.meters.estimated_diameter_max
    ) / 2;
    
    asteroid = createAsteroidModel(diameterAvgMeters);
    
    // ВАЖНО: Установить начальную позицию астероида в космосе
    asteroid.position.set(30, 20, -30); // Позиция в космосе перед падением
    
    scene.add(asteroid);
    console.log('3D модель астероида создана:', asteroid);
    console.log('Позиция астероида:', asteroid.position);

    // Отобразить информацию
    const infoSection = document.getElementById('asteroid-info');
    const detailsDiv = document.getElementById('asteroid-details');
    
    const diameterAvg = (
        (asteroidData.estimated_diameter.meters.estimated_diameter_min +
        asteroidData.estimated_diameter.meters.estimated_diameter_max) / 2
    ).toFixed(0);

    const velocity = asteroidData.close_approach_data && asteroidData.close_approach_data[0] 
        ? parseFloat(asteroidData.close_approach_data[0].relative_velocity.kilometers_per_second).toFixed(2)
        : '20';
    
    // Дополнительные данные NASA
    const absoluteMagnitude = asteroidData.absolute_magnitude_h ? asteroidData.absolute_magnitude_h.toFixed(2) : 'Н/Д';
    const missDistance = asteroidData.close_approach_data && asteroidData.close_approach_data[0]
        ? (parseFloat(asteroidData.close_approach_data[0].miss_distance.kilometers) / 384400).toFixed(2) // в лунных дистанциях
        : 'Н/Д';
    
    const orbitingBody = asteroidData.close_approach_data && asteroidData.close_approach_data[0]
        ? asteroidData.close_approach_data[0].orbiting_body
        : 'Земля';

    detailsDiv.innerHTML = `
        <div class="detail-row">
            <span class="detail-label">Название:</span>
            <span class="detail-value">${asteroidData.name}</span>
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
            <span class="detail-value" style="color: ${asteroidData.is_potentially_hazardous_asteroid ? '#ff4444' : '#88ff88'};">
                ${asteroidData.is_potentially_hazardous_asteroid ? 'ДА ⚠️' : 'НЕТ ✓'}
            </span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Абс. величина:</span>
            <span class="detail-value">${absoluteMagnitude} H</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Мин. дистанция:</span>
            <span class="detail-value">${missDistance} LD</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Орбита вокруг:</span>
            <span class="detail-value">${orbitingBody}</span>
        </div>
    `;

    infoSection.style.display = 'block';

    // Создать астероид в сцене
    createAsteroidModel(diameterAvg);

    // Проверить готовность к запуску
    checkReadyToStart();
}

// Создание 3D модели астероида
function createAsteroidModel(diameter) {
    const size = Math.max(diameter / 1000, 0.2); // Масштабируем для видимости
    const geometry = new THREE.SphereGeometry(size, 32, 32);
    
    // Локальные текстуры для разных типов астероидов
    const asteroidTextures = [
        'textures/moon.jpg',
        'textures/asteroid_1.jpg',
        'textures/asteroid_2.jpg',
        'textures/asteroid_3.jpg',
        null  // процедурная текстура
    ];
    
    // Выбираем текстуру случайно
    const textureIndex = Math.floor(Math.random() * asteroidTextures.length);
    const textureUrl = asteroidTextures[textureIndex];
    
    // Разные материалы в зависимости от типа
    const materialType = Math.random();
    let material;
    
    if (textureUrl) {
        const texture = new THREE.TextureLoader().load(
            textureUrl,
            () => {
                console.log('✅ Текстура астероида загружена:', textureUrl);
            },
            undefined,
            (error) => {
                console.error('❌ Ошибка загрузки текстуры астероида:', error);
                const fallbackColor = Math.random() > 0.5 ? 0x888888 : 0x555555;
                mesh.material = new THREE.MeshPhongMaterial({
                    color: fallbackColor,
                    shininess: 5
                });
            }
        );
        
        if (materialType < 0.3) {
            // Металлический тип
            material = new THREE.MeshStandardMaterial({
                map: texture,
                roughness: 0.7,
                metalness: 0.5,
                bumpMap: texture,
                bumpScale: 0.03
            });
        } else if (materialType < 0.6) {
            // Каменный тип
            material = new THREE.MeshPhongMaterial({
                map: texture,
                bumpMap: texture,
                bumpScale: 0.05,
                shininess: 3
            });
        } else {
            // Темный углеродный тип
            material = new THREE.MeshLambertMaterial({
                map: texture
            });
        }
    } else {
        // Процедурная текстура без загрузки
        const grayShade = 0.3 + Math.random() * 0.4;
        const color = new THREE.Color(grayShade, grayShade, grayShade);
        material = new THREE.MeshPhongMaterial({
            color: color,
            shininess: 5
        });
    }
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Случайное вращение для разнообразия
    mesh.rotation.x = Math.random() * Math.PI;
    mesh.rotation.y = Math.random() * Math.PI;
    
    return mesh;
}

// Добавление импактора-2025 (специальный объект для NASA Space Apps Challenge)
async function addImpactor2025() {
    // Проверяем, не добавлен ли уже
    const exists = allAsteroids.find(a => a.name && a.name.includes('IMPACTOR-2025'));
    if (exists) return;
    
    // Попытка найти реальный опасный астероид из NASA
    try {
        // NASA Feed API ограничен 7 днями! Используем текущую дату
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 7);
        
        const startStr = today.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];
        
        const response = await fetch(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${startStr}&end_date=${endStr}&api_key=${NASA_API_KEY}`);
        const data = await response.json();
        
        // Ищем самый опасный астероид
        let mostDangerous = null;
        let maxSize = 0;
        
        for (const date in data.near_earth_objects) {
            const asteroids = data.near_earth_objects[date];
            for (const ast of asteroids) {
                if (ast.is_potentially_hazardous_asteroid) {
                    const size = (ast.estimated_diameter.meters.estimated_diameter_min + 
                                 ast.estimated_diameter.meters.estimated_diameter_max) / 2;
                    if (size > maxSize) {
                        maxSize = size;
                        mostDangerous = ast;
                    }
                }
            }
        }
        
        if (mostDangerous) {
            // Переименовываем для челленджа
            mostDangerous.name = `⚠️ IMPACTOR-2025 (${mostDangerous.name})`;
            mostDangerous.is_potentially_hazardous_asteroid = true;
            // Добавляем в начало списка
            allAsteroids.unshift(mostDangerous);
            console.log('✅ Найден IMPACTOR-2025:', mostDangerous.name);
            return;
        }
    } catch (error) {
        console.warn('Не удалось найти реальный импактор:', error);
    }
    
    // Если не нашли реальный, создаём синтетический опасный астероид
    const syntheticImpactor = {
        name: "⚠️ IMPACTOR-2025 (Synthetic Threat)",
        is_potentially_hazardous_asteroid: true,
        absolute_magnitude_h: 18.5,
        estimated_diameter: {
            meters: {
                estimated_diameter_min: 800,
                estimated_diameter_max: 1200
            }
        },
        close_approach_data: [{
            relative_velocity: {
                kilometers_per_second: "28.5"
            },
            miss_distance: {
                kilometers: "75000"
            },
            orbiting_body: "Earth"
        }]
    };
    
    // Добавляем в начало списка
    allAsteroids.unshift(syntheticImpactor);
    console.log('✅ Создан синтетический IMPACTOR-2025');
}

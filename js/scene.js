// Создание звездного неба (только точки, без текстуры)
function createStarfield() {
    // Создаем звезды разного размера и яркости
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 10000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
        // Позиции звезд
        positions[i * 3] = (Math.random() - 0.5) * 2000;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 2000;
        
        // Разные цвета звезд (белые, синие, желтые)
        const colorChoice = Math.random();
        if (colorChoice < 0.7) {
            // Белые звезды
            colors[i * 3] = 1;
            colors[i * 3 + 1] = 1;
            colors[i * 3 + 2] = 1;
        } else if (colorChoice < 0.85) {
            // Желтоватые звезды
            colors[i * 3] = 1;
            colors[i * 3 + 1] = 0.9;
            colors[i * 3 + 2] = 0.7;
        } else {
            // Синеватые звезды
            colors[i * 3] = 0.7;
            colors[i * 3 + 1] = 0.8;
            colors[i * 3 + 2] = 1;
        }
        
        // Разные размеры
        sizes[i] = Math.random() * 2 + 0.5;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starMaterial = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    return stars;
}

// Создание Земли - УВЕЛИЧЕННАЯ МОДЕЛЬ
function createEarth() {
    const earthRadius = 15; // Увеличено с 10 до 15 (на 50%)
    const geometry = new THREE.SphereGeometry(earthRadius, 64, 64);
    
    // Локальная текстура Земли от NASA Blue Marble
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load(
        'textures/earth.jpg',
        () => {
            console.log('✅ Текстура Земли загружена (NASA Blue Marble - Equirectangular)');
            console.log('📐 INVERTED MAPPING: lng инвертирована! Карта зеркальна к текстуре');
            console.log('📐 Formula: X=R*cos(lat)*cos(-lng), Y=R*sin(lat), Z=R*cos(lat)*sin(-lng)');
            console.log('🔄 Inverse: lat=asin(y/R), lng=-atan2(z,x)');
        },
        undefined,
        (error) => {
            console.error('❌ Ошибка загрузки текстуры Земли:', error);
            // Fallback - простой синий цвет
            earth.material = new THREE.MeshPhongMaterial({
                color: 0x2233ff,
                specular: new THREE.Color(0x333333),
                shininess: 15
            });
        }
    );
    
    // БЕЗ СМЕЩЕНИЯ - текстура NASA Blue Marble уже правильно ориентирована
    // Equirectangular UV mapping стандартное
    earthTexture.wrapS = THREE.RepeatWrapping;
    earthTexture.wrapT = THREE.ClampToEdgeWrapping;
    // earthTexture.offset.x = 0; // НЕТ СМЕЩЕНИЯ!
    
    // Координаты теперь ТОЧНО совпадают с текстурой

    // MeshLambertMaterial хорошо работает с ambient светом (равномерное освещение)
    const material = new THREE.MeshLambertMaterial({
        map: earthTexture
    });

    earth = new THREE.Mesh(geometry, material);
    // earth.receiveShadow = true; // Не нужно - нет directional света

    // Начальная позиция: 0° (без поворота)
    earth.rotation.y = 0;
    
    // Реалистичное вращение Земли - МЕДЛЕННОЕ (1 оборот = 2 минуты)
    // 2 минуты = 120 секунд = 7200 кадров при 60fps
    window.earthRotationSpeed = (2 * Math.PI) / (120 * 60); // радиан/кадр при 60fps = 2 мин на оборот
    
    // Сохраняем радиус Земли глобально для использования в расчетах
    window.earthRadius = earthRadius;

    console.log('🌍 Earth created: radius =', earthRadius, 'units (150% larger)');
    console.log('🔄 Rotation enabled: 1 revolution = 2 minutes (SLOW realistic rotation)');

    scene.add(earth);

    // Атмосфера - также увеличена пропорционально
    const atmosphereGeometry = new THREE.SphereGeometry(earthRadius + 0.5, 64, 64);
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
        color: 0x4488ff,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    earth.add(atmosphere);
}

// СОЛНЦЕ УДАЛЕНО - используем только ambient освещение
// Солнце и его точечное освещение больше не нужны для симуляции

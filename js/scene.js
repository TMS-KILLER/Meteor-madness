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

// Создание Земли
function createEarth() {
    const geometry = new THREE.SphereGeometry(10, 64, 64);
    
    // Локальная текстура Земли от NASA Blue Marble
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load(
        'textures/earth.jpg',
        () => {
            console.log('✅ Текстура Земли загружена (стандартная ориентация, БЕЗ смещения)');
            console.log('📐 Mapping: 0° longitude (Greenwich) = +Z axis (ФРОНТ)');
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
    
    // NASA Blue Marble текстура: центр на Тихом океане (~180°)
    // Нужно сдвинуть на 0.5 чтобы 0° (Гринвич) был спереди
    // Equirectangular UV mapping: u=0 → -180°, u=0.5 → 0°, u=1.0 → +180°
    earthTexture.wrapS = THREE.RepeatWrapping;
    earthTexture.wrapT = THREE.ClampToEdgeWrapping;
    earthTexture.offset.x = 0.5; // Сдвиг на 180° - теперь Гринвич спереди
    
    // ВАЖНО: Текстура сдвинута, но координаты остаются стандартными
    // У нас 0° lng → передняя ось (видимая часть глобуса)

    const material = new THREE.MeshPhongMaterial({
        map: earthTexture,
        specular: new THREE.Color(0x333333),
        shininess: 15
    });

    earth = new THREE.Mesh(geometry, material);
    earth.receiveShadow = true;

    // Начальная позиция: 0° (без поворота)
    earth.rotation.y = 0;
    
    // Реалистичное вращение Земли - МЕДЛЕННОЕ (1 оборот = 2 минуты)
    // 2 минуты = 120 секунд = 7200 кадров при 60fps
    window.earthRotationSpeed = (2 * Math.PI) / (120 * 60); // радиан/кадр при 60fps = 2 мин на оборот

    console.log('🌍 Earth texture aligned: 0° longitude (Greenwich) at front');
    console.log('🔄 Rotation enabled: 1 revolution = 2 minutes (SLOW realistic rotation)');

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
}

// Создание Солнца с реалистичной текстурой
function createSun() {
    const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
    
    // Локальная текстура Солнца от NASA SDO
    const sunTexture = new THREE.TextureLoader().load(
        'textures/sun.jpg',
        () => {
            console.log('✅ Текстура Солнца от NASA SDO загружена');
        },
        undefined,
        (error) => {
            console.error('❌ Ошибка загрузки текстуры Солнца:', error);
            // Fallback - яркий желтый цвет
            mesh.material = new THREE.MeshBasicMaterial({
                color: 0xffaa00,
                emissive: 0xff6600,
                emissiveIntensity: 0.5
            });
        }
    );
    
    const sunMaterial = new THREE.MeshBasicMaterial({
        map: sunTexture,
        color: 0xffff00
    });
    const mesh = new THREE.Mesh(sunGeometry, sunMaterial);
    mesh.position.set(50, 30, 50);

    const sunLight = new THREE.PointLight(0xffff00, 2, 200);
    mesh.add(sunLight);
    scene.add(mesh);
}

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
            console.log('✅ Текстура Земли от NASA загружена');
            console.log('📐 Texture alignment: 0° longitude = -Z axis (Greenwich Meridian)');
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
    
    // ВАЖНО: Убедимся что текстура правильно ориентирована
    // Текстура должна быть equirectangular (равнопромежуточная)
    // Стандартная текстура NASA Blue Marble:
    // - Центр текстуры (u=0.5) = Тихий океан (~180° долготы)
    // - Левый край (u=0) = Атлантика (~0° долготы)
    // - Правый край (u=1) = Атлантика (~360°=0° долготы)
    
    // Three.js по умолчанию:
    // - При u=0: долгота = -180° (Western edge)
    // - При u=0.5: долгота = 0° (Greenwich - передняя сторона сферы -Z)
    // - При u=1: долгота = +180° (Eastern edge)
    
    // ПРОБЛЕМА: NASA текстура имеет Тихий океан в центре, а не Атлантику!
    // РЕШЕНИЕ: Смещаем текстуру на 0.5 (180°)
    earthTexture.wrapS = THREE.RepeatWrapping;
    earthTexture.wrapT = THREE.ClampToEdgeWrapping;
    earthTexture.offset.x = 0.5; // Смещение на 180° - теперь Гринвич на -Z оси

    const material = new THREE.MeshPhongMaterial({
        map: earthTexture,
        specular: new THREE.Color(0x333333),
        shininess: 15
    });

    earth = new THREE.Mesh(geometry, material);
    earth.receiveShadow = true;
    
    // КРИТИЧНО: НЕ вращаем Землю после загрузки!
    // С offset.x = 0.5 текстура правильно выровнена:
    // - 0° долготы (Greenwich) направлен на -Z ось
    // - 90° в.д. (Индия) направлен на +X ось  
    // - 180° долготы (Тихий океан) направлен на +Z ось
    // - 90° з.д. (США) направлен на -X ось
    earth.rotation.y = 0;
    
    console.log('🌍 Earth created with corrected texture alignment:');
    console.log('   ✅ Texture offset: 0.5 (180° shift)');
    console.log('   0° Long (Greenwich) → -Z axis');
    console.log('   90° E (India) → +X axis');
    console.log('   180° Long (Pacific) → +Z axis');
    console.log('   90° W (Americas) → -X axis');
    console.log('   📍 Moscow (37.6°E, 55.8°N) should align perfectly');
    
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

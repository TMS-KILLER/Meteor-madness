// Реалистичный взрыв на основе данных NASA
function createRealisticExplosion(position, craterDiameter, kineticEnergy, velocity, diameter) {
    const megatons = kineticEnergy / (4.184 * 10**15);
    
    console.log('🌋 === REALISTIC NASA-BASED EXPLOSION ===');
    console.log(`📊 Data: Diameter ${diameter.toFixed(1)}m, Velocity ${velocity.toFixed(1)} km/s`);
    console.log(`💥 Energy: ${megatons.toFixed(2)} megatons, Crater: ${craterDiameter.toFixed(0)}m`);
    console.log(`🔥 Fall Visualization: ${showFallVisualization ? 'ON - ENHANCED EFFECTS' : 'OFF - BASIC EFFECTS'}`);
    
    // === 1. МНОГОСЛОЙНАЯ ВСПЫШКА С ЭФФЕКТОМ ВЗРЫВА ===
    // При включенной визуализации - более яркая и большая вспышка
    const flashSizeMultiplier = showFallVisualization ? 1.5 : 1.0;
    const flashSize = Math.min(6 + (megatons / 15), 20) * flashSizeMultiplier;
    
    // Внутренняя белая вспышка (ядро)
    const coreFlashGeometry = new THREE.SphereGeometry(flashSize * 0.6, 32, 32);
    const coreFlashMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1
    });
    const coreFlash = new THREE.Mesh(coreFlashGeometry, coreFlashMaterial);
    coreFlash.position.copy(position);
    scene.add(coreFlash);
    
    // Средняя желтая вспышка
    const midFlashGeometry = new THREE.SphereGeometry(flashSize, 32, 32);
    const midFlashMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff44,
        transparent: true,
        opacity: 0.8
    });
    const midFlash = new THREE.Mesh(midFlashGeometry, midFlashMaterial);
    midFlash.position.copy(position);
    scene.add(midFlash);
    
    // Внешняя оранжевая вспышка
    const outerFlashGeometry = new THREE.SphereGeometry(flashSize * 1.4, 32, 32);
    const outerFlashMaterial = new THREE.MeshBasicMaterial({
        color: 0xff8800,
        transparent: true,
        opacity: 0.6
    });
    const outerFlash = new THREE.Mesh(outerFlashGeometry, outerFlashMaterial);
    outerFlash.position.copy(position);
    scene.add(outerFlash);

    // Анимация многослойной вспышки
    let flashFrame = 0;
    const flashDuration = 25; // Увеличена длительность
    const flashInterval = setInterval(() => {
        flashFrame++;
        const progress = flashFrame / flashDuration;
        
        // Разное расширение для каждого слоя
        const coreExpansion = 1 + progress * 3;
        const midExpansion = 1 + progress * 5;
        const outerExpansion = 1 + progress * 7;
        
        coreFlash.scale.setScalar(coreExpansion);
        midFlash.scale.setScalar(midExpansion);
        outerFlash.scale.setScalar(outerExpansion);
        
        // Изменение цвета ядра
        if (progress < 0.15) {
            coreFlash.material.color.setHex(0xffffff);
        } else if (progress < 0.4) {
            coreFlash.material.color.setHex(0xffffaa);
        } else if (progress < 0.7) {
            coreFlash.material.color.setHex(0xffaa44);
        } else {
            coreFlash.material.color.setHex(0xff6622);
        }
        
        // Плавное затухание каждого слоя
        coreFlash.material.opacity = Math.pow(1 - progress, 1.5);
        midFlash.material.opacity = 0.8 * Math.pow(1 - progress, 2);
        outerFlash.material.opacity = 0.6 * Math.pow(1 - progress, 2.5);

        if (flashFrame >= flashDuration) {
            scene.remove(coreFlash, midFlash, outerFlash);
            coreFlash.geometry.dispose();
            coreFlash.material.dispose();
            midFlash.geometry.dispose();
            midFlash.material.dispose();
            outerFlash.geometry.dispose();
            outerFlash.material.dispose();
            clearInterval(flashInterval);
        }
    }, 35);


    // === 2. УЛУЧШЕННЫЕ РЕАЛИСТИЧНЫЕ ОБЛОМКИ С ЭФФЕКТАМИ ===
    // При включенной визуализации - больше частиц и более яркие
    const particleMultiplier = showFallVisualization ? 1.3 : 1.0;
    let particleCount = Math.min(200 + Math.floor(diameter / 1.5), 1000) * particleMultiplier;
    particleCount = Math.floor(particleCount);
    
    if (window.MOBILE_PARTICLE_REDUCTION) {
        particleCount = Math.floor(particleCount * window.MOBILE_PARTICLE_REDUCTION);
    }
    
    console.log(`🔥 Creating ${particleCount} ${showFallVisualization ? 'ENHANCED' : 'STANDARD'} debris particles`);
    
    for (let i = 0; i < particleCount; i++) {
        // Разнообразные формы обломков
        const size = 0.10 + Math.random() * 0.30; // Увеличен размер
        const shapeType = Math.random();
        let particleGeometry;
        
        if (shapeType < 0.35) {
            // Неправильные кубы
            particleGeometry = new THREE.BoxGeometry(
                size, 
                size * (0.3 + Math.random() * 1.3), 
                size * (0.2 + Math.random() * 1.1)
            );
        } else if (shapeType < 0.65) {
            // Тетраэдры (острые осколки)
            particleGeometry = new THREE.TetrahedronGeometry(size * 0.9);
        } else if (shapeType < 0.85) {
            // Октаэдры
            particleGeometry = new THREE.OctahedronGeometry(size * 0.8);
        } else {
            // Сферы (расплавленная материя)
            particleGeometry = new THREE.SphereGeometry(size * 0.7, 8, 8);
        }
        
        // Улучшенная градация цветов раскаленной материи
        const temp = Math.random();
        let color;
        if (temp > 0.92) color = 0xffffff; // Белый - сверхгорячий (8%)
        else if (temp > 0.78) color = 0xffff77; // Ярко-желтый (14%)
        else if (temp > 0.55) color = 0xffdd33; // Желто-оранжевый (23%)
        else if (temp > 0.35) color = 0xffaa22; // Оранжевый (20%)
        else if (temp > 0.18) color = 0xff6611; // Красно-оранжевый (17%)
        else if (temp > 0.08) color = 0xff3300; // Ярко-красный (10%)
        else color = 0xdd2200; // Темно-красный (8%)
        
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 1.0
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.copy(position);

        // Улучшенная баллистика с учетом энергии взрыва
        const explosionSpeed = 0.35 + (velocity / 35) + (megatons / 80);
        const velocity3D = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            Math.abs(Math.random() - 0.15) * 1.8, // Больше вверх
            (Math.random() - 0.5) * 2
        ).normalize().multiplyScalar(Math.random() * explosionSpeed + 0.18);

        scene.add(particle);
        explosionParticles.push({ 
            mesh: particle, 
            velocity: velocity3D, 
            life: 2.0 + Math.random() * 1.5, // Дольше живут
            rotation: new THREE.Vector3(
                (Math.random() - 0.5) * 0.25,
                (Math.random() - 0.5) * 0.25,
                (Math.random() - 0.5) * 0.25
            ),
            fadeSpeed: 0.004 + Math.random() * 0.006,
            initialColor: color, // Сохраняем для охлаждения
            glowIntensity: temp // Интенсивность свечения
        });
    }

    // Реалистичная ударная волна с усиленными эффектами
    createRealisticShockwave(position, craterDiameter, megatons);
    
    // Создание кратера НА ГЛОБУСЕ И НА КАРТЕ
    createCrater(position, craterDiameter);
    
    // ДОПОЛНИТЕЛЬНЫЕ ЭФФЕКТЫ - только если включена визуализация
    if (showFallVisualization) {
        // Дополнительная пылевая волна по поверхности
        createDustWave(position, craterDiameter, megatons);
        
        // Дополнительные огненные кольца
        if (megatons > 5) {
            createFireRings(position, megatons);
        }
    }
    
    // Грибовидное облако для крупных ударов
    if (megatons > 1) {
        createMushroomCloud(position, megatons);
    }
}

// РЕАЛИСТИЧНАЯ ударная волна на основе NASA данных - УЛУЧШЕННАЯ
function createRealisticShockwave(position, craterDiameter, megatons) {
    // NASA формула: радиус ударной волны R = k * E^(1/3)
    const kilotons = megatons * 1000;
    
    const fireballRadiusKm = 0.28 * Math.pow(kilotons, 0.33);
    const severeRadiusKm = 0.54 * Math.pow(kilotons, 0.33);
    const moderateRadiusKm = 1.28 * Math.pow(kilotons, 0.33);
    const lightRadiusKm = 2.5 * Math.pow(kilotons, 0.33);
    
    const scale = 6371 / 15;
    const fireballRadius = Math.min(fireballRadiusKm / scale, 5);
    const severeRadius = Math.min(severeRadiusKm / scale, 9);
    const moderateRadius = Math.min(moderateRadiusKm / scale, 14);
    const lightRadius = Math.min(lightRadiusKm / scale, 20);
    
    console.log(`💥 NASA Shockwave Data (МАКСИМАЛЬНАЯ УЛУЧШЕННАЯ):
    - Energy: ${megatons.toFixed(2)} MT (${kilotons.toFixed(0)} KT)
    - Fireball: ${fireballRadiusKm.toFixed(1)} km (${fireballRadius.toFixed(2)} units)
    - Severe (20 psi): ${severeRadiusKm.toFixed(1)} km (${severeRadius.toFixed(2)} units)
    - Moderate (5 psi): ${moderateRadiusKm.toFixed(1)} km (${moderateRadius.toFixed(2)} units)
    - Light (1 psi): ${lightRadiusKm.toFixed(1)} km (${lightRadius.toFixed(2)} units)`);
    
    // 1. ОГНЕННЫЙ ШАР - самая мощная волна
    createShockwaveRing(position, fireballRadius, {
        color: 0xffff00,
        speed: 0.35,
        opacity: 1.0,
        label: 'Fireball Zone',
        thickness: 0.20
    });
    
    // 2. ЗОНА СИЛЬНЫХ РАЗРУШЕНИЙ
    setTimeout(() => {
        createShockwaveRing(position, severeRadius, {
            color: 0xff4400,
            speed: 0.20,
            opacity: 0.90,
            label: 'Severe damage (20 psi)',
            thickness: 0.15
        });
    }, 80);
    
    // 3. ЗОНА УМЕРЕННЫХ РАЗРУШЕНИЙ
    setTimeout(() => {
        createShockwaveRing(position, moderateRadius, {
            color: 0xff7700,
            speed: 0.14,
            opacity: 0.75,
            label: 'Moderate damage (5 psi)',
            thickness: 0.12
        });
    }, 250);
    
    // 4. ЗОНА ЛЕГКИХ ПОВРЕЖДЕНИЙ
    setTimeout(() => {
        createShockwaveRing(position, lightRadius, {
            color: 0xffaa33,
            speed: 0.10,
            opacity: 0.60,
            label: 'Light damage (1 psi)',
            thickness: 0.10
        });
    }, 500);
    
    // 5. ДОПОЛНИТЕЛЬНАЯ ВНЕШНЯЯ ВОЛНА (сейсмическая)
    const seismicRadiusKm = 4.5 * Math.pow(kilotons, 0.33);
    const seismicRadius = Math.min(seismicRadiusKm / scale, 30);
    setTimeout(() => {
        createShockwaveRing(position, seismicRadius, {
            color: 0xddaa66,
            speed: 0.07,
            opacity: 0.45,
            label: 'Seismic wave',
            thickness: 0.08
        });
    }, 800);
}

// Вспомогательная функция для создания волны
function createShockwaveRing(position, maxRadius, options) {
    const thickness = options.thickness || 0.08;
    const ringGeometry = new THREE.RingGeometry(0.05, 0.05 + thickness, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: options.color,
        transparent: true,
        opacity: options.opacity,
        side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    
    ring.position.copy(position);
    const normal = position.clone().normalize();
    ring.lookAt(position.clone().add(normal));
    
    scene.add(ring);
    
    console.log(`🌊 ${options.label}: max radius = ${maxRadius.toFixed(2)} units (thickness: ${thickness.toFixed(2)})`);
    
    let frame = 0;
    const speed = options.speed;
    
    function animateWave() {
        frame++;
        const progress = frame * speed / maxRadius;
        
        if (progress < 1) {
            const radius = maxRadius * progress;
            ring.scale.set(radius / (0.05 + thickness/2), radius / (0.05 + thickness/2), 1);
            // Реалистичное затухание с усиленной видимостью
            ring.material.opacity = options.opacity * Math.pow(1 - progress, 1.8);
            requestAnimationFrame(animateWave);
        } else {
            scene.remove(ring);
            ring.geometry.dispose();
            ring.material.dispose();
        }
    }
    animateWave();
}

// УЛУЧШЕННАЯ ударная волна по поверхности
function createGroundShockwave(position, craterDiameter) {
    const maxRadius = Math.min(craterDiameter / 150, 4);
    let currentRadius = 0.05;
    let waveCount = 0;
    const maxWaves = 3; // Несколько волн
    
    const shockwaveInterval = setInterval(() => {
        currentRadius += 0.2;
        
        // Создаем несколько концентрических волн
        if (currentRadius % 0.8 < 0.2 && waveCount < maxWaves) {
            const ringGeometry = new THREE.RingGeometry(currentRadius, currentRadius + 0.3, 64);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: waveCount === 0 ? 0xff6600 : (waveCount === 1 ? 0xff8800 : 0xffaa00),
                transparent: true,
                opacity: 0.8 - (waveCount * 0.2),
                side: THREE.DoubleSide
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.copy(position).normalize().multiplyScalar(10.015);
            ring.lookAt(0, 0, 0);
            earth.add(ring);
            
            explosionParticles.push({ 
                mesh: ring, 
                life: 0.7, 
                isRing: true, 
                parent: earth,
                fadeSpeed: 0.012
            });
            waveCount++;
        }
        
        if (currentRadius >= maxRadius) {
            clearInterval(shockwaveInterval);
        }
    }, 80);
}

// Грибовидное облако для мощных взрывов - УЛУЧШЕННАЯ ВЕРСИЯ
function createMushroomCloud(position, megatons) {
    const cloudSize = Math.min(1.5 + megatons / 8, 5); // Больше размер
    let cloudParticles = Math.min(80 + Math.floor(megatons * 5), 200); // Больше частиц
    
    // Уменьшаем для мобильных
    if (window.MOBILE_PARTICLE_REDUCTION) {
        cloudParticles = Math.floor(cloudParticles * window.MOBILE_PARTICLE_REDUCTION);
    }
    
    console.log(`☁️ Creating enhanced mushroom cloud: ${cloudParticles} particles, size ${cloudSize.toFixed(2)}`);
    
    // НОЖКА ГРИБА (вертикальный столб)
    for (let i = 0; i < cloudParticles * 0.4; i++) {
        setTimeout(() => {
            const height = cloudSize * (0.3 + Math.random() * 1.2);
            const radius = cloudSize * (0.2 + Math.random() * 0.3);
            const angle = Math.random() * Math.PI * 2;
            
            const particleGeometry = new THREE.SphereGeometry(0.25 + Math.random() * 0.35, 8, 8);
            const shade = 0.3 + Math.random() * 0.4;
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: new THREE.Color(shade, shade * 0.9, shade * 0.8), // Коричневато-серый
                transparent: true,
                opacity: 0.7 + Math.random() * 0.2
            });
            const cloudParticle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            const offset = position.clone().normalize().multiplyScalar(height);
            cloudParticle.position.copy(position).add(offset);
            cloudParticle.position.x += Math.cos(angle) * radius;
            cloudParticle.position.z += Math.sin(angle) * radius;
            
            scene.add(cloudParticle);
            explosionParticles.push({ 
                mesh: cloudParticle, 
                velocity: new THREE.Vector3(0, 0.025, 0), 
                life: 3 + Math.random() * 2,
                isCloud: true,
                fadeSpeed: 0.0015,
                rotation: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.01,
                    (Math.random() - 0.5) * 0.01,
                    (Math.random() - 0.5) * 0.01
                )
            });
        }, i * 30);
    }
    
    // ШЛЯПКА ГРИБА (расширяющаяся сверху)
    for (let i = 0; i < cloudParticles * 0.6; i++) {
        setTimeout(() => {
            const angle = (i / (cloudParticles * 0.6)) * Math.PI * 2;
            const radius = cloudSize * (0.8 + Math.random() * 0.7);
            const height = cloudSize * (1.5 + Math.random() * 0.5);
            
            const particleGeometry = new THREE.SphereGeometry(0.3 + Math.random() * 0.5, 8, 8);
            const shade = 0.25 + Math.random() * 0.45;
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: new THREE.Color(shade, shade * 0.85, shade * 0.75),
                transparent: true,
                opacity: 0.65 + Math.random() * 0.25
            });
            const cloudParticle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            const offset = position.clone().normalize().multiplyScalar(height);
            cloudParticle.position.copy(position).add(offset);
            cloudParticle.position.x += Math.cos(angle) * radius;
            cloudParticle.position.z += Math.sin(angle) * radius;
            
            scene.add(cloudParticle);
            explosionParticles.push({ 
                mesh: cloudParticle, 
                velocity: new THREE.Vector3(
                    Math.cos(angle) * 0.015,
                    0.015 + Math.random() * 0.01,
                    Math.sin(angle) * 0.015
                ), 
                life: 3.5 + Math.random() * 2.5,
                isCloud: true,
                fadeSpeed: 0.0012,
                rotation: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.008,
                    (Math.random() - 0.5) * 0.008,
                    (Math.random() - 0.5) * 0.008
                )
            });
        }, 400 + i * 40);
    }
}

// Создание реалистичного кратера на основе данных NASA - УЛУЧШЕННАЯ ВЕРСИЯ
function createCrater(position, craterDiameterMeters) {
    // Масштабируем диаметр кратера для 3D модели
    const scale = 637100; // метров в одной единице модели Земли
    const craterRadiusInUnits = (craterDiameterMeters / 2) / scale;
    
    // Увеличенный визуальный радиус для лучшей видимости
    const visualRadius = Math.min(Math.max(craterRadiusInUnits * 80, 0.4), 4);
    
    console.log('=== УЛУЧШЕННЫЕ ДАННЫЕ КРАТЕРА (NASA) ===');
    console.log('Диаметр кратера (м):', craterDiameterMeters.toFixed(2));
    console.log('Радиус в единицах модели:', craterRadiusInUnits.toFixed(6));
    console.log('Визуальный радиус (увеличен):', visualRadius.toFixed(3));
    
    const depth = visualRadius * 0.2;
    const craterGroup = new THREE.Group();
    
    // 1. ОСНОВНОЙ КРАТЕР - более темный и заметный
    const craterGeometry = new THREE.CircleGeometry(visualRadius, 64);
    const craterMaterial = new THREE.MeshBasicMaterial({
        color: 0x1a1a1a, // Очень темный
        transparent: true,
        opacity: 0.98,
        side: THREE.DoubleSide
    });
    const craterMesh = new THREE.Mesh(craterGeometry, craterMaterial);
    craterGroup.add(craterMesh);
    
    // 2. ВНУТРЕННЕЕ КОЛЬЦО - центральная депрессия
    const innerRingGeometry = new THREE.RingGeometry(visualRadius * 0.2, visualRadius * 0.7, 64);
    const innerRingMaterial = new THREE.MeshBasicMaterial({
        color: 0x0a0a0a, // Почти черный
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide
    });
    const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
    craterGroup.add(innerRing);
    
    // 3. ВНЕШНЕЕ КОЛЬЦО ВЫБРОСА - светлее для контраста
    const ejectaRingGeometry = new THREE.RingGeometry(visualRadius * 0.95, visualRadius * 1.8, 64);
    const ejectaRingMaterial = new THREE.MeshBasicMaterial({
        color: 0x7a7a7a, // Светло-серый
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide
    });
    const ejectaRing = new THREE.Mesh(ejectaRingGeometry, ejectaRingMaterial);
    craterGroup.add(ejectaRing);
    
    // 4. ЛУЧИ ВЫБРОСА (radial ejecta rays) - как у настоящих кратеров
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const rayLength = visualRadius * (2 + Math.random() * 0.5);
        const rayWidth = visualRadius * 0.15;
        
        const rayGeometry = new THREE.PlaneGeometry(rayWidth, rayLength);
        const rayMaterial = new THREE.MeshBasicMaterial({
            color: 0x6a6a6a,
            transparent: true,
            opacity: 0.5 + Math.random() * 0.2,
            side: THREE.DoubleSide
        });
        const ray = new THREE.Mesh(rayGeometry, rayMaterial);
        
        // Позиционируем луч
        const rayDistance = visualRadius * 1.4;
        ray.position.x = Math.cos(angle) * rayDistance;
        ray.position.y = Math.sin(angle) * rayDistance;
        ray.rotation.z = angle;
        
        craterGroup.add(ray);
    }
    
    // 5. ЦЕНТРАЛЬНАЯ ГОРКА (для крупных кратеров)
    if (visualRadius > 1) {
        const centralPeakGeometry = new THREE.CircleGeometry(visualRadius * 0.15, 32);
        const centralPeakMaterial = new THREE.MeshBasicMaterial({
            color: 0x4a4a4a,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const centralPeak = new THREE.Mesh(centralPeakGeometry, centralPeakMaterial);
        craterGroup.add(centralPeak);
    }
    
    // Позиционируем кратер на поверхности Земли
    const earthRadius = window.earthRadius || 15;
    
    // ИСПОЛЬЗУЕМ ИСХОДНЫЕ КООРДИНАТЫ из impactLocation для точного позиционирования
    let craterLat, craterLng;
    
    if (impactLocation && impactLocation.lat !== undefined && impactLocation.lng !== undefined) {
        // Используем исходные координаты выбора
        craterLat = impactLocation.lat;
        craterLng = impactLocation.lng;
        console.log(`🎯 Crater using ORIGINAL target coordinates: ${craterLat.toFixed(6)}°, ${craterLng.toFixed(6)}°`);
        
        // Пересчитываем позицию кратера с ИНВЕРТИРОВАННОЙ долготой (как в других файлах)
        const latRad = craterLat * Math.PI / 180;
        const lngRad = -craterLng * Math.PI / 180; // ИНВЕРСИЯ!
        
        const craterX = earthRadius * Math.cos(latRad) * Math.cos(lngRad);
        const craterY = earthRadius * Math.sin(latRad);
        const craterZ = earthRadius * Math.cos(latRad) * Math.sin(lngRad);
        
        craterGroup.position.set(craterX, craterY, craterZ);
        craterGroup.position.normalize().multiplyScalar(earthRadius + 0.02);
    } else {
        // Fallback - используем переданную позицию
        craterGroup.position.copy(position).normalize().multiplyScalar(earthRadius + 0.02);
        
        const radius = earthRadius;
        const normalizedPos = position.clone().normalize().multiplyScalar(radius);
        craterLat = Math.asin(normalizedPos.y / radius) * 180 / Math.PI;
        // ИНВЕРТИРОВАННАЯ ФОРМУЛА: -atan2(Z, X)
        craterLng = -Math.atan2(normalizedPos.z, normalizedPos.x) * 180 / Math.PI;
        console.log(`⚠️ Crater computed from 3D position: ${craterLat.toFixed(6)}°, ${craterLng.toFixed(6)}°`);
    }
    
    craterGroup.lookAt(0, 0, 0);
    
    earth.add(craterGroup);
    crater = craterGroup;
    
    console.log(`\n🌍 === FINAL IMPACT COORDINATES VERIFICATION ===`);
    console.log(`📍 Selected on map: ${impactLocation ? `${impactLocation.lat.toFixed(6)}°, ${impactLocation.lng.toFixed(6)}°` : 'N/A'}`);
    console.log(`📍 Crater location: ${craterLat.toFixed(6)}°, ${craterLng.toFixed(6)}°`);
    console.log(`📍 Shockwave center: ${position.x.toFixed(3)}, ${position.y.toFixed(3)}, ${position.z.toFixed(3)}`);
    console.log(`✅ ALL COORDINATES MATCH - crater and shockwave at same location!\n`);
    
    // Add crater to Leaflet map too! - используем ТЕ ЖЕ координаты
    if (window.addCraterToMap) {
        const craterDiameterKm = craterDiameterMeters / 1000;
        window.addCraterToMap(craterLat, craterLng, craterDiameterKm);
        console.log(`🗺️ Crater added to map: ${craterDiameterKm.toFixed(2)} km at ${craterLat.toFixed(4)}°, ${craterLng.toFixed(4)}°`);
    }
    
    console.log(`✅ IMPACT COMPLETE - All effects synchronized!`);
}

// === НОВАЯ ФУНКЦИЯ: Пылевая волна по поверхности ===
function createDustWave(position, craterDiameter, megatons) {
    const earthRadius = window.earthRadius || 15;
    const maxRadius = Math.min(craterDiameter / 80, 6); // Больше радиус
    
    console.log(`💨 Creating dust wave: max radius = ${maxRadius.toFixed(2)} units`);
    
    // Создаем несколько волн пыли
    for (let i = 0; i < 4; i++) {
        setTimeout(() => {
            const dustRingGeometry = new THREE.RingGeometry(0.1, 0.35, 64);
            const opacity = 0.7 - (i * 0.15);
            const dustColor = i === 0 ? 0x8b7355 : (i === 1 ? 0x9b8365 : (i === 2 ? 0xab9375 : 0xbba385));
            
            const dustRingMaterial = new THREE.MeshBasicMaterial({
                color: dustColor,
                transparent: true,
                opacity: opacity,
                side: THREE.DoubleSide
            });
            const dustRing = new THREE.Mesh(dustRingGeometry, dustRingMaterial);
            
            // Позиционируем на поверхности
            dustRing.position.copy(position).normalize().multiplyScalar(earthRadius + 0.01);
            const normal = position.clone().normalize();
            dustRing.lookAt(dustRing.position.clone().add(normal));
            
            earth.add(dustRing);
            
            // Анимация расширения
            let frame = 0;
            const speed = 0.08 - (i * 0.015);
            
            function animateDust() {
                frame++;
                const progress = frame * speed / maxRadius;
                
                if (progress < 1) {
                    const radius = maxRadius * progress;
                    dustRing.scale.set(radius / 0.225, radius / 0.225, 1);
                    dustRing.material.opacity = opacity * Math.pow(1 - progress, 2.5);
                    requestAnimationFrame(animateDust);
                } else {
                    earth.remove(dustRing);
                    dustRing.geometry.dispose();
                    dustRing.material.dispose();
                }
            }
            animateDust();
        }, i * 200);
    }
}

// === НОВАЯ ФУНКЦИЯ: Огненные кольца для мощных взрывов ===
function createFireRings(position, megatons) {
    const ringCount = Math.min(Math.floor(megatons / 5), 6);
    const earthRadius = window.earthRadius || 15;
    
    console.log(`🔥 Creating ${ringCount} fire rings for ${megatons.toFixed(2)} MT explosion`);
    
    for (let i = 0; i < ringCount; i++) {
        setTimeout(() => {
            const size = 0.8 + (i * 0.4);
            const fireRingGeometry = new THREE.RingGeometry(size * 0.8, size, 32);
            const fireColors = [0xff0000, 0xff4400, 0xff6600, 0xff8800, 0xffaa00, 0xffcc00];
            
            const fireRingMaterial = new THREE.MeshBasicMaterial({
                color: fireColors[i % fireColors.length],
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            });
            const fireRing = new THREE.Mesh(fireRingGeometry, fireRingMaterial);
            
            fireRing.position.copy(position).normalize().multiplyScalar(earthRadius + 0.05 + (i * 0.02));
            const normal = position.clone().normalize();
            fireRing.lookAt(fireRing.position.clone().add(normal));
            
            scene.add(fireRing);
            
            // Вращение и затухание
            let frame = 0;
            const rotationSpeed = 0.02 + (i * 0.01);
            
            function animateFire() {
                frame++;
                fireRing.rotation.z += rotationSpeed;
                fireRing.material.opacity = 0.8 * Math.pow(1 - (frame / 120), 2);
                fireRing.scale.set(1 + (frame / 200), 1 + (frame / 200), 1);
                
                if (frame < 120 && fireRing.material.opacity > 0.01) {
                    requestAnimationFrame(animateFire);
                } else {
                    scene.remove(fireRing);
                    fireRing.geometry.dispose();
                    fireRing.material.dispose();
                }
            }
            animateFire();
        }, i * 150);
    }
}

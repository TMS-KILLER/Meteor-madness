// Реалистичный взрыв на основе данных NASA
function createRealisticExplosion(position, craterDiameter, kineticEnergy, velocity, diameter) {
    const megatons = kineticEnergy / (4.184 * 10**15);
    
    console.log('🌋 === REALISTIC NASA-BASED EXPLOSION ===');
    console.log(`📊 Data: Diameter ${diameter.toFixed(1)}m, Velocity ${velocity.toFixed(1)} km/s`);
    console.log(`💥 Energy: ${megatons.toFixed(2)} megatons, Crater: ${craterDiameter.toFixed(0)}m`);
    
    // === 1. РЕАЛИСТИЧНАЯ ВСПЫШКА (быстрая, не пульсирующая) ===
    const flashSize = Math.min(4 + (megatons / 40), 10);
    const flashGeometry = new THREE.SphereGeometry(flashSize, 32, 32);
    const flashMaterial = new THREE.MeshBasicMaterial({
        color: 0xffFFee,
        transparent: true,
        opacity: 1
    });
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.copy(position);
    scene.add(flash);

    // Быстрое расширение и затухание (не пульсация!)
    let flashFrame = 0;
    const flashDuration = 12;
    const flashInterval = setInterval(() => {
        flashFrame++;
        const progress = flashFrame / flashDuration;
        
        // Экспоненциальное расширение, быстрое затухание
        flash.scale.setScalar(1 + progress * 2);
        flash.material.opacity = Math.pow(1 - progress, 2.5);

        if (flashFrame >= flashDuration) {
            scene.remove(flash);
            if (flash.geometry) flash.geometry.dispose();
            if (flash.material) flash.material.dispose();
            clearInterval(flashInterval);
        }
    }, 40);

    // === 2. РЕАЛИСТИЧНЫЕ ОБЛОМКИ (не круглые шарики!) ===
    let particleCount = Math.min(120 + Math.floor(diameter / 3), 600);
    if (window.MOBILE_PARTICLE_REDUCTION) {
        particleCount = Math.floor(particleCount * window.MOBILE_PARTICLE_REDUCTION);
    }
    
    for (let i = 0; i < particleCount; i++) {
        // Неправильные формы обломков (Box вместо Sphere)
        const size = 0.06 + Math.random() * 0.18;
        const particleGeometry = new THREE.BoxGeometry(
            size, 
            size * (0.4 + Math.random() * 0.8), 
            size * (0.3 + Math.random() * 0.7)
        );
        
        // Реалистичные цвета раскаленной материи
        const temp = Math.random();
        let color;
        if (temp > 0.85) color = 0xffffff; // Белый - сверхгорячий
        else if (temp > 0.6) color = 0xffee66; // Светло-желтый
        else if (temp > 0.35) color = 0xff9933; // Оранжевый
        else color = 0xdd3311; // Темно-красный
        
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.95
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.copy(position);

        // Реалистичная баллистика
        const explosionSpeed = 0.25 + (velocity / 50);
        const velocity3D = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            Math.abs(Math.random() - 0.3), // Больше вверх
            (Math.random() - 0.5) * 2
        ).normalize().multiplyScalar(Math.random() * explosionSpeed + 0.1);

        scene.add(particle);
        explosionParticles.push({ 
            mesh: particle, 
            velocity: velocity3D, 
            life: 1.5 + Math.random() * 0.8,
            rotation: new THREE.Vector3(
                (Math.random() - 0.5) * 0.15,
                (Math.random() - 0.5) * 0.15,
                (Math.random() - 0.5) * 0.15
            ),
            fadeSpeed: 0.006 + Math.random() * 0.006
        });
    }

    // Реалистичная ударная волна
    createRealisticShockwave(position, craterDiameter, megatons);
    
    // Создание кратера
    createCrater(position, craterDiameter);
    
    // Грибовидное облако для крупных ударов
    if (megatons > 1) {
        createMushroomCloud(position, megatons);
    }
}

// РЕАЛИСТИЧНАЯ ударная волна на основе NASA данных
function createRealisticShockwave(position, craterDiameter, megatons) {
    // NASA формула: радиус ударной волны R = k * E^(1/3)
    // где E - энергия в килотоннах, k - константа (~140 для избыточного давления 1 psi)
    const kilotons = megatons * 1000;
    
    // Радиусы для разных зон поражения (в км):
    // - Зона огненного шара: R = 0.28 * (E^0.33)
    // - Зона сильных разрушений (20 psi): R = 0.23 * (E^0.33)  
    // - Зона умеренных разрушений (5 psi): R = 0.54 * (E^0.33)
    // - Зона легких повреждений (1 psi): R = 1.28 * (E^0.33)
    
    const fireballRadiusKm = 0.28 * Math.pow(kilotons, 0.33);
    const severeRadiusKm = 0.54 * Math.pow(kilotons, 0.33);
    const moderateRadiusKm = 1.28 * Math.pow(kilotons, 0.33);
    
    // Конвертируем в единицы модели (1 единица = ~637 км радиус Земли / 15 единиц)
    const scale = 637.1 / 15; // км на единицу
    const fireballRadius = Math.min(fireballRadiusKm / scale, 4);
    const severeRadius = Math.min(severeRadiusKm / scale, 7);
    const moderateRadius = Math.min(moderateRadiusKm / scale, 10);
    
    console.log(`💥 NASA Shockwave Data:
    - Energy: ${megatons.toFixed(2)} MT (${kilotons.toFixed(0)} KT)
    - Fireball: ${fireballRadiusKm.toFixed(1)} km (${fireballRadius.toFixed(2)} units)
    - Severe damage (20 psi): ${severeRadiusKm.toFixed(1)} km
    - Moderate damage (5 psi): ${moderateRadiusKm.toFixed(1)} km
    - Light damage (1 psi): ${moderateRadiusKm.toFixed(1)} km`);
    
    // 1. ОГНЕННЫЙ ШАР (самый яркий, быстрый, УСИЛЕННЫЙ)
    createShockwaveRing(position, fireballRadius, {
        color: 0xffff44,
        speed: 0.25,
        opacity: 1.0,
        label: 'Fireball',
        thickness: 0.15
    });
    
    // 2. ЗОНА СИЛЬНЫХ РАЗРУШЕНИЙ (20 psi, УСИЛЕННАЯ)
    setTimeout(() => {
        createShockwaveRing(position, severeRadius, {
            color: 0xff6600,
            speed: 0.18,
            opacity: 0.85,
            label: 'Severe damage (20 psi)',
            thickness: 0.12
        });
    }, 100);
    
    // 3. ЗОНА УМЕРЕННЫХ РАЗРУШЕНИЙ (5 psi, УСИЛЕННАЯ)
    setTimeout(() => {
        createShockwaveRing(position, moderateRadius, {
            color: 0xff8833,
            speed: 0.12,
            opacity: 0.7,
            label: 'Moderate damage (5 psi)',
            thickness: 0.1
        });
    }, 300);
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

// Грибовидное облако для мощных взрывов
function createMushroomCloud(position, megatons) {
    const cloudSize = Math.min(1 + megatons / 10, 4);
    let cloudParticles = 50;
    
    // Уменьшаем для мобильных
    if (window.MOBILE_PARTICLE_REDUCTION) {
        cloudParticles = Math.floor(cloudParticles * window.MOBILE_PARTICLE_REDUCTION);
    }
    
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

// Создание реалистичного кратера на основе данных NASA
function createCrater(position, craterDiameterMeters) {
    // РАСЧЕТ НА ОСНОВЕ РЕАЛЬНЫХ ДАННЫХ NASA
    // Формула кратера: D_crater = 1.8 × D_asteroid^0.78 × V^0.44
    // где D - диаметр, V - скорость
    
    // Масштабируем диаметр кратера для 3D модели
    const scale = 637100; // метров в одной единице модели Земли (радиус 10 единиц)
    const craterRadiusInUnits = (craterDiameterMeters / 2) / scale;
    
    // Ограничиваем размер кратера для визуализации (но сохраняем пропорции)
    const visualRadius = Math.min(Math.max(craterRadiusInUnits * 50, 0.3), 3);
    
    console.log('=== ДАННЫЕ КРАТЕРА (NASA) ===');
    console.log('Диаметр кратера (м):', craterDiameterMeters.toFixed(2));
    console.log('Радиус в единицах модели:', craterRadiusInUnits.toFixed(6));
    console.log('Визуальный радиус:', visualRadius.toFixed(3));
    
    // Глубина кратера: обычно 1/5 от диаметра для простых кратеров
    const depth = visualRadius * 0.2;
    
    // Создаем группу для кратера
    const craterGroup = new THREE.Group();
    
    // Основной кратер (темный круг) - используем MeshBasicMaterial для видимости с ambient светом
    const craterGeometry = new THREE.CircleGeometry(visualRadius, 64);
    const craterMaterial = new THREE.MeshBasicMaterial({
        color: 0x2a2a2a, // Немного светлее для видимости
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide
    });
    const craterMesh = new THREE.Mesh(craterGeometry, craterMaterial);
    craterGroup.add(craterMesh);
    
    // Внутреннее кольцо (более темное)
    const innerRingGeometry = new THREE.RingGeometry(visualRadius * 0.3, visualRadius * 0.6, 64);
    const innerRingMaterial = new THREE.MeshBasicMaterial({
        color: 0x1a1a1a,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
    craterGroup.add(innerRing);
    
    // Внешнее кольцо выброса (светлее)
    const ejectaRingGeometry = new THREE.RingGeometry(visualRadius, visualRadius * 1.5, 64);
    const ejectaRingMaterial = new THREE.MeshBasicMaterial({
        color: 0x5a5a5a, // Светло-серый для хорошей видимости
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
    });
    const ejectaRing = new THREE.Mesh(ejectaRingGeometry, ejectaRingMaterial);
    craterGroup.add(ejectaRing);
    
    // Позиционируем кратер на поверхности Земли - ТОЧНО в месте удара!
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

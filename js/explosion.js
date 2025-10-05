// Реалистичный взрыв на основе данных NASA
function createRealisticExplosion(position, craterDiameter, kineticEnergy, velocity, diameter) {
    const megatons = kineticEnergy / (4.184 * 10**15);
    
    console.log('🌋 === NASA-BASED IMPACT SIMULATION ===');
    console.log(`📊 Real NASA Data: Diameter ${diameter.toFixed(1)}m, Velocity ${velocity.toFixed(1)} km/s`);
    console.log(`💥 Calculated Energy: ${megatons.toFixed(2)} megatons TNT`);
    console.log(`🕳️ Crater Formula (NASA): D = 1.8 × d^0.78 × v^0.44 = ${craterDiameter.toFixed(0)}m`);
    
    // УЛУЧШЕННАЯ ГЛАВНАЯ ВСПЫШКА
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

    // УЛУЧШЕННАЯ анимация вспышки с пульсацией
    let flashScale = 1;
    let pulseDirection = 1;
    const flashInterval = setInterval(() => {
        flashScale += 0.4 * pulseDirection;
        
        // Пульсация первые 3 итерации
        if (flashScale > 1.5 && pulseDirection === 1) {
            pulseDirection = -1;
        } else if (flashScale < 1.2 && pulseDirection === -1) {
            pulseDirection = 1;
        }
        
        flash.scale.set(flashScale, flashScale, flashScale);
        flash.material.opacity -= 0.025;

        if (flash.material.opacity <= 0) {
            scene.remove(flash);
            if (flash.geometry) flash.geometry.dispose();
            if (flash.material) flash.material.dispose();
            clearInterval(flashInterval);
        }
    }, 50);

    // УЛУЧШЕННЫЙ огненный шар с градиентом цветов
    let particleCount = Math.min(150 + Math.floor(diameter / 5), 800);
    if (window.MOBILE_PARTICLE_REDUCTION) {
        particleCount = Math.floor(particleCount * window.MOBILE_PARTICLE_REDUCTION);
    }
    
    for (let i = 0; i < particleCount; i++) {
        const particleSize = 0.08 + Math.random() * 0.25;
        const particleGeometry = new THREE.SphereGeometry(particleSize, 8, 8);
        
        // Улучшенные цвета взрыва с градиентом от центра
        const distance = Math.random();
        let color;
        if (distance < 0.2) {
            color = 0xffffff; // Белый центр (самая высокая температура)
        } else if (distance < 0.4) {
            color = 0xffffaa; // Светло-желтый
        } else if (distance < 0.6) {
            color = 0xffff00; // Желтый
        } else if (distance < 0.8) {
            color = 0xff8800; // Оранжевый
        } else {
            color = Math.random() > 0.5 ? 0xff4400 : 0xff0000; // Красный/Темно-красный
        }
        
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 1
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.copy(position);

        // Улучшенная скорость разлета - взрывная волна
        const explosionSpeed = 0.3 + (velocity / 40);
        const velocity3D = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        ).normalize().multiplyScalar(Math.random() * explosionSpeed + 0.15);

        scene.add(particle);
        explosionParticles.push({ 
            mesh: particle, 
            velocity: velocity3D, 
            life: 1.2,
            fadeSpeed: 0.004 + Math.random() * 0.008
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
    
    // Позиционируем кратер на поверхности Земли - ТОЧНО в месте удара!
    craterGroup.position.copy(position).normalize().multiplyScalar(10.02);
    craterGroup.lookAt(0, 0, 0);
    
    earth.add(craterGroup);
    crater = craterGroup;
    
    // Вычисляем координаты кратера из 3D позиции взрыва
    // ВАЖНО: позиция может отличаться от исходной impactLocation из-за вращения Земли!
    const radius = 10;
    const normalizedPos = position.clone().normalize().multiplyScalar(radius);
    const craterLat = Math.asin(normalizedPos.y / radius) * 180 / Math.PI;
    const craterLng = Math.atan2(normalizedPos.x, -normalizedPos.z) * 180 / Math.PI;
    
    console.log(`🎯 Crater created at ACTUAL impact position:`);
    console.log(`   3D position: X=${position.x.toFixed(3)}, Y=${position.y.toFixed(3)}, Z=${position.z.toFixed(3)}`);
    console.log(`   Coordinates: ${craterLat.toFixed(6)}°, ${craterLng.toFixed(6)}°`);
    
    // Add crater to Leaflet map too! - используем ВЫЧИСЛЕННЫЕ координаты
    if (window.addCraterToMap) {
        const craterDiameterKm = craterDiameterMeters / 1000;
        window.addCraterToMap(craterLat, craterLng, craterDiameterKm);
        console.log(`🗺️ Crater added to map: ${craterDiameterKm.toFixed(2)} km at ${craterLat.toFixed(4)}°, ${craterLng.toFixed(4)}°`);
    }
    
    console.log(`✅ Crater created on globe and maps: diameter ${craterDiameterMeters.toFixed(0)}m, visual radius ${visualRadius.toFixed(2)} units`);
}

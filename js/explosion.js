// Реалистичный взрыв на основе данных NASA
function createRealisticExplosion(position, craterDiameter, kineticEnergy, velocity, diameter) {
    const megatons = kineticEnergy / (4.184 * 10**15);
    
    // Главная вспышка - размер зависит от энергии
    const flashSize = Math.min(2 + (megatons / 100), 8);
    const flashGeometry = new THREE.SphereGeometry(flashSize, 32, 32);
    const flashMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1
    });
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.copy(position);
    scene.add(flash);

    // Анимация вспышки
    let flashScale = 1;
    const flashInterval = setInterval(() => {
        flashScale += 0.3;
        flash.scale.set(flashScale, flashScale, flashScale);
        flash.material.opacity -= 0.03;

        if (flash.material.opacity <= 0) {
            scene.remove(flash);
            clearInterval(flashInterval);
        }
    }, 50);

    // Огненный шар - количество частиц зависит от размера
    const particleCount = Math.min(100 + Math.floor(diameter / 10), 500);
    
    for (let i = 0; i < particleCount; i++) {
        const particleSize = 0.05 + Math.random() * 0.2;
        const particleGeometry = new THREE.SphereGeometry(particleSize, 8, 8);
        
        // Цвета взрыва: белый, желтый, оранжевый, красный
        const colors = [0xffffff, 0xffff00, 0xff8800, 0xff4400, 0xff0000];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 1
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.copy(position);

        // Скорость разлета зависит от энергии
        const explosionSpeed = 0.2 + (velocity / 50);
        const velocity3D = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        ).normalize().multiplyScalar(Math.random() * explosionSpeed + 0.1);

        scene.add(particle);
        explosionParticles.push({ 
            mesh: particle, 
            velocity: velocity3D, 
            life: 1,
            fadeSpeed: 0.005 + Math.random() * 0.01
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
    
    // Позиционируем кратер на поверхности Земли
    craterGroup.position.copy(position).normalize().multiplyScalar(10.02);
    craterGroup.lookAt(0, 0, 0);
    
    earth.add(craterGroup);
    crater = craterGroup;
    
    console.log(`Кратер создан: диаметр ${craterDiameterMeters.toFixed(0)}м, визуальный радиус ${visualRadius.toFixed(2)} единиц`);
}

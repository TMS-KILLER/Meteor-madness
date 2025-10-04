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
    const size = 0.1 + (velocity / 100);
    const geometry = new THREE.SphereGeometry(size, 16, 16);
    
    // Цвет зависит от температуры (скорости)
    const temperature = velocity * progress;
    let color;
    if (temperature > 30) {
        color = 0xffffff; // Белый - очень горячо
    } else if (temperature > 20) {
        color = 0xffff00; // Желтый - горячо
    } else if (temperature > 10) {
        color = 0xff8800; // Оранжевый - тепло
    } else {
        color = 0xff4400; // Красный - начальная стадия
    }
    
    const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 1
    });
    const particle = new THREE.Mesh(geometry, material);
    particle.position.copy(position);
    scene.add(particle);

    particles.push({ mesh: particle, life: 1, enhanced: true });
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
    
    for (let i = 0; i < 3; i++) {
        const size = 0.05 + Math.random() * 0.15;
        const geometry = new THREE.SphereGeometry(size, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: Math.random() > 0.5 ? 0xffff00 : 0xff8800,
            transparent: true,
            opacity: 0.8
        });
        const heatParticle = new THREE.Mesh(geometry, material);
        
        const offset = new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5
        );
        heatParticle.position.copy(position).add(offset);
        scene.add(heatParticle);

        particles.push({ mesh: heatParticle, life: 0.5, isHeat: true });
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

// Обновление частиц
function updateParticles() {
    // След
    particles.forEach((particle, index) => {
        particle.life -= particle.enhanced ? 0.015 : 0.02;
        particle.mesh.material.opacity = particle.life;
        
        if (particle.isHeat) {
            particle.mesh.position.y += 0.01; // Поднимается вверх
        }
        
        if (!particle.isShockwave) {
            particle.mesh.scale.multiplyScalar(0.95);
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
        }
        
        const fadeSpeed = particle.fadeSpeed || 0.01;
        particle.life -= fadeSpeed;
        particle.mesh.material.opacity = Math.max(0, particle.life);

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

// Создание частицы следа
function createTrailParticle(position) {
    // Уменьшаем количество частиц на мобильных
    if (window.MOBILE_PARTICLE_REDUCTION && Math.random() > window.MOBILE_PARTICLE_REDUCTION) {
        return;
    }
    
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

// УЛУЧШЕННАЯ частица следа с учетом скорости и свечением
function createEnhancedTrailParticle(position, velocity, progress) {
    // Уменьшаем количество частиц на мобильных
    if (window.MOBILE_PARTICLE_REDUCTION && Math.random() > window.MOBILE_PARTICLE_REDUCTION) {
        return;
    }
    
    const size = 0.15 + (velocity / 80);
    const geometry = new THREE.SphereGeometry(size, 16, 16);
    
    // Улучшенный цвет зависит от температуры (скорости)
    const temperature = velocity * progress;
    let color, glowColor;
    if (temperature > 30) {
        color = 0xffffff; // Белый - очень горячо
        glowColor = 0xffffaa;
    } else if (temperature > 20) {
        color = 0xffff88; // Светло-желтый - горячо
        glowColor = 0xffff00;
    } else if (temperature > 10) {
        color = 0xffaa33; // Оранжевый - тепло
        glowColor = 0xff8800;
    } else {
        color = 0xff6600; // Красно-оранжевый - начальная стадия
        glowColor = 0xff4400;
    }
    
    const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 1
    });
    const particle = new THREE.Mesh(geometry, material);
    particle.position.copy(position);
    scene.add(particle);

    // Добавляем свечение вокруг частицы
    const glowGeometry = new THREE.SphereGeometry(size * 1.8, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: glowColor,
        transparent: true,
        opacity: 0.4,
        side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    particle.add(glow);

    particles.push({ mesh: particle, life: 1.5, enhanced: true, hasGlow: true });
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

// УЛУЧШЕННЫЙ эффект нагрева при входе в атмосферу
function createAtmosphericHeating(position, progress) {
    const heatIntensity = (progress - 0.7) / 0.3; // От 0 до 1
    
    // Уменьшаем количество частиц на мобильных
    const particleCount = window.MOBILE_PARTICLE_REDUCTION ? 3 : 5;
    
    for (let i = 0; i < particleCount; i++) {
        const size = 0.08 + Math.random() * 0.2;
        const geometry = new THREE.SphereGeometry(size, 8, 8);
        
        // Градиент от желтого к белому при высокой интенсивности
        const color = heatIntensity > 0.7 ? 0xffffff : (Math.random() > 0.5 ? 0xffffaa : 0xffaa00);
        
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.9
        });
        const heatParticle = new THREE.Mesh(geometry, material);
        
        const offset = new THREE.Vector3(
            (Math.random() - 0.5) * 0.6,
            (Math.random() - 0.5) * 0.6,
            (Math.random() - 0.5) * 0.6
        );
        heatParticle.position.copy(position).add(offset);
        scene.add(heatParticle);

        // Добавляем случайную скорость разлета
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02
        );

        particles.push({ 
            mesh: heatParticle, 
            life: 0.7, 
            isHeat: true,
            heatVelocity: velocity
        });
    }
}

// УЛУЧШЕННАЯ ударная волна перед астероидом
function createShockwave(position, target, progress) {
    const direction = new THREE.Vector3().subVectors(target, position).normalize();
    const shockwavePos = position.clone().add(direction.multiplyScalar(2.5));
    
    const shockwaveIntensity = (progress - 0.85) / 0.15; // 0 to 1
    const size = 0.4 + shockwaveIntensity * 0.6;
    
    const geometry = new THREE.RingGeometry(size * 0.7, size, 32);
    const material = new THREE.MeshBasicMaterial({
        color: 0xaaddff,
        transparent: true,
        opacity: 0.5 + shockwaveIntensity * 0.3,
        side: THREE.DoubleSide
    });
    const shockwave = new THREE.Mesh(geometry, material);
    shockwave.position.copy(shockwavePos);
    shockwave.lookAt(target);
    scene.add(shockwave);

    particles.push({ mesh: shockwave, life: 0.4, isShockwave: true, growSpeed: 0.05 });
}

// Обновление частиц
function updateParticles() {
    // След
    particles.forEach((particle, index) => {
        particle.life -= particle.enhanced ? 0.012 : 0.02;
        particle.mesh.material.opacity = particle.life;
        
        if (particle.isHeat) {
            particle.mesh.position.y += 0.015; // Поднимается вверх быстрее
            if (particle.heatVelocity) {
                particle.mesh.position.add(particle.heatVelocity);
            }
        }
        
        if (particle.isShockwave) {
            // Ударная волна расширяется
            const growSpeed = particle.growSpeed || 0.03;
            particle.mesh.scale.multiplyScalar(1 + growSpeed);
        } else if (!particle.hasGlow) {
            particle.mesh.scale.multiplyScalar(0.96);
        }

        if (particle.life <= 0) {
            scene.remove(particle.mesh);
            if (particle.mesh.geometry) particle.mesh.geometry.dispose();
            if (particle.mesh.material) particle.mesh.material.dispose();
            particles.splice(index, 1);
        }
    });

    // Взрыв
    explosionParticles.forEach((particle, index) => {
        if (particle.velocity) {
            particle.mesh.position.add(particle.velocity);
            // Гравитация для частиц взрыва
            particle.velocity.y -= 0.001;
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
            if (particle.mesh.geometry) particle.mesh.geometry.dispose();
            if (particle.mesh.material) particle.mesh.material.dispose();
            explosionParticles.splice(index, 1);
        }
    });
}

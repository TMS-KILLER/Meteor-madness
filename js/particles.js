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

// РЕАЛИСТИЧНЫЙ ОГНЕННЫЙ СЛЕД астероида - быстро исчезает
function createEnhancedTrailParticle(position, velocity, progress) {
    // Уменьшаем количество частиц на мобильных
    if (window.MOBILE_PARTICLE_REDUCTION && Math.random() > window.MOBILE_PARTICLE_REDUCTION) {
        return;
    }
    
    // Размер зависит от скорости
    const baseSize = 0.12 + (velocity / 80);
    
    // Температура зависит от прогресса входа в атмосферу
    const temperature = progress * velocity;
    let fireColor, coreColor;
    
    if (temperature > 25) {
        fireColor = 0xffeedd; // Почти белый - плазменный огонь
        coreColor = 0xffffff;
    } else if (temperature > 15) {
        fireColor = 0xffcc44; // Ярко-желтый - очень горячий
        coreColor = 0xffffee;
    } else if (temperature > 8) {
        fireColor = 0xff8833; // Оранжевый - горячий огонь
        coreColor = 0xffdd66;
    } else {
        fireColor = 0xff5522; // Красно-оранжевый
        coreColor = 0xff9944;
    }
    
    // Группа для огня
    const fireGroup = new THREE.Group();
    fireGroup.position.copy(position);
    
    // 1. ЯРКОЕ ЯДРО (центр пламени)
    const coreSize = baseSize * 0.4;
    const coreGeometry = new THREE.SphereGeometry(coreSize, 8, 8);
    const coreMaterial = new THREE.MeshBasicMaterial({
        color: coreColor,
        transparent: true,
        opacity: 1
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    fireGroup.add(core);
    
    // 2. ОСНОВНОЕ ПЛАМЯ
    const flameGeometry = new THREE.SphereGeometry(baseSize, 10, 10);
    const flameMaterial = new THREE.MeshBasicMaterial({
        color: fireColor,
        transparent: true,
        opacity: 0.85
    });
    const flame = new THREE.Mesh(flameGeometry, flameMaterial);
    fireGroup.add(flame);
    
    // 3. ВНЕШНЕЕ СВЕЧЕНИЕ (мягкое)
    const glowSize = baseSize * 1.8;
    const glowGeometry = new THREE.SphereGeometry(glowSize, 12, 12);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: fireColor,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    fireGroup.add(glow);
    
    // 4. ИСКРЫ (редко, для реализма)
    if (Math.random() > 0.7 && progress > 0.5) {
        for (let i = 0; i < 2; i++) {
            const sparkSize = baseSize * 0.2;
            const sparkGeometry = new THREE.SphereGeometry(sparkSize, 4, 4);
            const sparkMaterial = new THREE.MeshBasicMaterial({
                color: 0xffdd66,
                transparent: true,
                opacity: 0.9
            });
            const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
            const offset = baseSize * 1.5;
            spark.position.set(
                (Math.random() - 0.5) * offset,
                (Math.random() - 0.5) * offset,
                (Math.random() - 0.5) * offset
            );
            fireGroup.add(spark);
        }
    }
    
    // Сохраняем базовые значения прозрачности для последующего масштабирования
    fireGroup.traverse(obj => {
        if (obj.isMesh && obj.material) {
            obj.userData.baseOpacity = obj.material.opacity;
        }
    });
    
    scene.add(fireGroup);
    
    // БЫСТРОЕ ИСЧЕЗНОВЕНИЕ (0.4-0.6 секунд)
    const life = 0.5 + Math.random() * 0.1; // Очень короткая жизнь!
    particles.push({ 
        mesh: fireGroup, 
        life: life,
        initialLife: life,
        enhanced: true,
        isFire: true
    });
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

// РЕАЛИСТИЧНАЯ ударная волна перед астероидом (тонкая, быстрая)
function createShockwave(position, target, progress) {
    const direction = new THREE.Vector3().subVectors(target, position).normalize();
    const shockwavePos = position.clone().add(direction.multiplyScalar(1.8));
    
    const shockwaveIntensity = (progress - 0.85) / 0.15; // 0 to 1
    const size = 0.3 + shockwaveIntensity * 0.4;
    
    // Тонкое кольцо (не толстое)
    const geometry = new THREE.RingGeometry(size * 0.85, size, 32);
    const material = new THREE.MeshBasicMaterial({
        color: 0xccddff, // Светло-голубой (сжатый воздух)
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
    });
    const shockwave = new THREE.Mesh(geometry, material);
    shockwave.position.copy(shockwavePos);
    shockwave.lookAt(target);
    scene.add(shockwave);

    particles.push({ 
        mesh: shockwave, 
        life: 0.3, // Короткая жизнь
        isShockwave: true, 
        growSpeed: 0.06 // Быстрое расширение
    });
}

// Обновление частиц
function updateParticles() {
    // Безопасный проход по массиву (обратный, чтобы можно было удалять)
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        if (!particle || !particle.mesh) {
            particles.splice(i, 1);
            continue;
        }

        if (particle.isFire) {
            // Быстрое затухание огня
            particle.life -= 0.04;
            const fadeLinear = Math.max(particle.life / (particle.initialLife || 0.0001), 0);
            const fade = fadeLinear * fadeLinear; // квадратичное

            // Масштабируем группу (немного расширяется)
            particle.mesh.scale.multiplyScalar(1.02);

            // Применяем прозрачность к дочерним мешам
            particle.mesh.traverse(obj => {
                if (obj.isMesh && obj.material) {
                    const base = obj.userData.baseOpacity != null ? obj.userData.baseOpacity : obj.material.opacity;
                    obj.material.opacity = base * fade;
                }
            });
        } else {
            // Обычные частицы
            particle.life -= particle.enhanced ? 0.012 : 0.02;
            if (particle.mesh.material && particle.mesh.material.opacity !== undefined) {
                particle.mesh.material.opacity = particle.life;
            }
        }
        
        if (particle.isHeat) {
            particle.mesh.position.y += 0.015;
            if (particle.heatVelocity) {
                particle.mesh.position.add(particle.heatVelocity);
            }
        }
        
        if (particle.isShockwave) {
            const growSpeed = particle.growSpeed || 0.03;
            particle.mesh.scale.multiplyScalar(1 + growSpeed);
        } else if (!particle.hasGlow && !particle.isFire) {
            particle.mesh.scale.multiplyScalar(0.96);
        }

        if (particle.life <= 0) {
            scene.remove(particle.mesh);
            // Глубокая очистка
            particle.mesh.traverse(obj => {
                if (obj.isMesh) {
                    if (obj.geometry) obj.geometry.dispose();
                    if (obj.material) obj.material.dispose();
                }
            });
            particles.splice(i, 1);
        }
    }

    // Частицы взрыва с РЕАЛИСТИЧНОЙ физикой
    for (let i = explosionParticles.length - 1; i >= 0; i--) {
        const particle = explosionParticles[i];
        particle.life -= 0.02;
        
        if (particle.rotation) {
            particle.mesh.rotation.x += particle.rotation.x;
            particle.mesh.rotation.y += particle.rotation.y;
            particle.mesh.rotation.z += particle.rotation.z;
        }
        
        particle.velocity.y -= 0.0012;
        particle.mesh.position.add(particle.velocity);
        
        if (particle.mesh.material && particle.mesh.material.opacity !== undefined) {
            particle.mesh.material.opacity -= particle.fadeSpeed || 0.008;
        }

        if (particle.life <= 0 || (particle.mesh.material && particle.mesh.material.opacity <= 0)) {
            scene.remove(particle.mesh);
            if (particle.mesh.geometry) particle.mesh.geometry.dispose();
            if (particle.mesh.material) particle.mesh.material.dispose();
            explosionParticles.splice(i, 1);
        }
    }
}

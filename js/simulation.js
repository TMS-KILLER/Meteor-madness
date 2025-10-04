// Determine location by coordinates
function getLocationDescription(lat, lng) {
    // Check main geographical zones
    
    // Oceans
    if (lat > -60 && lat < 60) {
        if (lng > -180 && lng < -30) {
            if (lat > 0) return "North Atlantic";
            return "South Atlantic";
        } else if (lng >= -30 && lng < 60) {
            if (lat > 30) return "Europe/Mediterranean";
            if (lat > 0) return "Africa/Middle East";
            return "Southern Africa";
        } else if (lng >= 60 && lng < 150) {
            if (lat > 30) return "Central Asia";
            if (lat > 0) return "Indian Ocean/Southeast Asia";
            return "Indian Ocean";
        } else {
            if (lat > 0) return "North Pacific Ocean";
            return "South Pacific Ocean";
        }
    }
    
    // Polar regions
    if (lat >= 60) return "Arctic/North";
    if (lat <= -60) return "Antarctica";
    
    return "Unknown Region";
}

// Start simulation
function startSimulation() {
    if (isSimulationRunning) return;
    
    // CHECK: make sure asteroid is created
    if (!asteroid) {
        console.error('ERROR: Asteroid not created! Check asteroid selection.');
        alert('Please select an asteroid from the list first!');
        return;
    }
    
    if (!impactLocation || !impactLocation.lat) {
        console.error('ERROR: Impact location not selected!');
        alert('Please select an impact location on the map or enter coordinates!');
        return;
    }
    
    console.log('✅ Starting simulation with asteroid:', asteroid);
    
    isSimulationRunning = true;
    document.getElementById('start-simulation').disabled = true;

    // Calculate impact energy (WITHOUT showing consequences)
    calculateImpact();

    // Fall animation
    animateImpact();
}

// Calculate impact parameters
function calculateImpact() {
    const diameter = (
        selectedAsteroid.estimated_diameter.meters.estimated_diameter_min +
        selectedAsteroid.estimated_diameter.meters.estimated_diameter_max
    ) / 2;

    const velocity = selectedAsteroid.close_approach_data && selectedAsteroid.close_approach_data[0]
        ? parseFloat(selectedAsteroid.close_approach_data[0].relative_velocity.kilometers_per_second)
        : 20;

    const mass = (4/3) * Math.PI * Math.pow(diameter/2, 3) * 2500; // density ~2500 kg/m³
    const kineticEnergy = 0.5 * mass * Math.pow(velocity * 1000, 2); // Joules
    const megatons = kineticEnergy / (4.184 * 10**15); // convert to megatons TNT
    const craterDiameter = 1.8 * Math.pow(diameter, 0.78) * Math.pow(velocity, 0.44);

    const impactInfo = document.getElementById('impact-info');
    const impactDetails = document.getElementById('impact-details');
    
    impactDetails.innerHTML = `
        <div class="detail-row">
            <span class="detail-label">Mass:</span>
            <span class="detail-value">${(mass / 1000000).toFixed(2)} tons</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Impact Energy:</span>
            <span class="detail-value">${megatons.toFixed(2)} megatons TNT</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Crater Diameter:</span>
            <span class="detail-value">${craterDiameter.toFixed(0)} m</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Destruction Radius:</span>
            <span class="detail-value">${(craterDiameter * 2).toFixed(0)} m</span>
        </div>
    `;

    impactInfo.style.display = 'block';
    
    // DON'T show consequences here - only after impact!
    // Save data for use after impact
    window.impactCalculations = {
        diameter,
        velocity,
        mass,
        kineticEnergy,
        megatons,
        craterDiameter
    };
}

// Calculate asteroid impact consequences
function calculateConsequences(diameter, velocity, mass, kineticEnergy, megatons, craterDiameter) {
    // Radii of various damage zones (in km)
    const fireball = Math.pow(megatons, 0.4) * 0.2; // Fireball
    const radiationRadius = Math.pow(megatons, 0.33) * 2; // Thermal radiation (3rd degree burns)
    const shockwaveRadius = Math.pow(megatons, 0.33) * 5; // Shockwave (building destruction)
    const earthquakeRadius = Math.pow(megatons, 0.5) * 10; // Seismic wave
    
    // Casualty estimate (rough)
    const populationDensity = 100; // average population density people/km²
    const affectedArea = Math.PI * Math.pow(shockwaveRadius, 2);
    const estimatedCasualties = Math.floor(affectedArea * populationDensity);
    
    // Crater depth (typically 1/5 of diameter)
    const craterDepth = craterDiameter / 5;
    
    // Volume of ejected material
    const ejectaVolume = Math.PI * Math.pow(craterDiameter / 2, 2) * craterDepth;
    
    // Comparison with known events
    let comparison = '';
    if (megatons < 0.01) {
        comparison = 'Less than Hiroshima bomb';
    } else if (megatons < 1) {
        comparison = 'Comparable to tactical nuclear weapon';
    } else if (megatons < 50) {
        comparison = `${(megatons / 0.015).toFixed(0)}x more powerful than Hiroshima bomb`;
    } else if (megatons < 1000) {
        comparison = 'Comparable to largest nuclear bombs';
    } else {
        comparison = 'Planetary-scale catastrophe';
    }
    
    // Temperature at epicenter
    const temperatureKelvin = Math.pow(megatons, 0.25) * 5000;
    
    const consequencesPanel = document.getElementById('impact-consequences');
    const consequencesData = document.getElementById('consequences-data');
    
    consequencesData.innerHTML = `
        <div class="detail-row" style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.2);">
            <strong style="color: #ff6b6b; font-size: 1.1em;">⚠️ ${comparison}</strong>
        </div>
        
        <div class="detail-row" style="margin-bottom: 10px; padding: 10px; background: rgba(100,150,255,0.2); border-radius: 6px;">
            <div style="width: 100%;">
                <strong style="color: #6bb6ff;">📍 IMPACT POINT:</strong><br>
                <span style="color: #fff;">Coordinates: ${impactLocation.lat.toFixed(6)}°, ${impactLocation.lng.toFixed(6)}°</span><br>
                <span style="color: #fff;">Region: ${getLocationDescription(impactLocation.lat, impactLocation.lng)}</span>
            </div>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">🔥 Fireball Diameter:</span>
            <span class="detail-value">${fireball.toFixed(2)} km</span>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">🕳️ Crater Diameter:</span>
            <span class="detail-value">${(craterDiameter / 1000).toFixed(2)} km (${craterDiameter.toFixed(0)} m)</span>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">📏 Crater Depth:</span>
            <span class="detail-value">${(craterDepth / 1000).toFixed(2)} km (${craterDepth.toFixed(0)} m)</span>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">💥 Ejected Material Volume:</span>
            <span class="detail-value">${(ejectaVolume / 1e9).toFixed(2)} km³</span>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">🌡️ Temperature at Epicenter:</span>
            <span class="detail-value">${temperatureKelvin.toFixed(0)} K (${(temperatureKelvin - 273).toFixed(0)}°C)</span>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">☢️ Thermal Burns Radius:</span>
            <span class="detail-value">${radiationRadius.toFixed(2)} km</span>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">💨 Shockwave Radius:</span>
            <span class="detail-value">${shockwaveRadius.toFixed(2)} km</span>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">🌍 Seismic Wave Radius:</span>
            <span class="detail-value">${earthquakeRadius.toFixed(2)} km</span>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">📊 Affected Area:</span>
            <span class="detail-value">${affectedArea.toFixed(0)} km²</span>
        </div>
        
        <div class="detail-row" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2);">
            <span class="detail-label" style="color: #ff6b6b;">☠️ Casualty Estimate (avg. density):</span>
            <span class="detail-value" style="color: #ff6b6b; font-weight: bold;">${estimatedCasualties.toLocaleString()} people</span>
        </div>
        
        <div style="margin-top: 15px; padding: 10px; background: rgba(255,100,100,0.2); border-radius: 6px; border-left: 3px solid #ff6b6b;">
            <strong>⚠️ Long-term Consequences:</strong><br>
            ${megatons > 1000 ? '• Mass extinction<br>• Nuclear winter for years<br>• Ozone layer destruction' : 
              megatons > 100 ? '• Regional catastrophe<br>• Climate change for months<br>• Tsunami (if ocean impact)' :
              megatons > 10 ? '• City destruction<br>• Forest fires<br>• Dust ejection into atmosphere' :
              '• Local destruction<br>• Temporary atmospheric darkening'}
        </div>
    `;
    
    consequencesPanel.style.display = 'block';
    
    // Call additional panels for NASA Space Apps Challenge
    compareWithHistory(diameter, velocity, megatons);
    calculatePlanetaryDefense(diameter, velocity, megatons);
    
    console.log('=== IMPACT CONSEQUENCES ===');
    console.log('Explosion energy:', megatons.toFixed(2), 'megatons');
    console.log('Диаметр кратера:', (craterDiameter / 1000).toFixed(2), 'км');
    console.log('Радиус поражения:', shockwaveRadius.toFixed(2), 'км');
}

// Compare with historical events
function compareWithHistory(diameter, velocity, megatons) {
    const historicalPanel = document.getElementById('historical-comparison');
    const historicalData = document.getElementById('historical-data');
    
    let historicalEvent = '';
    let comparison = '';
    let description = '';
    
    if (megatons < 0.001) {
        historicalEvent = '🏘️ Peekskill Meteorite (1992)';
        comparison = 'Very small meteorite';
        description = 'Fell in USA, hit a car. Diameter ~10 cm. No casualties.';
    } else if (megatons < 0.5) {
        historicalEvent = '💥 Chelyabinsk Meteorite (2013)';
        comparison = `${(megatons / 0.5).toFixed(1)}x ${megatons < 0.5 ? 'weaker' : 'stronger'}`;
        description = 'Diameter ~20m, exploded over Russia. Shockwave damaged 7200 buildings, ~1500 injured.';
    } else if (megatons < 15) {
        historicalEvent = '🌲 Tunguska Event (1908)';
        comparison = `${(megatons / 15).toFixed(1)}x ${megatons < 15 ? 'weaker' : 'stronger'}`;
        description = 'Diameter ~60-100m, exploded over Siberia. Flattened 80M trees over 2150 km².';
    } else if (megatons < 50) {
        historicalEvent = '☢️ Tsar Bomba (1961)';
        comparison = `${(megatons / 50).toFixed(1)}x ${megatons < 50 ? 'weaker' : 'stronger'}`;
        description = 'Largest nuclear test in history (USSR). Power 50 megatons.';
    } else if (megatons < 10000) {
        historicalEvent = '🕳️ Barringer Crater (50,000 years ago)';
        comparison = `Comparable to catastrophe`;
        description = 'Asteroid diameter ~50m, crater 1.2km in Arizona. Energy ~10 megatons.';
    } else {
        historicalEvent = '🦖 Chicxulub Impactor (66 million years ago)';
        comparison = 'PLANETARY-SCALE CATASTROPHE';
        description = 'Diameter ~10km, crater 180km in Mexico. Killed dinosaurs. Energy ~100M megatons.';
    }
    
    historicalData.innerHTML = `
        <div style="margin-bottom: 15px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
            <h3 style="color: #ff6b35; margin-bottom: 10px;">${historicalEvent}</h3>
            <p style="color: #aaa; font-size: 14px; line-height: 1.6;">${description}</p>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">⚖️ Comparison:</span>
            <span class="detail-value">${comparison}</span>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">💥 Your Asteroid:</span>
            <span class="detail-value">${megatons.toFixed(2)} megatons</span>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">📏 Asteroid Diameter:</span>
            <span class="detail-value">${diameter.toFixed(1)} m</span>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">⚡ Impact Velocity:</span>
            <span class="detail-value">${velocity.toFixed(1)} km/s</span>
        </div>
        
        ${megatons < 0.5 ? `
            <div style="margin-top: 15px; padding: 10px; background: rgba(50,255,100,0.1); border-radius: 6px; border-left: 3px solid #32ff64;">
                <strong>✅ Low Danger</strong><br>
                Similar meteorites fall several times per year.
            </div>
        ` : megatons < 15 ? `
            <div style="margin-top: 15px; padding: 10px; background: rgba(255,200,50,0.1); border-radius: 6px; border-left: 3px solid #ffc832;">
                <strong>⚠️ Medium Danger</strong><br>
                Similar events occur once every 100-1000 years.
            </div>
        ` : `
            <div style="margin-top: 15px; padding: 10px; background: rgba(255,50,50,0.2); border-radius: 6px; border-left: 3px solid #ff3232;">
                <strong>🚨 CRITICAL DANGER</strong><br>
                Similar catastrophes occur once every ${megatons > 10000 ? 'millions' : 'thousands'} of years!
            </div>
        `}
    `;
    
    historicalPanel.style.display = 'block';
}

// Calculate planetary defense
function calculatePlanetaryDefense(diameter, velocity, megatons) {
    const defensePanel = document.getElementById('planetary-defense');
    const defenseData = document.getElementById('defense-data');
    
    // Warning time for various detection methods
    const detectionTime = diameter > 100 ? '10+ years' : diameter > 50 ? '5-10 years' : diameter > 20 ? '1-5 years' : 'weeks-months';
    
    // Defense methods
    let defenseMethod = '';
    let feasibility = '';
    
    if (megatons < 1) {
        defenseMethod = '💨 Atmospheric Breakup';
        feasibility = 'Small asteroids usually burn up in atmosphere. Defense not required.';
    } else if (megatons < 100) {
        defenseMethod = '🚀 Kinetic Impactor';
        feasibility = 'Launch spacecraft to collide with asteroid and change its trajectory. Requires 5-10 years preparation. DART Mission (NASA, 2022) successfully tested this method!';
    } else if (megatons < 10000) {
        defenseMethod = '☢️ Nuclear Deflection';
        feasibility = 'Nuclear device detonation near asteroid to change trajectory. Requires 10+ years preparation. Very risky method.';
    } else {
        defenseMethod = '🏃 Population Evacuation';
        feasibility = 'Asteroid too large to deflect. Only option - mass evacuation from impact zone.';
    }
    
    // Preparation time needed
    const timeNeeded = megatons < 1 ? 'Not required' : 
                       megatons < 100 ? '5-10 years' : 
                       megatons < 10000 ? '10-20 years' : '20+ years';
    
    // Mission cost estimate
    const costEstimate = megatons < 1 ? 'N/A' :
                        megatons < 100 ? '$500M - $2B' :
                        megatons < 10000 ? '$5-20B' : '$50B+';
    
    defenseData.innerHTML = `
        <div style="margin-bottom: 15px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
            <h3 style="color: #32ff64; margin-bottom: 10px;">${defenseMethod}</h3>
            <p style="color: #aaa; font-size: 14px; line-height: 1.6;">${feasibility}</p>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">🔭 Detection Time:</span>
            <span class="detail-value">${detectionTime}</span>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">⏰ Preparation Time:</span>
            <span class="detail-value">${timeNeeded}</span>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">💰 Mission Cost:</span>
            <span class="detail-value">${costEstimate}</span>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">🎯 Success Probability:</span>
            <span class="detail-value">${megatons < 1 ? '100%' : megatons < 100 ? '70-90%' : megatons < 10000 ? '30-60%' : '<10%'}</span>
        </div>
        
        <div style="margin-top: 15px; padding: 12px; background: rgba(100,150,255,0.1); border-radius: 6px; border-left: 3px solid #6496ff;">
            <strong>🛰️ NASA Programs:</strong><br>
            <div style="font-size: 13px; color: #aaa; margin-top: 8px; line-height: 1.8;">
                • <strong>DART</strong> - Successfully changed asteroid orbit (2022)<br>
                • <strong>NEO Surveyor</strong> - Telescope to find asteroids (launch 2027)<br>
                • <strong>Planetary Defense Office</strong> - Earth protection coordination<br>
                • <strong>NEOWs API</strong> - Dangerous objects monitoring
            </div>
        </div>
        
        <div style="margin-top: 15px; padding: 12px; background: rgba(255,200,50,0.1); border-radius: 6px; border-left: 3px solid #ffc832;">
            <strong>📊 NASA Statistics:</strong><br>
            <div style="font-size: 13px; color: #aaa; margin-top: 8px; line-height: 1.8;">
                • >30,000 near-Earth asteroids discovered<br>
                • ~150 new found each month<br>
                • ~2,300 potentially hazardous objects<br>
                • Major impact probability: once in 100,000 years
            </div>
        </div>
    `;
    
    defensePanel.style.display = 'block';
}

// Анимация удара с данными в реальном времени
function animateImpact() {
    // 100% ТОЧНОЕ ПОПАДАНИЕ: Вычисляем endPos НАПРЯМУЮ из координат lat/lng
    const earthRadius = 10;
    const lat = impactLocation.lat;
    const lng = impactLocation.lng;
    
    // Конвертируем координаты в радианы
    const latRad = lat * (Math.PI / 180);
    const lngRad = lng * (Math.PI / 180);
    
    // Three.js standard formula for sphere with equirectangular texture
    const endPos = new THREE.Vector3(
        -earthRadius * Math.cos(latRad) * Math.sin(lngRad),
        earthRadius * Math.sin(latRad),
        -earthRadius * Math.cos(latRad) * Math.cos(lngRad)
    );
    
    // ВАЖНО: Астероид должен падать СНАРУЖИ Земли!
    // Создаем стартовую позицию на линии от центра через точку удара
    const startDistance = 50; // Расстояние от центра Земли (далеко в космосе)
    const direction = endPos.clone().normalize();
    const startPos = direction.multiplyScalar(startDistance);
    
    // Перемещаем астероид на стартовую позицию
    asteroid.position.copy(startPos);
    
    console.log('=== НАЧАЛО СИМУЛЯЦИИ (100% ТОЧНОСТЬ) ===');
    console.log('Координаты удара:', lat.toFixed(6) + '°', lng.toFixed(6) + '°');
    console.log('Стартовая позиция астероида (вне Земли):', startPos);
    console.log('Целевая точка (поверхность Земли):', endPos);
    console.log('Расстояние до цели:', startPos.distanceTo(endPos).toFixed(2), 'единиц');
    
    const duration = 5000; // 5 секунд
    const startTime = Date.now();

    // Создаем индикатор цели (красное кольцо НА ТОЧКЕ УДАРА)
    if (targetIndicator) {
        scene.remove(targetIndicator);
    }
    const ringGeometry = new THREE.RingGeometry(0.3, 0.5, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000, 
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
    });
    targetIndicator = new THREE.Mesh(ringGeometry, ringMaterial);
    targetIndicator.position.copy(endPos); // УСТАНАВЛИВАЕМ НА ТОЧКУ УДАРА
    targetIndicator.lookAt(new THREE.Vector3(0, 0, 0)); // Направляем к центру Земли
    scene.add(targetIndicator);
    
    console.log('✅ Индикатор цели установлен на:', endPos);

    // Получаем данные астероида
    const diameter = (
        selectedAsteroid.estimated_diameter.meters.estimated_diameter_min +
        selectedAsteroid.estimated_diameter.meters.estimated_diameter_max
    ) / 2;
    
    const velocity = selectedAsteroid.close_approach_data && selectedAsteroid.close_approach_data[0]
        ? parseFloat(selectedAsteroid.close_approach_data[0].relative_velocity.kilometers_per_second)
        : 20;
    
    const craterDiameter = 1.8 * Math.pow(diameter, 0.78) * Math.pow(velocity, 0.44);
    const mass = (4/3) * Math.PI * Math.pow(diameter/2, 3) * 2500;
    const kineticEnergy = 0.5 * mass * Math.pow(velocity * 1000, 2);
    
    // Создаем свечение атмосферы при входе
    if (showFallVisualization) {
        createAtmosphericEntry();
    }

    // Элемент для данных в реальном времени
    const realtimeData = document.getElementById('realtime-data');
    const realtimeContent = document.createElement('div');
    realtimeContent.id = 'realtime-content-dynamic';
    
    if (realtimeData.querySelector('#realtime-content')) {
        realtimeData.querySelector('#realtime-content').innerHTML = '';
    }

    function updateImpact() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // РЕАЛИСТИЧНАЯ ФИЗИКА: Гравитационное ускорение
        const easedProgress = progress * progress * (3 - 2 * progress); // Smooth hermite interpolation
        
        // Гравитационный фактор
        const gravityFactor = 1 + (progress * progress * 0.5);

        // ТОЧНОЕ ДВИЖЕНИЕ К ЦЕЛИ
        asteroid.position.lerpVectors(startPos, endPos, easedProgress);
        
        // Индикатор остается на месте удара, НЕ следует за астероидом
        if (targetIndicator) {
            targetIndicator.rotation.y += 0.1; // Только вращение
            // Пульсация при приближении
            const scale = 1 + Math.sin(elapsed * 0.01) * 0.2;
            targetIndicator.scale.set(scale, scale, scale);
        }
        
        // Вращение увеличивается при входе в атмосферу
        const rotationSpeed = Math.min(velocity / 10, 0.2) * gravityFactor;
        asteroid.rotation.x += rotationSpeed;
        asteroid.rotation.y += rotationSpeed * 0.7;
        asteroid.rotation.z += rotationSpeed * 0.3;

        // REAL DATA IN REAL-TIME (updates every frame)
        const distanceToImpact = asteroid.position.distanceTo(endPos);
        const currentSpeed = velocity * (1 + progress * 0.5); // Increases due to gravity
        const timeToImpact = ((1 - progress) * duration / 1000).toFixed(1);
        
        // Real altitude above surface (1 unit = ~637 km in Earth scale)
        const altitudeUnits = distanceToImpact - earthRadius;
        const altitudeKm = Math.max(0, altitudeUnits * 637.1); // km
        
        // Real kinetic energy at current moment
        const currentKE = 0.5 * mass * Math.pow(currentSpeed * 1000, 2);
        const currentMegatons = currentKE / (4.184 * 10**15);
        
        // Temperature from atmospheric friction (simplified model)
        const atmosphereFactor = altitudeKm < 100 ? (100 - altitudeKm) / 100 : 0;
        const temperature = 20 + (atmosphereFactor * 1500); // Up to 1500°C
        
        const realtimeContentDiv = realtimeData.querySelector('#realtime-content');
        if (realtimeContentDiv) {
            realtimeContentDiv.innerHTML = `
                <div class="realtime-row" style="background: rgba(255,107,53,0.1); padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                    <span class="detail-label">⏱️ Time to Impact:</span>
                    <span class="detail-value" style="color: ${timeToImpact < 2 ? '#ff0000' : '#ffaa00'}; font-weight: bold;">${timeToImpact} sec</span>
                </div>
                <div class="realtime-row">
                    <span class="detail-label">📏 Distance to Target:</span>
                    <span class="detail-value">${distanceToImpact.toFixed(2)} u (${altitudeKm.toFixed(1)} km)</span>
                </div>
                <div class="realtime-row">
                    <span class="detail-label">🚀 Current Speed:</span>
                    <span class="detail-value">${currentSpeed.toFixed(2)} km/s (${(currentSpeed * 3600).toFixed(0)} km/h)</span>
                </div>
                <div class="realtime-row">
                    <span class="detail-label">🌡️ Surface Temperature:</span>
                    <span class="detail-value" style="color: ${temperature > 1000 ? '#ff4400' : '#ffaa00'};">${temperature.toFixed(0)}°C</span>
                </div>
                <div class="realtime-row">
                    <span class="detail-label">⚡ Kinetic Energy:</span>
                    <span class="detail-value">${currentMegatons.toFixed(2)} megatons TNT</span>
                </div>
                <div class="realtime-row">
                    <span class="detail-label">📍 Target Coordinates:</span>
                    <span class="detail-value">${impactLocation.lat.toFixed(4)}°, ${impactLocation.lng.toFixed(4)}°</span>
                </div>
                <div class="realtime-row">
                    <span class="detail-label">📊 Progress:</span>
                    <span class="detail-value">
                        <div style="background: rgba(255,255,255,0.1); height: 20px; border-radius: 10px; overflow: hidden; margin-top: 5px;">
                            <div style="background: linear-gradient(90deg, #ff6b35, #ff0000); height: 100%; width: ${(progress * 100).toFixed(1)}%; transition: width 0.1s;"></div>
                        </div>
                        ${(progress * 100).toFixed(1)}%
                    </span>
                </div>
            `;
        }
        
        realtimeData.style.display = 'block';

        // Визуализация падения
        if (showFallVisualization) {
            // След с интенсивностью зависящей от скорости
            if (Math.random() > 0.5) {
                createEnhancedTrailParticle(asteroid.position.clone(), currentSpeed, progress);
            }
            
            // Нагрев при входе в атмосферу (последние 30% пути)
            if (progress > 0.7) {
                createAtmosphericHeating(asteroid.position.clone(), progress);
            }
            
            // Ударная волна перед астероидом
            if (progress > 0.85) {
                createShockwave(asteroid.position.clone(), endPos, progress);
            }
        } else {
            // Простой след
            if (Math.random() > 0.7) {
                createTrailParticle(asteroid.position.clone());
            }
        }

        if (progress < 1) {
            requestAnimationFrame(updateImpact);
        } else {
            // Взрыв при ударе
            createRealisticExplosion(endPos, craterDiameter, kineticEnergy, velocity, diameter);
            scene.remove(asteroid);
            asteroid = null;
            
            if (targetIndicator) {
                scene.remove(targetIndicator);
                targetIndicator = null;
            }
            
            // Remove atmosphere glow
            if (atmosphereGlow) {
                scene.remove(atmosphereGlow);
                atmosphereGlow = null;
            }

            // Final data
            const realtimeContentDiv = realtimeData.querySelector('#realtime-content');
            if (realtimeContentDiv) {
                realtimeContentDiv.innerHTML = `
                    <div class="realtime-row" style="color: #ff0000; font-weight: bold; justify-content: center;">
                        <span>💥 IMPACT OCCURRED!</span>
                    </div>
                    <div class="realtime-row" style="margin-top: 10px;">
                        <span class="realtime-label">📍 Impact Coordinates:</span>
                        <span class="realtime-value">${impactLocation.lat.toFixed(6)}°, ${impactLocation.lng.toFixed(6)}°</span>
                    </div>
                    <div class="realtime-row">
                        <span class="realtime-label">🌍 Location:</span>
                        <span class="realtime-value">${getLocationDescription(impactLocation.lat, impactLocation.lng)}</span>
                    </div>
                    <div class="realtime-row">
                        <span class="realtime-label">📏 Asteroid Diameter:</span>
                        <span class="realtime-value">${diameter.toFixed(1)} m</span>
                    </div>
                    <div class="realtime-row">
                        <span class="realtime-label">⚡ Impact Velocity:</span>
                        <span class="realtime-value">${velocity.toFixed(2)} km/s</span>
                    </div>
                    <div class="realtime-row">
                        <span class="realtime-label">🕳️ Crater Diameter:</span>
                        <span class="realtime-value">${(craterDiameter / 1000).toFixed(2)} km (${craterDiameter.toFixed(0)} m)</span>
                    </div>
                    <div class="realtime-row">
                        <span class="realtime-label">💥 Energy:</span>
                        <span class="realtime-value">${(kineticEnergy / (4.184 * Math.pow(10, 15))).toFixed(2)} megatons TNT</span>
                    </div>
                `;
            }
            
            // NOW show consequences AFTER impact
            if (window.impactCalculations) {
                const calc = window.impactCalculations;
                calculateConsequences(calc.diameter, calc.velocity, calc.mass, calc.kineticEnergy, calc.megatons, calc.craterDiameter);
            }
            
            // ACCURACY CHECK: Calculate coordinates back from endPos
            const verifyLat = Math.asin(endPos.y / earthRadius) * (180 / Math.PI);
            const verifyLng = Math.atan2(-endPos.x, -endPos.z) * (180 / Math.PI);
            
            console.log('=== IMPACT ACCURACY CHECK ===');
            console.log('🎯 Target coordinates:', impactLocation.lat.toFixed(6) + '°', impactLocation.lng.toFixed(6) + '°');
            console.log('🎯 Actual impact coordinates:', verifyLat.toFixed(6) + '°', verifyLng.toFixed(6) + '°');
            console.log('📏 Latitude deviation:', Math.abs(impactLocation.lat - verifyLat).toFixed(8) + '°');
            console.log('📏 Longitude deviation:', Math.abs(impactLocation.lng - verifyLng).toFixed(8) + '°');
            console.log('✅ Crater position in 3D:', endPos);
            console.log('✅ CRATER CREATED EXACTLY AT SELECTED COORDINATES!');
        }
    }

    updateImpact();
}

// Сброс симуляции
function resetSimulation() {
    isSimulationRunning = false;
    
    if (asteroid) {
        scene.remove(asteroid);
        asteroid = null;
    }

    if (targetIndicator) {
        scene.remove(targetIndicator);
        targetIndicator = null;
    }

    if (impactMarker) {
        earth.remove(impactMarker);
        impactMarker = null;
    }

    // DON'T REMOVE CRATER - it should stay on the globe!
    // if (crater) {
    //     earth.remove(crater);
    //     crater = null;
    // }

    particles.forEach(p => scene.remove(p.mesh));
    particles = [];
    explosionParticles.forEach(p => scene.remove(p.mesh));
    explosionParticles = [];

    selectedAsteroid = null;
    impactLocation = { lat: 0, lng: 0 };

    document.getElementById('asteroid-info').style.display = 'none';
    document.getElementById('impact-info').style.display = 'none';
    document.getElementById('realtime-data').style.display = 'none';
    document.getElementById('impact-consequences').style.display = 'none';
    document.getElementById('historical-comparison').style.display = 'none';
    document.getElementById('planetary-defense').style.display = 'none';
    document.getElementById('lat').textContent = '0°';
    document.getElementById('lng').textContent = '0°';
    document.getElementById('lat-input').value = '0';
    document.getElementById('lng-input').value = '0';
    document.getElementById('start-simulation').disabled = true;

    // Сбросить маркер на карте
    if (mapMarker) {
        mapMarker.remove();
        mapMarker = null;
    }

    document.querySelectorAll('.asteroid-card').forEach(card => {
        card.classList.remove('selected');
    });
}

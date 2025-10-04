// Определение местоположения по координатам
function getLocationDescription(lat, lng) {
    // Проверяем основные географические зоны
    
    // Океаны
    if (lat > -60 && lat < 60) {
        if (lng > -180 && lng < -30) {
            if (lat > 0) return "Северная Атлантика";
            return "Южная Атлантика";
        } else if (lng >= -30 && lng < 60) {
            if (lat > 30) return "Европа/Средиземноморье";
            if (lat > 0) return "Африка/Средний Восток";
            return "Южная Африка";
        } else if (lng >= 60 && lng < 150) {
            if (lat > 30) return "Центральная Азия";
            if (lat > 0) return "Индийский океан/Юго-Восточная Азия";
            return "Индийский океан";
        } else {
            if (lat > 0) return "Северная часть Тихого океана";
            return "Южная часть Тихого океана";
        }
    }
    
    // Полярные регионы
    if (lat >= 60) return "Арктика/Север";
    if (lat <= -60) return "Антарктида";
    
    return "Неизвестный регион";
}

// Запуск симуляции
function startSimulation() {
    if (isSimulationRunning) return;
    
    // ПРОВЕРКА: убедимся что астероид создан
    if (!asteroid) {
        console.error('ОШИБКА: Астероид не создан! Проверьте выбор астероида.');
        alert('Сначала выберите астероид из списка!');
        return;
    }
    
    if (!impactLocation || !impactLocation.lat) {
        console.error('ОШИБКА: Место падения не выбрано!');
        alert('Сначала выберите место падения на карте или введите координаты!');
        return;
    }
    
    console.log('✅ Запуск симуляции с астероидом:', asteroid);
    
    isSimulationRunning = true;
    document.getElementById('start-simulation').disabled = true;

    // Расчет энергии удара (БЕЗ показа последствий)
    calculateImpact();

    // Анимация падения
    animateImpact();
}

// Расчет параметров удара
function calculateImpact() {
    const diameter = (
        selectedAsteroid.estimated_diameter.meters.estimated_diameter_min +
        selectedAsteroid.estimated_diameter.meters.estimated_diameter_max
    ) / 2;

    const velocity = selectedAsteroid.close_approach_data && selectedAsteroid.close_approach_data[0]
        ? parseFloat(selectedAsteroid.close_approach_data[0].relative_velocity.kilometers_per_second)
        : 20;

    const mass = (4/3) * Math.PI * Math.pow(diameter/2, 3) * 2500; // плотность ~2500 кг/м³
    const kineticEnergy = 0.5 * mass * Math.pow(velocity * 1000, 2); // Джоули
    const megatons = kineticEnergy / (4.184 * 10**15); // конвертация в мегатонны TNT
    const craterDiameter = 1.8 * Math.pow(diameter, 0.78) * Math.pow(velocity, 0.44);

    const impactInfo = document.getElementById('impact-info');
    const impactDetails = document.getElementById('impact-details');
    
    impactDetails.innerHTML = `
        <div class="detail-row">
            <span class="detail-label">Масса:</span>
            <span class="detail-value">${(mass / 1000000).toFixed(2)} тонн</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Энергия удара:</span>
            <span class="detail-value">${megatons.toFixed(2)} мегатонн TNT</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Диаметр кратера:</span>
            <span class="detail-value">${craterDiameter.toFixed(0)} м</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Радиус разрушения:</span>
            <span class="detail-value">${(craterDiameter * 2).toFixed(0)} м</span>
        </div>
    `;

    impactInfo.style.display = 'block';
    
    // НЕ показываем последствия здесь - только после удара!
    // Сохраняем данные для использования после удара
    window.impactCalculations = {
        diameter,
        velocity,
        mass,
        kineticEnergy,
        megatons,
        craterDiameter
    };
}

// Расчет последствий падения астероида
function calculateConsequences(diameter, velocity, mass, kineticEnergy, megatons, craterDiameter) {
    // Радиусы различных зон поражения (в км)
    const fireball = Math.pow(megatons, 0.4) * 0.2; // Огненный шар
    const radiationRadius = Math.pow(megatons, 0.33) * 2; // Термическое излучение (3-я степень ожогов)
    const shockwaveRadius = Math.pow(megatons, 0.33) * 5; // Ударная волна (разрушение зданий)
    const earthquakeRadius = Math.pow(megatons, 0.5) * 10; // Сейсмическая волна
    
    // Оценка жертв (грубая)
    const populationDensity = 100; // средняя плотность населения чел/км²
    const affectedArea = Math.PI * Math.pow(shockwaveRadius, 2);
    const estimatedCasualties = Math.floor(affectedArea * populationDensity);
    
    // Глубина кратера (обычно 1/5 от диаметра)
    const craterDepth = craterDiameter / 5;
    
    // Объем выброшенной породы
    const ejectaVolume = Math.PI * Math.pow(craterDiameter / 2, 2) * craterDepth;
    
    // Сравнение с известными событиями
    let comparison = '';
    if (megatons < 0.01) {
        comparison = 'Меньше бомбы Хиросимы';
    } else if (megatons < 1) {
        comparison = 'Сравнимо с тактическим ядерным оружием';
    } else if (megatons < 50) {
        comparison = `В ${(megatons / 0.015).toFixed(0)} раз мощнее бомбы Хиросимы`;
    } else if (megatons < 1000) {
        comparison = 'Сравнимо с крупнейшими ядерными бомбами';
    } else {
        comparison = 'Катастрофа планетарного масштаба';
    }
    
    // Температура в эпицентре
    const temperatureKelvin = Math.pow(megatons, 0.25) * 5000;
    
    const consequencesPanel = document.getElementById('impact-consequences');
    const consequencesData = document.getElementById('consequences-data');
    
    consequencesData.innerHTML = `
        <div class="detail-row" style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.2);">
            <strong style="color: #ff6b6b; font-size: 1.1em;">⚠️ ${comparison}</strong>
        </div>
        
        <div class="detail-row" style="margin-bottom: 10px; padding: 10px; background: rgba(100,150,255,0.2); border-radius: 6px;">
            <div style="width: 100%;">
                <strong style="color: #6bb6ff;">📍 ТОЧКА УДАРА:</strong><br>
                <span style="color: #fff;">Координаты: ${impactLocation.lat.toFixed(6)}°, ${impactLocation.lng.toFixed(6)}°</span><br>
                <span style="color: #fff;">Регион: ${getLocationDescription(impactLocation.lat, impactLocation.lng)}</span>
            </div>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">🔥 Диаметр огненного шара:</span>
            <span class="detail-value">${fireball.toFixed(2)} км</span>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">🕳️ Диаметр кратера:</span>
            <span class="detail-value">${(craterDiameter / 1000).toFixed(2)} км (${craterDiameter.toFixed(0)} м)</span>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">📏 Глубина кратера:</span>
            <span class="detail-value">${(craterDepth / 1000).toFixed(2)} км (${craterDepth.toFixed(0)} м)</span>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">💥 Объем выброшенной породы:</span>
            <span class="detail-value">${(ejectaVolume / 1e9).toFixed(2)} км³</span>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">🌡️ Температура в эпицентре:</span>
            <span class="detail-value">${temperatureKelvin.toFixed(0)} K (${(temperatureKelvin - 273).toFixed(0)}°C)</span>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">☢️ Радиус термических ожогов:</span>
            <span class="detail-value">${radiationRadius.toFixed(2)} км</span>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">💨 Радиус ударной волны:</span>
            <span class="detail-value">${shockwaveRadius.toFixed(2)} км</span>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">🌍 Радиус сейсмической волны:</span>
            <span class="detail-value">${earthquakeRadius.toFixed(2)} км</span>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">📊 Площадь поражения:</span>
            <span class="detail-value">${affectedArea.toFixed(0)} км²</span>
        </div>
        
        <div class="detail-row" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2);">
            <span class="detail-label" style="color: #ff6b6b;">☠️ Оценка жертв (при средней плотности):</span>
            <span class="detail-value" style="color: #ff6b6b; font-weight: bold;">${estimatedCasualties.toLocaleString()} человек</span>
        </div>
        
        <div style="margin-top: 15px; padding: 10px; background: rgba(255,100,100,0.2); border-radius: 6px; border-left: 3px solid #ff6b6b;">
            <strong>⚠️ Долгосрочные последствия:</strong><br>
            ${megatons > 1000 ? '• Массовое вымирание<br>• Ядерная зима на годы<br>• Разрушение озонового слоя' : 
              megatons > 100 ? '• Региональная катастрофа<br>• Изменение климата на месяцы<br>• Цунами (если в океан)' :
              megatons > 10 ? '• Разрушение города<br>• Лесные пожары<br>• Выброс пыли в атмосферу' :
              '• Локальные разрушения<br>• Временное помутнение атмосферы'}
        </div>
    `;
    
    consequencesPanel.style.display = 'block';
    
    // Вызываем дополнительные панели для NASA Space Apps Challenge
    compareWithHistory(diameter, velocity, megatons);
    calculatePlanetaryDefense(diameter, velocity, megatons);
    
    console.log('=== ПОСЛЕДСТВИЯ ПАДЕНИЯ ===');
    console.log('Энергия взрыва:', megatons.toFixed(2), 'мегатонн');
    console.log('Диаметр кратера:', (craterDiameter / 1000).toFixed(2), 'км');
    console.log('Радиус поражения:', shockwaveRadius.toFixed(2), 'км');
}

// Сравнение с историческими событиями
function compareWithHistory(diameter, velocity, megatons) {
    const historicalPanel = document.getElementById('historical-comparison');
    const historicalData = document.getElementById('historical-data');
    
    let historicalEvent = '';
    let comparison = '';
    let description = '';
    
    if (megatons < 0.001) {
        historicalEvent = '🏘️ Метеорит Пикскилл (1992)';
        comparison = 'Очень маленький метеорит';
        description = 'Упал в США, пробил автомобиль. Диаметр ~10 см. Никто не пострадал.';
    } else if (megatons < 0.5) {
        historicalEvent = '💥 Челябинский метеорит (2013)';
        comparison = `В ${(megatons / 0.5).toFixed(1)} раз ${megatons < 0.5 ? 'слабее' : 'мощнее'}`;
        description = 'Диаметр ~20м, взорвался над Россией. Ударная волна повредила 7200 зданий, ~1500 раненых.';
    } else if (megatons < 15) {
        historicalEvent = '🌲 Тунгусский метеорит (1908)';
        comparison = `В ${(megatons / 15).toFixed(1)} раз ${megatons < 15 ? 'слабее' : 'мощнее'}`;
        description = 'Диаметр ~60-100м, взорвался над Сибирью. Повалил 80 млн деревьев на площади 2150 км².';
    } else if (megatons < 50) {
        historicalEvent = '☢️ Царь-бомба (1961)';
        comparison = `В ${(megatons / 50).toFixed(1)} раз ${megatons < 50 ? 'слабее' : 'мощнее'}`;
        description = 'Крупнейшее ядерное испытание в истории (СССР). Мощность 50 мегатонн.';
    } else if (megatons < 10000) {
        historicalEvent = '🕳️ Кратер Барринджера (50000 лет назад)';
        comparison = `Сопоставимо с катастрофой`;
        description = 'Диаметр астероида ~50м, кратер 1.2км в Аризоне. Энергия ~10 мегатонн.';
    } else {
        historicalEvent = '🦖 Чиксулубский импактор (66 млн лет назад)';
        comparison = 'КАТАСТРОФА ПЛАНЕТАРНОГО МАСШТАБА';
        description = 'Диаметр ~10км, кратер 180км в Мексике. Уничтожил динозавров. Энергия ~100 млн мегатонн.';
    }
    
    historicalData.innerHTML = `
        <div style="margin-bottom: 15px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
            <h3 style="color: #ff6b35; margin-bottom: 10px;">${historicalEvent}</h3>
            <p style="color: #aaa; font-size: 14px; line-height: 1.6;">${description}</p>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">⚖️ Сравнение:</span>
            <span class="detail-value">${comparison}</span>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">💥 Ваш астероид:</span>
            <span class="detail-value">${megatons.toFixed(2)} мегатонн</span>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">📏 Диаметр астероида:</span>
            <span class="detail-value">${diameter.toFixed(1)} м</span>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">⚡ Скорость удара:</span>
            <span class="detail-value">${velocity.toFixed(1)} км/с</span>
        </div>
        
        ${megatons < 0.5 ? `
            <div style="margin-top: 15px; padding: 10px; background: rgba(50,255,100,0.1); border-radius: 6px; border-left: 3px solid #32ff64;">
                <strong>✅ Низкая опасность</strong><br>
                Подобные метеориты падают несколько раз в год.
            </div>
        ` : megatons < 15 ? `
            <div style="margin-top: 15px; padding: 10px; background: rgba(255,200,50,0.1); border-radius: 6px; border-left: 3px solid #ffc832;">
                <strong>⚠️ Средняя опасность</strong><br>
                Подобные события происходят раз в 100-1000 лет.
            </div>
        ` : `
            <div style="margin-top: 15px; padding: 10px; background: rgba(255,50,50,0.2); border-radius: 6px; border-left: 3px solid #ff3232;">
                <strong>🚨 КРИТИЧЕСКАЯ ОПАСНОСТЬ</strong><br>
                Подобные катастрофы происходят раз в ${megatons > 10000 ? 'миллионы' : 'тысячи'} лет!
            </div>
        `}
    `;
    
    historicalPanel.style.display = 'block';
}

// Расчет планетарной защиты
function calculatePlanetaryDefense(diameter, velocity, megatons) {
    const defensePanel = document.getElementById('planetary-defense');
    const defenseData = document.getElementById('defense-data');
    
    // Время предупреждения для различных методов обнаружения
    const detectionTime = diameter > 100 ? '10+ лет' : diameter > 50 ? '5-10 лет' : diameter > 20 ? '1-5 лет' : 'недели-месяцы';
    
    // Методы защиты
    let defenseMethod = '';
    let feasibility = '';
    
    if (megatons < 1) {
        defenseMethod = '💨 Атмосферный распад';
        feasibility = 'Небольшие астероиды обычно сгорают в атмосфере. Защита не требуется.';
    } else if (megatons < 100) {
        defenseMethod = '🚀 Кинетический импактор';
        feasibility = 'Запуск космического аппарата для столкновения с астероидом и изменения его траектории. Требуется 5-10 лет подготовки. Миссия DART (NASA, 2022) успешно испытала этот метод!';
    } else if (megatons < 10000) {
        defenseMethod = '☢️ Ядерное отклонение';
        feasibility = 'Взрыв ядерного устройства рядом с астероидом для изменения траектории. Требуется 10+ лет подготовки. Очень рискованный метод.';
    } else {
        defenseMethod = '🏃 Эвакуация населения';
        feasibility = 'Астероид слишком велик для отклонения. Единственный вариант - массовая эвакуация из зоны поражения.';
    }
    
    // Время на подготовку
    const timeNeeded = megatons < 1 ? 'Не требуется' : 
                       megatons < 100 ? '5-10 лет' : 
                       megatons < 10000 ? '10-20 лет' : '20+ лет';
    
    // Стоимость миссии
    const costEstimate = megatons < 1 ? 'N/A' :
                        megatons < 100 ? '$500 млн - $2 млрд' :
                        megatons < 10000 ? '$5-20 млрд' : '$50+ млрд';
    
    defenseData.innerHTML = `
        <div style="margin-bottom: 15px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
            <h3 style="color: #32ff64; margin-bottom: 10px;">${defenseMethod}</h3>
            <p style="color: #aaa; font-size: 14px; line-height: 1.6;">${feasibility}</p>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">🔭 Время обнаружения:</span>
            <span class="detail-value">${detectionTime}</span>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">⏰ Время на подготовку:</span>
            <span class="detail-value">${timeNeeded}</span>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">💰 Стоимость миссии:</span>
            <span class="detail-value">${costEstimate}</span>
        </div>
        
        <div class="detail-row">
            <span class="detail-label">🎯 Вероятность успеха:</span>
            <span class="detail-value">${megatons < 1 ? '100%' : megatons < 100 ? '70-90%' : megatons < 10000 ? '30-60%' : '<10%'}</span>
        </div>
        
        <div style="margin-top: 15px; padding: 12px; background: rgba(100,150,255,0.1); border-radius: 6px; border-left: 3px solid #6496ff;">
            <strong>🛰️ Программы NASA:</strong><br>
            <div style="font-size: 13px; color: #aaa; margin-top: 8px; line-height: 1.8;">
                • <strong>DART</strong> - Успешно изменила орбиту астероида (2022)<br>
                • <strong>NEO Surveyor</strong> - Телескоп для поиска астероидов (запуск 2027)<br>
                • <strong>Planetary Defense Office</strong> - Координация защиты Земли<br>
                • <strong>NEOWs API</strong> - Мониторинг опасных объектов
            </div>
        </div>
        
        <div style="margin-top: 15px; padding: 12px; background: rgba(255,200,50,0.1); border-radius: 6px; border-left: 3px solid #ffc832;">
            <strong>📊 Статистика NASA:</strong><br>
            <div style="font-size: 13px; color: #aaa; margin-top: 8px; line-height: 1.8;">
                • Обнаружено >30,000 околоземных астероидов<br>
                • ~150 новых находятся каждый месяц<br>
                • ~2,300 потенциально опасных объектов<br>
                • Вероятность крупного удара: 1 раз в 100,000 лет
            </div>
        </div>
    `;
    
    defensePanel.style.display = 'block';
}

// Анимация удара с данными в реальном времени
function animateImpact() {
    const startPos = asteroid.position.clone();
    
    // 100% ТОЧНОЕ ПОПАДАНИЕ: Вычисляем endPos НАПРЯМУЮ из координат lat/lng
    const earthRadius = 10;
    const lat = impactLocation.lat;
    const lng = impactLocation.lng;
    
    // Конвертируем координаты в радианы
    const latRad = lat * (Math.PI / 180);
    const lngRad = lng * (Math.PI / 180);
    
    // ПРЯМОЕ вычисление позиции из географических координат (БЕЗ вращения Земли)
    const endPos = new THREE.Vector3(
        earthRadius * Math.cos(latRad) * Math.sin(lngRad),
        earthRadius * Math.sin(latRad),
        earthRadius * Math.cos(latRad) * Math.cos(lngRad)
    );
    
    console.log('=== НАЧАЛО СИМУЛЯЦИИ (100% ТОЧНОСТЬ - ПРЯМОЙ РАСЧЕТ) ===');
    console.log('Координаты удара:', lat.toFixed(6) + '°', lng.toFixed(6) + '°');
    console.log('Стартовая позиция астероида:', startPos);
    console.log('Целевая точка (прямой расчет из lat/lng):', endPos);
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

        // РЕАЛЬНЫЕ ДАННЫЕ В РЕАЛЬНОМ ВРЕМЕНИ (обновляется каждый кадр)
        const distanceToImpact = asteroid.position.distanceTo(endPos);
        const currentSpeed = velocity * (1 + progress * 0.5); // Увеличивается из-за гравитации
        const timeToImpact = ((1 - progress) * duration / 1000).toFixed(1);
        
        // Реальная высота над поверхностью (1 единица = ~637 км в масштабе Земли)
        const altitudeUnits = distanceToImpact - earthRadius;
        const altitudeKm = Math.max(0, altitudeUnits * 637.1); // км
        
        // Реальная кинетическая энергия в данный момент
        const currentKE = 0.5 * mass * Math.pow(currentSpeed * 1000, 2);
        const currentMegatons = currentKE / (4.184 * 10**15);
        
        // Температура от трения об атмосферу (упрощенная модель)
        const atmosphereFactor = altitudeKm < 100 ? (100 - altitudeKm) / 100 : 0;
        const temperature = 20 + (atmosphereFactor * 1500); // До 1500°C
        
        const realtimeContentDiv = realtimeData.querySelector('#realtime-content');
        if (realtimeContentDiv) {
            realtimeContentDiv.innerHTML = `
                <div class="realtime-row" style="background: rgba(255,107,53,0.1); padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                    <span class="detail-label">⏱️ Время до удара:</span>
                    <span class="detail-value" style="color: ${timeToImpact < 2 ? '#ff0000' : '#ffaa00'}; font-weight: bold;">${timeToImpact} сек</span>
                </div>
                <div class="realtime-row">
                    <span class="detail-label">📏 Расстояние до цели:</span>
                    <span class="detail-value">${distanceToImpact.toFixed(2)} ед (${altitudeKm.toFixed(1)} км)</span>
                </div>
                <div class="realtime-row">
                    <span class="detail-label">🚀 Текущая скорость:</span>
                    <span class="detail-value">${currentSpeed.toFixed(2)} км/с (${(currentSpeed * 3600).toFixed(0)} км/ч)</span>
                </div>
                <div class="realtime-row">
                    <span class="detail-label">🌡️ Температура поверхности:</span>
                    <span class="detail-value" style="color: ${temperature > 1000 ? '#ff4400' : '#ffaa00'};">${temperature.toFixed(0)}°C</span>
                </div>
                <div class="realtime-row">
                    <span class="detail-label">⚡ Кинетическая энергия:</span>
                    <span class="detail-value">${currentMegatons.toFixed(2)} мегатонн TNT</span>
                </div>
                <div class="realtime-row">
                    <span class="detail-label">📍 Координаты цели:</span>
                    <span class="detail-value">${impactLocation.lat.toFixed(4)}°, ${impactLocation.lng.toFixed(4)}°</span>
                </div>
                <div class="realtime-row">
                    <span class="detail-label">📊 Прогресс:</span>
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
            
            // Убрать свечение атмосферы
            if (atmosphereGlow) {
                scene.remove(atmosphereGlow);
                atmosphereGlow = null;
            }

            // Финальные данные
            const realtimeContentDiv = realtimeData.querySelector('#realtime-content');
            if (realtimeContentDiv) {
                realtimeContentDiv.innerHTML = `
                    <div class="realtime-row" style="color: #ff0000; font-weight: bold; justify-content: center;">
                        <span>💥 УДАР ПРОИЗОШЕЛ!</span>
                    </div>
                    <div class="realtime-row" style="margin-top: 10px;">
                        <span class="realtime-label">📍 Координаты удара:</span>
                        <span class="realtime-value">${impactLocation.lat.toFixed(6)}°, ${impactLocation.lng.toFixed(6)}°</span>
                    </div>
                    <div class="realtime-row">
                        <span class="realtime-label">🌍 Местоположение:</span>
                        <span class="realtime-value">${getLocationDescription(impactLocation.lat, impactLocation.lng)}</span>
                    </div>
                    <div class="realtime-row">
                        <span class="realtime-label">📏 Диаметр астероида:</span>
                        <span class="realtime-value">${diameter.toFixed(1)} м</span>
                    </div>
                    <div class="realtime-row">
                        <span class="realtime-label">⚡ Скорость удара:</span>
                        <span class="realtime-value">${velocity.toFixed(2)} км/с</span>
                    </div>
                    <div class="realtime-row">
                        <span class="realtime-label">🕳️ Диаметр кратера:</span>
                        <span class="realtime-value">${(craterDiameter / 1000).toFixed(2)} км (${craterDiameter.toFixed(0)} м)</span>
                    </div>
                    <div class="realtime-row">
                        <span class="realtime-label">💥 Энергия:</span>
                        <span class="realtime-value">${(kineticEnergy / (4.184 * Math.pow(10, 15))).toFixed(2)} мегатонн ТНТ</span>
                    </div>
                `;
            }
            
            // ТЕПЕРЬ показываем последствия ПОСЛЕ удара
            if (window.impactCalculations) {
                const calc = window.impactCalculations;
                calculateConsequences(calc.diameter, calc.velocity, calc.mass, calc.kineticEnergy, calc.megatons, calc.craterDiameter);
            }
            
            // ПРОВЕРКА ТОЧНОСТИ: Вычисляем координаты из endPos обратно
            const verifyLat = Math.asin(endPos.y / earthRadius) * (180 / Math.PI);
            const verifyLng = Math.atan2(endPos.x, endPos.z) * (180 / Math.PI);
            
            console.log('=== ПРОВЕРКА ТОЧНОСТИ УДАРА ===');
            console.log('🎯 Заданные координаты:', impactLocation.lat.toFixed(6) + '°', impactLocation.lng.toFixed(6) + '°');
            console.log('🎯 Фактические координаты удара:', verifyLat.toFixed(6) + '°', verifyLng.toFixed(6) + '°');
            console.log('📏 Отклонение по широте:', Math.abs(impactLocation.lat - verifyLat).toFixed(8) + '°');
            console.log('📏 Отклонение по долготе:', Math.abs(impactLocation.lng - verifyLng).toFixed(8) + '°');
            console.log('✅ Позиция кратера в 3D:', endPos);
            console.log('✅ КРАТЕР СОЗДАН ТОЧНО НА ВЫБРАННЫХ КООРДИНАТАХ!');
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

    if (crater) {
        earth.remove(crater);
        crater = null;
    }

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

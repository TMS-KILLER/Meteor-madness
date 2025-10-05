// ===================================
// MOBILE ADAPTATION - Enhanced Version
// Touch events and optimization for mobile devices
// ===================================

// Определение мобильного устройства
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
}

// Определение размера экрана
function getScreenSize() {
    const width = window.innerWidth;
    if (width < 360) return 'xxs'; // Very small phones
    if (width < 480) return 'xs';  // Small phones
    if (width < 768) return 'sm';  // Large phones
    if (width < 1024) return 'md'; // Tablets
    return 'lg'; // Desktop
}

// Определение типа устройства
function getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        return 'mobile';
    }
    return 'desktop';
}

// Инициализация мобильных функций
function initMobile() {
    const isMobile = isMobileDevice();
    const deviceType = getDeviceType();
    const screenSize = getScreenSize();
    const isLandscape = window.innerWidth > window.innerHeight;
    
    console.log(`📱 Device: ${deviceType} (${isMobile ? 'Mobile' : 'Desktop'}), Screen: ${screenSize}, Orientation: ${isLandscape ? 'Landscape' : 'Portrait'}`);
    
    if (isMobile) {
        document.body.classList.add('mobile-device', `device-${deviceType}`, `screen-${screenSize}`);
        
        // Настройка сворачивающейся панели
        setupPanelToggle();
        
        // Предотвращаем двойное нажатие для zoom на iOS
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        // Предотвращаем pull-to-refresh на мобильных
        let startY = 0;
        document.body.addEventListener('touchstart', function(e) {
            startY = e.touches[0].pageY;
        }, { passive: true });
        
        document.body.addEventListener('touchmove', function(e) {
            const y = e.touches[0].pageY;
            // Разрешаем скролл только внутри панели
            if (e.target.closest('#left-panel')) {
                return;
            }
            // Предотвращаем pull-to-refresh
            if (y > startY && window.pageYOffset === 0) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Оптимизация производительности для мобильных
        optimizeForMobile();
        
        // Показываем подсказку при первой загрузке
        showWelcomeHint();
    }
    
    // Адаптация при изменении ориентации
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', debounce(handleResize, 250));
}

// Настройка сворачивающейся панели для мобильных
function setupPanelToggle() {
    const panelToggle = document.getElementById('panel-toggle');
    const uiContainer = document.getElementById('ui-container');
    
    if (!panelToggle || !uiContainer) {
        console.warn('⚠️ Panel toggle elements not found');
        return;
    }
    
    console.log('🎛️ Setting up panel toggle...');
    
    // Начинаем со свернутой панели на мобильных
    const isMobile = isMobileDevice();
    const isLandscape = window.innerWidth > window.innerHeight;
    
    if (isMobile) {
        // На мобильных всегда начинаем свёрнутыми
        uiContainer.classList.remove('expanded');
    }
    
    // Функция переключения панели
    function togglePanel() {
        const isExpanded = uiContainer.classList.toggle('expanded');
        
        if (isExpanded) {
            panelToggle.setAttribute('aria-label', 'Свайп вниз для закрытия');
            vibrate(15);
            console.log('📖 Panel expanded');
            
            // Прокручиваем панель наверх при открытии
            const leftPanel = document.getElementById('left-panel');
            if (leftPanel) {
                leftPanel.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } else {
            panelToggle.setAttribute('aria-label', 'Свайп вверх для панели управления');
            vibrate(10);
            console.log('📕 Panel collapsed');
        }
        
        // Обновляем размеры canvas и карт после анимации
        setTimeout(() => {
            handleResize();
        }, 350);
    }
    
    // Обработчик клика на индикатор
    panelToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        togglePanel();
    });
    
    // NASA Eyes Style - Улучшенные свайп жесты
    let touchStartY = 0;
    let touchEndY = 0;
    let touchStartX = 0;
    let isDragging = false;
    const SWIPE_THRESHOLD = 50; // Минимальная дистанция свайпа
    
    uiContainer.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
        isDragging = true;
    }, { passive: true });
    
    uiContainer.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        touchEndY = e.touches[0].clientY;
        
        // Визуальная обратная связь при свайпе
        const diff = touchStartY - touchEndY;
        if (Math.abs(diff) > 10 && !uiContainer.classList.contains('expanded')) {
            uiContainer.style.transform = `translateY(calc(100% - ${Math.max(0, -diff)}px))`;
        }
    }, { passive: true });
    
    uiContainer.addEventListener('touchend', function(e) {
        if (!isDragging) return;
        isDragging = false;
        
        // Сбрасываем трансформ
        uiContainer.style.transform = '';
        
        const swipeDistance = touchStartY - touchEndY;
        const horizontalDistance = Math.abs(e.changedTouches[0].clientX - touchStartX);
        
        // Игнорируем, если слишком много горизонтального движения
        if (horizontalDistance > 30) return;
        
        // Свайп вверх (открыть)
        if (swipeDistance > SWIPE_THRESHOLD) {
            if (!uiContainer.classList.contains('expanded')) {
                togglePanel();
            }
        }
        // Свайп вниз (закрыть)
        else if (swipeDistance < -SWIPE_THRESHOLD) {
            if (uiContainer.classList.contains('expanded')) {
                // Проверяем, что панель прокручена наверх
                const leftPanel = document.getElementById('left-panel');
                if (leftPanel && leftPanel.scrollTop < 10) {
                    togglePanel();
                }
            }
        }
    }, { passive: true });
    
    // Закрываем панель при клике на canvas (только portrait mobile)
    const canvasContainer = document.getElementById('canvas-container');
    if (canvasContainer && isMobile) {
        let tapTimeout = null;
        
        canvasContainer.addEventListener('click', function(e) {
            // Проверяем что клик не на UI элементах
            if (e.target.closest('#ui-container')) return;
            
            const isPortrait = window.innerHeight > window.innerWidth;
            
            if (isPortrait && uiContainer.classList.contains('expanded')) {
                clearTimeout(tapTimeout);
                tapTimeout = setTimeout(() => {
                    uiContainer.classList.remove('expanded');
                    panelToggle.setAttribute('aria-label', 'Развернуть панель');
                    vibrate(10);
                    console.log('📕 Panel auto-collapsed (tap on canvas)');
                }, 100);
            }
        });
    }
    
    console.log('✅ Panel toggle configured');
}

// Оптимизация для мобильных устройств
function optimizeForMobile() {
    console.log('⚡ Optimizing for mobile...');
    
    const screenSize = getScreenSize();
    const deviceType = getDeviceType();
    
    // Уменьшаем качество рендеринга на слабых устройствах
    if (renderer) {
        const pixelRatio = deviceType === 'mobile' && screenSize === 'xxs' ? 1 : Math.min(window.devicePixelRatio, 2);
        renderer.setPixelRatio(pixelRatio);
        console.log('  • Pixel ratio set to:', pixelRatio);
    }
    
    // Уменьшаем количество частиц для мобильных
    if (screenSize === 'xxs' || screenSize === 'xs') {
        window.MOBILE_PARTICLE_REDUCTION = 0.3; // 30% от обычного
    } else if (screenSize === 'sm') {
        window.MOBILE_PARTICLE_REDUCTION = 0.5; // 50% от обычного
    } else {
        window.MOBILE_PARTICLE_REDUCTION = 0.7; // 70% от обычного
    }
    console.log('  • Particle reduction:', window.MOBILE_PARTICLE_REDUCTION);
    
    // Отключаем тени на слабых устройствах
    const isLowEnd = screenSize === 'xxs' || screenSize === 'xs';
    if (isLowEnd && renderer) {
        renderer.shadowMap.enabled = false;
        console.log('  • Shadows disabled for performance');
    }
    
    // Оптимизация антиалиасинга
    if (renderer && isLowEnd) {
        renderer.antialias = false;
        console.log('  • Antialiasing disabled for performance');
    }
    
    console.log('✅ Mobile optimization complete');
}

// Обработка изменения ориентации
function handleOrientationChange() {
    setTimeout(() => {
        const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
        const screenSize = getScreenSize();
        console.log(`🔄 Orientation changed to: ${orientation} (${screenSize})`);
        
        // Обновляем размеры через handleResize
        handleResize();
        
        // Адаптируем UI под ориентацию
        const uiContainer = document.getElementById('ui-container');
        const panelToggle = document.getElementById('panel-toggle');
        
        if (uiContainer && panelToggle && isMobileDevice()) {
            // В landscape на маленьких экранах лучше закрыть панель
            if (orientation === 'landscape' && screenSize !== 'md' && screenSize !== 'lg') {
                uiContainer.classList.remove('expanded');
            }
        }
        
        // Показываем подсказку по ориентации
        if (screenSize === 'xxs' || screenSize === 'xs' || screenSize === 'sm') {
            showOrientationHint(orientation);
        }
    }, 300);
}

// Обработка изменения размера окна
function handleResize() {
    if (!window.camera || !window.renderer) return;
    
    const container = document.getElementById('canvas-container');
    if (!container) return;
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Обновляем камеру
    window.camera.aspect = width / height;
    window.camera.updateProjectionMatrix();
    
    // Обновляем рендерер
    window.renderer.setSize(width, height);
    
    // Обновляем карты
    setTimeout(() => {
        if (window.map) {
            window.map.invalidateSize();
        }
        if (window.mapFullscreen) {
            window.mapFullscreen.invalidateSize();
        }
    }, 100);
    
    console.log(`📐 Resized: ${width}x${height}`);
}

// Подсказка по ориентации экрана
function showOrientationHint(orientation) {
    const screenSize = getScreenSize();
    
    if (screenSize === 'xxs' || screenSize === 'xs' || screenSize === 'sm') {
        // Удаляем старую подсказку
        const oldHint = document.getElementById('orientation-hint');
        if (oldHint) oldHint.remove();
        
        const hint = document.createElement('div');
        hint.id = 'orientation-hint';
        hint.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, rgba(255, 107, 53, 0.95), rgba(255, 69, 0, 0.95));
            color: white;
            padding: 12px 24px;
            border-radius: 24px;
            font-size: 14px;
            font-weight: 600;
            z-index: 10000;
            animation: fadeInOut 3.5s ease;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            max-width: 80%;
            text-align: center;
        `;
        
        if (orientation === 'portrait') {
            hint.innerHTML = '� Поверните устройство горизонтально<br>для лучшего просмотра';
        } else {
            hint.innerHTML = '✓ Ландшафтный режим - оптимально!';
        }
        
        document.body.appendChild(hint);
        
        setTimeout(() => {
            hint.style.opacity = '0';
            hint.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => hint.remove(), 1000);
        }, 2500);
    }
}

// Добавляем CSS для анимации
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
        20% { opacity: 1; transform: translateX(-50%) translateY(0); }
        80% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
    
    .mobile-device .btn-primary,
    .mobile-device .btn-secondary,
    .mobile-device .btn-visualization {
        -webkit-tap-highlight-color: rgba(255, 107, 53, 0.3);
        touch-action: manipulation;
    }
    
    .mobile-device #canvas-container {
        touch-action: pan-x pan-y;
    }
`;
document.head.appendChild(style);

// Touch-friendly controls для OrbitControls
function enhanceTouchControls() {
    if (controls && isMobileDevice()) {
        const screenSize = getScreenSize();
        
        // Настраиваем для touch
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        
        // Адаптивная скорость в зависимости от размера экрана
        if (screenSize === 'xxs' || screenSize === 'xs') {
            controls.rotateSpeed = 0.4;
            controls.zoomSpeed = 1.0;
            controls.panSpeed = 0.6;
        } else {
            controls.rotateSpeed = 0.5;
            controls.zoomSpeed = 1.2;
            controls.panSpeed = 0.8;
        }
        
        // Ограничения для более удобного управления на мобильных
        controls.minDistance = 15;
        controls.maxDistance = 100;
        controls.enablePan = false; // Отключаем pan на мобильных для упрощения
        
        // Ограничение вертикального вращения
        controls.minPolarAngle = Math.PI / 6; // 30 градусов от верха
        controls.maxPolarAngle = Math.PI * 0.75; // 135 градусов
        
        console.log('✅ Touch controls enhanced for', screenSize);
    }
}

// Улучшение интерфейса для мобильных
function enhanceMobileUI() {
    const screenSize = getScreenSize();
    
    if (screenSize === 'xxs' || screenSize === 'xs' || screenSize === 'sm') {
        // Добавляем кнопку "наверх" для длинных панелей
        const backToTop = document.createElement('button');
        backToTop.id = 'back-to-top';
        backToTop.innerHTML = '↑';
        backToTop.style.cssText = `
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 54px;
            height: 54px;
            border-radius: 27px;
            background: linear-gradient(135deg, rgba(255, 107, 53, 0.95), rgba(255, 69, 0, 0.95));
            border: 2px solid rgba(255, 255, 255, 0.3);
            color: white;
            font-size: 26px;
            font-weight: bold;
            cursor: pointer;
            z-index: 1000;
            display: none;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
            touch-action: manipulation;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(backToTop);
        
        // Показываем кнопку при прокрутке
        const leftPanel = document.getElementById('left-panel');
        if (leftPanel) {
            leftPanel.addEventListener('scroll', () => {
                const uiContainer = document.getElementById('ui-container');
                if (leftPanel.scrollTop > 150 && uiContainer.classList.contains('expanded')) {
                    backToTop.style.display = 'flex';
                    backToTop.style.alignItems = 'center';
                    backToTop.style.justifyContent = 'center';
                } else {
                    backToTop.style.display = 'none';
                }
            });
            
            backToTop.addEventListener('click', () => {
                leftPanel.scrollTo({ top: 0, behavior: 'smooth' });
                vibrate(15);
            });
        }
    }
    
    console.log('✅ Mobile UI enhancements applied');
}

// Виброотклик для мобильных (если поддерживается)
function vibrate(duration = 10) {
    if ('vibrate' in navigator && isMobileDevice()) {
        try {
            navigator.vibrate(duration);
        } catch (e) {
            // Игнорируем ошибки вибрации
        }
    }
}

// Добавляем виброотклик к важным действиям
function addVibrationFeedback() {
    if (!isMobileDevice()) return;
    
    // При запуске симуляции
    const startBtn = document.getElementById('start-simulation');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            vibrate([25, 40, 25]); // Паттерн вибрации
        });
    }
    
    // При сбросе
    const resetBtn = document.getElementById('reset-simulation');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            vibrate(20);
        });
    }
    
    // При выборе астероида
    const asteroidSelect = document.getElementById('asteroid-select');
    if (asteroidSelect) {
        asteroidSelect.addEventListener('change', () => {
            vibrate(12);
        });
    }
    
    // При установке координат
    const setCoordBtn = document.getElementById('set-coordinates');
    if (setCoordBtn) {
        setCoordBtn.addEventListener('click', () => {
            vibrate(15);
        });
    }
    
    console.log('✅ Vibration feedback configured');
}

// Debounce функция для оптимизации
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Приветственная подсказка при первой загрузке
function showWelcomeHint() {
    // Проверяем, показывали ли уже подсказку
    if (localStorage.getItem('welcomeShown')) return;
    
    setTimeout(() => {
        const hint = document.createElement('div');
        hint.style.cssText = `position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, rgba(255, 107, 53, 0.95), rgba(255, 69, 0, 0.95)); color: white; padding: 16px 28px; border-radius: 28px; font-size: 15px; font-weight: 600; z-index: 10001; animation: fadeInOut 4s ease; box-shadow: 0 6px 24px rgba(0,0,0,0.5); backdrop-filter: blur(10px); border: 2px solid rgba(255,255,255,0.3); max-width: 85%; text-align: center; line-height: 1.4;`;
        hint.innerHTML = '👆 Tap the arrow below<br>to open the control panel';
        document.body.appendChild(hint);
        setTimeout(() => { hint.style.opacity = '0'; hint.style.transform = 'translateX(-50%) translateY(-20px)'; setTimeout(() => hint.remove(), 1000); }, 3000);
        localStorage.setItem('welcomeShown', 'true');
    }, 1500);
}

// Инициализация при загрузке
window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing mobile adaptations...');
    initMobile();
    
    // Ждем инициализации Three.js компонентов
    setTimeout(() => {
        enhanceTouchControls();
        enhanceMobileUI();
        addVibrationFeedback();
        console.log('✅ All mobile features initialized');
    }, 1000);
});

// Экспорт функций для использования в других модулях
window.isMobileDevice = isMobileDevice;
window.getScreenSize = getScreenSize;
window.getDeviceType = getDeviceType;
window.vibrate = vibrate;
window.handleResize = handleResize;

console.log('📱 Mobile module loaded successfully');

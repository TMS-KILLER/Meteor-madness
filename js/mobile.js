// Мобильная адаптация и touch события

// Определение мобильного устройства
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Определение размера экрана
function getScreenSize() {
    const width = window.innerWidth;
    if (width < 480) return 'xs';
    if (width < 768) return 'sm';
    if (width < 1024) return 'md';
    return 'lg';
}

// Инициализация мобильных функций
function initMobile() {
    const isMobile = isMobileDevice();
    const screenSize = getScreenSize();
    
    console.log(`📱 Device: ${isMobile ? 'Mobile' : 'Desktop'}, Screen: ${screenSize}`);
    
    if (isMobile) {
        document.body.classList.add('mobile-device');
        
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
        document.body.addEventListener('touchmove', function(e) {
            if (e.target.closest('#canvas-container')) {
                // Разрешаем прокрутку внутри canvas для управления камерой
                return;
            }
        }, { passive: true });
        
        // Оптимизация производительности для мобильных
        optimizeForMobile();
    }
    
    // Адаптация при изменении ориентации
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleResize);
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
    
    if (isMobile && !isLandscape) {
        uiContainer.classList.remove('expanded');
    } else if (isMobile && isLandscape) {
        uiContainer.classList.remove('expanded');
    }
    
    // Функция переключения панели
    function togglePanel() {
        const isExpanded = uiContainer.classList.toggle('expanded');
        
        if (isExpanded) {
            panelToggle.setAttribute('aria-label', 'Свайп вниз для закрытия');
            vibrate(20);
            console.log('📖 Panel expanded');
        } else {
            panelToggle.setAttribute('aria-label', 'Свайп вверх для панели управления');
            vibrate(10);
            console.log('📕 Panel collapsed');
        }
        
        setTimeout(() => {
            if (window.camera && window.renderer) {
                handleResize();
            }
        }, 350);
    }
    
    // Обработчик клика на индикатор
    panelToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        togglePanel();
    });
    
    // NASA Eyes Style - Свайп жесты
    let touchStartY = 0;
    let touchEndY = 0;
    let isDragging = false;
    
    uiContainer.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
        isDragging = true;
    }, { passive: true });
    
    uiContainer.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        touchEndY = e.touches[0].clientY;
    }, { passive: true });
    
    uiContainer.addEventListener('touchend', function(e) {
        if (!isDragging) return;
        isDragging = false;
        
        const swipeDistance = touchStartY - touchEndY;
        
        // Свайп вверх (открыть) - минимум 40px
        if (swipeDistance > 40) {
            if (!uiContainer.classList.contains('expanded')) {
                togglePanel();
            }
        }
        // Свайп вниз (закрыть) - минимум 40px
        else if (swipeDistance < -40) {
            if (uiContainer.classList.contains('expanded')) {
                togglePanel();
            }
        }
    }, { passive: true });
    
    // Закрываем панель при клике на канвас (только portrait mobile)
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
                    console.log('📕 Panel auto-collapsed');
                }, 100);
            }
        });
    }
    
    console.log('✅ Panel toggle configured');
}

// Оптимизация для мобильных устройств
function optimizeForMobile() {
    console.log('⚡ Optimizing for mobile...');
    
    // Уменьшаем качество рендеринга на слабых устройствах
    if (renderer) {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        console.log('  • Pixel ratio set to:', renderer.getPixelRatio());
    }
    
    // Уменьшаем количество частиц для мобильных
    window.MOBILE_PARTICLE_REDUCTION = 0.5; // 50% от обычного количества
    
    // Отключаем тени на слабых устройствах
    const isMidRange = getScreenSize() === 'xs' || getScreenSize() === 'sm';
    if (isMidRange && renderer) {
        renderer.shadowMap.enabled = false;
        console.log('  • Shadows disabled for performance');
    }
}

// Обработка изменения ориентации
function handleOrientationChange() {
    setTimeout(() => {
        const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
        console.log(`🔄 Orientation changed to: ${orientation}`);
        
        // Обновляем размеры через handleResize
        handleResize();
        
        // Адаптируем UI под ориентацию
        const uiContainer = document.getElementById('ui-container');
        const panelToggle = document.getElementById('panel-toggle');
        
        if (uiContainer && panelToggle) {
            if (orientation === 'landscape' && isMobileDevice()) {
                // В landscape можно оставить развернутой или свернуть
                // uiContainer.classList.add('expanded');
            }
        }
        
        // Показываем подсказку по ориентации
        showOrientationHint();
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
function showOrientationHint() {
    const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    const screenSize = getScreenSize();
    
    if (screenSize === 'xs' || screenSize === 'sm') {
        const hint = document.createElement('div');
        hint.id = 'orientation-hint';
        hint.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 107, 53, 0.95);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 13px;
            z-index: 10000;
            animation: fadeInOut 3s ease;
        `;
        
        if (orientation === 'portrait') {
            hint.textContent = '💡 Поверните устройство для лучшего просмотра';
        } else {
            hint.textContent = '✓ Ландшафтный режим оптимален';
        }
        
        // Удаляем предыдущую подсказку
        const oldHint = document.getElementById('orientation-hint');
        if (oldHint) oldHint.remove();
        
        document.body.appendChild(hint);
        
        setTimeout(() => {
            hint.style.opacity = '0';
            setTimeout(() => hint.remove(), 1000);
        }, 2000);
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
        // Настраиваем для touch
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        controls.rotateSpeed = 0.5;
        controls.zoomSpeed = 1.2;
        controls.panSpeed = 0.8;
        
        // Ограничения для более удобного управления на мобильных
        controls.minDistance = 20;
        controls.maxDistance = 80;
        controls.enablePan = false; // Отключаем pan на мобильных для упрощения
        
        console.log('✅ Touch controls enhanced');
    }
}

// Улучшение интерфейса для мобильных
function enhanceMobileUI() {
    const screenSize = getScreenSize();
    
    if (screenSize === 'xs' || screenSize === 'sm') {
        // Добавляем кнопку "наверх" для длинных панелей
        const backToTop = document.createElement('button');
        backToTop.id = 'back-to-top';
        backToTop.innerHTML = '↑';
        backToTop.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 25px;
            background: linear-gradient(135deg, #ff6b35, #ff8c42);
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            z-index: 1000;
            display: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            touch-action: manipulation;
        `;
        
        document.body.appendChild(backToTop);
        
        // Показываем кнопку при прокрутке
        const leftPanel = document.getElementById('left-panel');
        if (leftPanel) {
            leftPanel.addEventListener('scroll', () => {
                if (leftPanel.scrollTop > 200) {
                    backToTop.style.display = 'block';
                } else {
                    backToTop.style.display = 'none';
                }
            });
            
            backToTop.addEventListener('click', () => {
                leftPanel.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }
}

// Виброотклик для мобильных (если поддерживается)
function vibrate(pattern = 10) {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

// Добавляем виброотклик к важным действиям
function addVibrationFeedback() {
    if (!isMobileDevice()) return;
    
    // При выборе астероида
    document.addEventListener('click', (e) => {
        if (e.target.closest('.asteroid-card')) {
            vibrate(10);
        }
    });
    
    // При запуске симуляции
    const startBtn = document.getElementById('start-simulation');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            vibrate([30, 50, 30]);
        });
    }
    
    // При сбросе
    const resetBtn = document.getElementById('reset-simulation');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            vibrate(20);
        });
    }
}

// Инициализация при загрузке
window.addEventListener('DOMContentLoaded', () => {
    initMobile();
    
    // Ждем инициализации Three.js компонентов
    setTimeout(() => {
        enhanceTouchControls();
        enhanceMobileUI();
        addVibrationFeedback();
    }, 1000);
});

// Экспорт функций
window.isMobileDevice = isMobileDevice;
window.getScreenSize = getScreenSize;
window.vibrate = vibrate;

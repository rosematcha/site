class PopeClicker {
    constructor() {
        // Initialize game state
        this.popePoints = 0;
        this.pointsPerSecond = 0;
        this.clickPower = 1;
        
        // Initialize intervals
        this.gameLoopInterval = null;
        this.upgradesRenderInterval = null;
        this.autoSaveInterval = null;
        
        // Upgrade definitions with themes around jeans, horses, and science labs
        this.upgrades = [
            // Per Click Upgrades (Clothes)
            {
                id: 'jean_pocket',
                name: 'Jean Pocket',
                icon: '👖',
                description: 'A pocket that makes each click more valuable.',
                baseCost: 10,
                cost: 10,
                production: 0,
                clickPower: 1,
                count: 0,
                multiplier: 1.13,
                type: 'click',
                path: 'click',
                unlock: () => this.popePoints >= 1 || this.upgrades[0].count > 0
            },
            {
                id: 'blingy_belt',
                name: 'Blingy Belt',
                icon: '💎',
                description: 'A flashy belt that boosts your click power.',
                baseCost: 100,
                cost: 100,
                production: 0,
                clickPower: 5,
                count: 0,
                multiplier: 1.15,
                type: 'click',
                path: 'click',
                unlock: () => this.upgrades[0].count > 0
            },
            {
                id: 'golden_boots',
                name: 'Golden Boots',
                icon: '🥾',
                description: 'Boots that make every click stomp harder.',
                baseCost: 800,
                cost: 800,
                production: 0,
                clickPower: 20,
                count: 0,
                multiplier: 1.17,
                type: 'click',
                path: 'click',
                unlock: () => this.upgrades[1].count > 0
            },
            {
                id: 'denim_jacket',
                name: 'Denim Jacket',
                icon: '🧥',
                description: 'Stylish jacket that makes each click even more valuable.',
                baseCost: 3000,
                cost: 3000,
                production: 0,
                clickPower: 50,
                count: 0,
                multiplier: 1.18,
                type: 'click',
                path: 'click',
                unlock: () => this.upgrades[2].count > 0
            },
            {
                id: 'jean_factory',
                name: 'Jean Factory',
                icon: '🏭',
                description: 'Mass produces jeans for click power.',
                baseCost: 20000,
                cost: 20000,
                production: 0,
                clickPower: 200,
                count: 0,
                multiplier: 1.20,
                type: 'click',
                path: 'click',
                unlock: () => this.upgrades[3].count > 0
            },
            // Per Second Upgrades (Horses & Science)
            {
                id: 'pony',
                name: 'Pony',
                icon: '🐴',
                description: 'A cute pony that generates Pope points per second.',
                baseCost: 2500,
                cost: 2500,
                production: 35,
                clickPower: 0,
                count: 0,
                multiplier: 1.13,
                type: 'passive',
                path: 'passive',
                unlock: () => this.upgrades[0].count > 0
            },
            {
                id: 'horse_stable',
                name: 'Horse Stable',
                icon: '🏇',
                description: 'Stable full of horses working for Pope points.',
                baseCost: 12000,
                cost: 12000,
                production: 180,
                clickPower: 0,
                count: 0,
                multiplier: 1.13,
                type: 'passive',
                path: 'passive',
                unlock: () => this.upgrades[5].count > 0
            },
            {
                id: 'horse_ranch',
                name: 'Horse Ranch',
                icon: '🐎',
                description: 'Massive ranch with hundreds of horses.',
                baseCost: 60000,
                cost: 60000,
                production: 900,
                clickPower: 0,
                count: 0,
                multiplier: 1.13,
                type: 'passive',
                path: 'passive',
                unlock: () => this.upgrades[6].count > 0
            },
            {
                id: 'unicorn',
                name: 'Unicorn',
                icon: '🦄',
                description: 'Magical unicorn with special Pope powers.',
                baseCost: 300000,
                cost: 300000,
                production: 5000,
                clickPower: 0,
                count: 0,
                multiplier: 1.13,
                type: 'passive',
                path: 'passive',
                unlock: () => this.upgrades[7].count > 0
            },
            {
                id: 'test_tube',
                name: 'Test Tube',
                icon: '🧪',
                description: 'Basic science equipment for Pope experiments.',
                baseCost: 1500000,
                cost: 1500000,
                production: 25000,
                clickPower: 0,
                count: 0,
                multiplier: 1.13,
                type: 'passive',
                path: 'passive',
                unlock: () => this.upgrades[8].count > 0
            },
            {
                id: 'microscope',
                name: 'Microscope',
                icon: '🔬',
                description: 'Advanced microscope for Pope research.',
                baseCost: 8000000,
                cost: 8000000,
                production: 120000,
                clickPower: 0,
                count: 0,
                multiplier: 1.13,
                type: 'passive',
                path: 'passive',
                unlock: () => this.upgrades[9].count > 0
            },
            {
                id: 'science_lab',
                name: 'Science Lab',
                icon: '🧬',
                description: 'Full laboratory for Pope science experiments.',
                baseCost: 40000000,
                cost: 40000000,
                production: 600000,
                clickPower: 0,
                count: 0,
                multiplier: 1.13,
                type: 'passive',
                path: 'passive',
                unlock: () => this.upgrades[10].count > 0
            },
            {
                id: 'research_facility',
                name: 'Research Facility',
                icon: '🏢',
                description: 'Massive research complex studying Pope phenomena.',
                baseCost: 200000000,
                cost: 200000000,
                production: 3000000,
                clickPower: 0,
                count: 0,
                multiplier: 1.13,
                type: 'passive',
                path: 'passive',
                unlock: () => this.upgrades[11].count > 0
            },
            {
                id: 'pope_collider',
                name: 'Pope Collider',
                icon: '⚛️',
                description: 'Particle accelerator that creates Pope particles.',
                baseCost: 1000000000,
                cost: 1000000000,
                production: 15000000,
                clickPower: 0,
                count: 0,
                multiplier: 1.13,
                type: 'passive',
                path: 'passive',
                unlock: () => this.upgrades[12].count > 0
            },
            {
                id: 'dimensional_lab',
                name: 'Dimensional Lab',
                icon: '🌌',
                description: 'Interdimensional laboratory accessing infinite Popes.',
                baseCost: 5000000000,
                cost: 5000000000,
                production: 80000000,
                clickPower: 0,
                count: 0,
                multiplier: 1.13,
                type: 'passive',
                path: 'passive',
                unlock: () => this.upgrades[13].count > 0
            }
        ];
        
        // Initialize audio
        this.audioContext = null;
        this.clickBuffer = null;
        this.reverbBuffer = null;
        this.loadClickSound();
        
        // Initialize DOM elements and game loop
        this.initializeElements();
        this.bindEvents();
        this.calculatePointsPerSecond();
        this.calculateClickPower();
        this.startGameLoop();
        this.renderUpgrades();
    }
    
    async loadClickSound() {
        // Initialize AudioContext
        if (!window.AudioContext && !window.webkitAudioContext) return;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        try {
            // Load click.ogg as array buffer
            const response = await fetch('click.ogg');
            if (!response.ok) throw new Error('click.ogg not found');
            const arrayBuffer = await response.arrayBuffer();
            this.clickBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            // Create a simple impulse response for soft reverb
            this.reverbBuffer = this.createReverbBuffer();
        } catch (e) {
            // If file is missing or fetch fails, just skip sound
            this.clickBuffer = null;
            this.reverbBuffer = null;
            // Optionally log a warning
            console.warn('Click sound not loaded:', e.message);
        }
    }

    createReverbBuffer() {
        // Simple soft reverb impulse response (short, low volume)
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * 0.25; // 0.25s
        const impulse = this.audioContext.createBuffer(2, length, sampleRate);
        for (let c = 0; c < 2; c++) {
            const channel = impulse.getChannelData(c);
            for (let i = 0; i < length; i++) {
                // Exponential decay
                channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2) * 0.15;
            }
        }
        return impulse;
    }

    bindEvents() {
        this.popeImage.addEventListener('click', (e) => this.handleClick(e));
        this.popeImage.addEventListener('mousedown', () => this.popeImage.style.transform = 'scale(0.95)');
        this.popeImage.addEventListener('mouseup', () => this.popeImage.style.transform = 'scale(1)');
        this.popeImage.addEventListener('mouseleave', () => this.popeImage.style.transform = 'scale(1)');
    }
    
    buyUpgrade(upgradeId) {
        const upgrade = this.upgrades.find(u => u.id === upgradeId);
        if (!upgrade) {
            console.error(`Upgrade not found: ${upgradeId}`);
            return false;
        }
        
        if (this.popePoints < upgrade.cost) {
            return false;
        }
        
        // Deduct cost and increment count
        this.popePoints -= upgrade.cost;
        upgrade.count++;
        
        // Calculate new cost with safety checks
        const newCost = Math.ceil(upgrade.baseCost * Math.pow(upgrade.multiplier, upgrade.count));
        upgrade.cost = Math.max(upgrade.baseCost, newCost);
        
        // Update game state
        this.calculatePointsPerSecond();
        this.calculateClickPower();
        this.updateDisplay();
        this.renderUpgrades();
        
        return true;
    }

    calculateClickPower() {
        // Base click is always 1
        this.clickPower = 1 + this.upgrades.reduce((total, upgrade) => {
            return total + (upgrade.clickPower || 0) * (upgrade.count || 0);
        }, 0);
    }

    handleClick(e) {
        this.popePoints += this.clickPower;
        this.playClickSound();
        this.showClickEffect();
        this.updateDisplay();
    }
    
    playClickSound() {
        if (!this.audioContext || !this.clickBuffer) return;
        
        try {
            const ctx = this.audioContext;
            const source = ctx.createBufferSource();
            source.buffer = this.clickBuffer;
            
            // Random pitch between 0.85 and 1.15
            source.playbackRate.value = 0.85 + Math.random() * 0.3;
            
            // Gain node for volume control
            const gain = ctx.createGain();
            gain.gain.value = 0.18;
            
            // Occasionally add soft reverb (20% chance)
            if (Math.random() < 0.2 && this.reverbBuffer) {
                const convolver = ctx.createConvolver();
                convolver.buffer = this.reverbBuffer;
                source.connect(convolver);
                convolver.connect(gain);
            } else {
                source.connect(gain);
            }
            
            gain.connect(ctx.destination);
            source.start(0);
        } catch (error) {
            console.warn('Audio playback error:', error);
        }
    }
    
    showClickEffect() {
        if (!this.clickEffect) return;
        
        this.clickEffect.textContent = `+${this.formatNumber(this.clickPower)}`;
        this.clickEffect.classList.remove('animate');
        
        // Trigger reflow to restart animation
        this.clickEffect.offsetHeight;
        this.clickEffect.classList.add('animate');
        
        // Show click counter briefly
        if (this.clickCounter) {
            this.clickCounter.textContent = `+${this.formatNumber(this.clickPower)}`;
            this.clickCounter.classList.add('show');
            
            setTimeout(() => {
                if (this.clickCounter) {
                    this.clickCounter.classList.remove('show');
                }
            }, 300);
        }
    }
    
    calculatePointsPerSecond() {
        this.pointsPerSecond = this.upgrades.reduce((total, upgrade) => {
            return total + (upgrade.production * upgrade.count);
        }, 0);
    }
    
    updateDisplay() {
        // Cache the formatted values to avoid repeated calculations
        const formattedPoints = this.formatNumber(this.popePoints);
        const formattedPerSecond = this.formatNumber(this.pointsPerSecond);
        const formattedClickPower = this.formatNumber(this.clickPower);
        
        // Update popePoints with animation
        if (this.popePointsDisplay && this.popePointsDisplay.textContent !== formattedPoints) {
            this.popePointsDisplay.classList.remove('animated');
            void this.popePointsDisplay.offsetWidth; // Trigger reflow
            this.popePointsDisplay.classList.add('animated');
            this.popePointsDisplay.textContent = formattedPoints;
        }
        
        // Update perSecond with animation
        if (this.perSecondDisplay && this.perSecondDisplay.textContent !== formattedPerSecond) {
            this.perSecondDisplay.classList.remove('animated');
            void this.perSecondDisplay.offsetWidth; // Trigger reflow
            this.perSecondDisplay.classList.add('animated');
            this.perSecondDisplay.textContent = formattedPerSecond;
        }
        
        // Update clickPower
        if (this.clickPowerDisplay && this.clickPowerDisplay.textContent !== formattedClickPower) {
            this.clickPowerDisplay.textContent = formattedClickPower;
        }
    }
    
    formatNumber(num) {
        if (num < 1000) {
            return Math.floor(num).toString();
        } else if (num < 1000000) {
            return (num / 1000).toFixed(1) + 'K';
        } else if (num < 1000000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num < 1000000000000) {
            return (num / 1000000000).toFixed(1) + 'B';
        } else if (num < 1000000000000000) {
            return (num / 1000000000000).toFixed(1) + 'T';
        } else {
            return (num / 1000000000000000).toFixed(1) + 'Q';
        }
    }
    
    renderUpgrades() {
        if (!this.upgradesContainer) return;
        this.upgradesContainer.innerHTML = '';
        const fragment = document.createDocumentFragment();
        this.upgrades.forEach((upgrade, idx) => {
            // Use unlock function if present
            let visible = typeof upgrade.unlock === 'function' ? upgrade.unlock() : true;
            if (!visible) return;
            const upgradeElement = document.createElement('div');
            upgradeElement.className = 'upgrade-item';
            if (this.popePoints >= upgrade.cost) {
                upgradeElement.classList.add('affordable');
            } else {
                upgradeElement.classList.add('expensive');
            }
            let effectText = '';
            if (upgrade.type === 'click' && upgrade.clickPower > 0) {
                effectText = `<div class="upgrade-production" style="color:#ffd700;">+${this.formatNumber(upgrade.clickPower)} per click</div>`;
            } else if (upgrade.type === 'passive' && upgrade.production > 0) {
                effectText = `<div class="upgrade-production">+${this.formatNumber(upgrade.production)} per second</div>`;
            }
            upgradeElement.innerHTML = `
                <span class="upgrade-icon">${upgrade.icon}</span>
                <div class="upgrade-details">
                    <div class="upgrade-name">${upgrade.name}</div>
                    <div class="upgrade-cost">Cost: ${this.formatNumber(upgrade.cost)}</div>
                    ${effectText}
                </div>
                <div class="upgrade-count">${upgrade.count}</div>
            `;
            upgradeElement.addEventListener('click', () => {
                if (this.popePoints >= upgrade.cost) {
                    this.buyUpgrade(upgrade.id);
                }
            });
            fragment.appendChild(upgradeElement);
        });
        this.upgradesContainer.appendChild(fragment);
    }
    
    startGameLoop() {
        // Main game loop - runs 10 times per second
        this.gameLoopInterval = setInterval(() => {
            if (this.pointsPerSecond > 0) {
                this.popePoints += this.pointsPerSecond / 10;
                this.updateDisplay();
            }
        }, 100);
        
        // Upgrade rendering - runs less frequently to improve performance
        this.upgradesRenderInterval = setInterval(() => {
            this.renderUpgrades();
        }, 1000);
        
        // Auto-save every 30 seconds
        this.autoSaveInterval = setInterval(() => {
            this.saveGame();
        }, 30000);
    }
    
    stopGameLoop() {
        if (this.gameLoopInterval) clearInterval(this.gameLoopInterval);
        if (this.upgradesRenderInterval) clearInterval(this.upgradesRenderInterval);
        if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
    }
    
    // Save/Load functionality with error handling
    saveGame() {
        try {
            const saveData = {
                popePoints: this.popePoints,
                clickPower: this.clickPower,
                pointsPerSecond: this.pointsPerSecond,
                upgrades: this.upgrades.map(u => ({
                    id: u.id,
                    count: u.count,
                    cost: u.cost
                })),
                timestamp: Date.now()
            };
            localStorage.setItem('popeClickerSave', JSON.stringify(saveData));
        } catch (error) {
            console.error('Failed to save game:', error);
        }
    }
    
    loadGame() {
        try {
            const saveData = localStorage.getItem('popeClickerSave');
            if (!saveData) return false;
            
            const data = JSON.parse(saveData);
            
            // Validate save data
            if (typeof data.popePoints !== 'number' || !Array.isArray(data.upgrades)) {
                console.warn('Invalid save data format');
                return false;
            }
            
            this.popePoints = Math.max(0, data.popePoints || 0);
            
            // Restore upgrade states
            data.upgrades.forEach(savedUpgrade => {
                const upgrade = this.upgrades.find(u => u.id === savedUpgrade.id);
                if (upgrade && typeof savedUpgrade.count === 'number' && typeof savedUpgrade.cost === 'number') {
                    upgrade.count = Math.max(0, savedUpgrade.count);
                    upgrade.cost = Math.max(upgrade.baseCost, savedUpgrade.cost);
                }
            });
            
            // Recalculate derived values
            this.calculatePointsPerSecond();
            this.calculateClickPower();
            this.updateDisplay();
            this.renderUpgrades();
            
            console.log('Game loaded successfully');
            return true;
        } catch (error) {
            console.error('Failed to load game:', error);
            return false;
        }
    }
    
    initializeElements() {
        // Get all required DOM elements
        this.popeImage = document.getElementById('popeImage');
        this.popePointsDisplay = document.getElementById('popePoints');
        this.perSecondDisplay = document.getElementById('perSecond');
        this.clickEffect = document.getElementById('clickEffect');
        this.clickCounter = document.getElementById('clickCounter');
        this.upgradesContainer = document.getElementById('upgradesContainer');
        // Add reset button event if present
        this.resetButton = document.getElementById('resetSave');
        if (this.resetButton) {
            this.resetButton.addEventListener('click', () => {
                if (confirm('Are you sure you want to reset your save? This cannot be undone.')) {
                    this.resetSave();
                }
            });
        }
    }

    resetSave() {
        // Remove save from localStorage
        localStorage.removeItem('popeClickerSave');
        // Reset all game state
        this.popePoints = 0;
        this.upgrades.forEach(upg => {
            upg.count = 0;
            upg.cost = upg.baseCost;
        });
        this.calculatePointsPerSecond();
        this.calculateClickPower();
        this.updateDisplay();
        this.renderUpgrades();
        // Optionally, reload the page for a full reset (not strictly necessary)
        // window.location.reload();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    try {
        const game = new PopeClicker();
        
        // Load saved game if available
        const gameLoaded = game.loadGame();
        if (gameLoaded) {
            console.log('Previous game state loaded');
        }
        
        // Save on page unload
        window.addEventListener('beforeunload', () => {
            game.saveGame();
        });
        
        // Handle page visibility changes for performance
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Page is hidden, save game
                game.saveGame();
            }
        });
        
        // Make game accessible globally for debugging
        window.game = game;
        
    } catch (error) {
        console.error('Failed to initialize game:', error);
        alert('Failed to start the game. Please refresh the page.');
    }
});

// Prevent context menu on right-click for better game experience
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

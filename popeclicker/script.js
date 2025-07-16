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
        
        // Anti-RSI Mode properties
        this.antiRsiModeUnlocked = false;
        this.antiRsiModeEnabled = false;
        this.spacebarHeldTime = 0;
        this.spacebarInterval = null;
        this.antiRsiClickInterval = null;
        this.isSpacebarHeld = false;
        
        // Upgrade definitions with themes around jeans, horses, and science labs
        this.upgrades = [
            // Per Click Upgrades (Jeans)
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
                multiplier: 1.20,
                type: 'click',
                path: 'click',
                unlock: () => true // Always available as the first upgrade
            },
            {
                id: 'denim_vest',
                name: 'Denim Vest',
                icon: '🧥',
                description: 'A stylish vest that adds to your click power.',
                baseCost: 150,
                cost: 150,
                production: 0,
                clickPower: 4,
                count: 0,
                multiplier: 1.25,
                type: 'click',
                path: 'click',
                unlock: () => this.upgrades[0].count > 0
            },
            {
                id: 'bell_bottoms',
                name: 'Bell Bottoms',
                icon: '👖',
                description: 'Flared jeans that make every click groovy.',
                baseCost: 1000,
                cost: 1000,
                production: 0,
                clickPower: 15,
                count: 0,
                multiplier: 1.30,
                type: 'click',
                path: 'click',
                unlock: () => this.upgrades[1].count > 0
            },
            {
                id: 'denim_jacket',
                name: 'Denim Jacket',
                icon: '🧥',
                description: 'Stylish jacket that makes each click even more valuable.',
                baseCost: 5000,
                cost: 5000,
                production: 0,
                clickPower: 40,
                count: 0,
                multiplier: 1.35,
                type: 'click',
                path: 'click',
                unlock: () => this.upgrades[2].count > 0
            },
            {
                id: 'jean_factory',
                name: 'Jean Factory',
                icon: '🏭',
                description: 'Mass produces jeans for click power.',
                baseCost: 25000,
                cost: 25000,
                production: 0,
                clickPower: 150,
                count: 0,
                multiplier: 1.40,
                type: 'click',
                path: 'click',
                unlock: () => this.upgrades[3].count > 0
            },
            // Per Second Upgrades (Horses)
            {
                id: 'sugar_cube',
                name: 'Sugar Cube',
                icon: '🍬',
                description: 'A sweet treat to motivate a horse.',
                baseCost: 50,
                cost: 50,
                production: 1,
                clickPower: 0,
                count: 0,
                multiplier: 1.20,
                type: 'passive',
                path: 'passive',
                unlock: () => this.upgrades[0].count > 0
            },
            {
                id: 'carrot',
                name: 'Carrot',
                icon: '🥕',
                description: 'A healthy snack for a happy horse.',
                baseCost: 250,
                cost: 250,
                production: 5,
                clickPower: 0,
                count: 0,
                multiplier: 1.25,
                type: 'passive',
                path: 'passive',
                unlock: () => this.upgrades[5].count > 0
            },
            {
                id: 'pony',
                name: 'Pony',
                icon: '🐴',
                description: 'A cute pony that generates Nature Valley Bars per second.',
                baseCost: 3000,
                cost: 3000,
                production: 20,
                clickPower: 0,
                count: 0,
                multiplier: 1.25,
                type: 'passive',
                path: 'passive',
                unlock: () => this.upgrades[6].count > 0
            },
            {
                id: 'horse_stable',
                name: 'Horse Stable',
                icon: '🏇',
                description: 'Stable full of horses working for Nature Valley Bars.',
                baseCost: 15000,
                cost: 15000,
                production: 100,
                clickPower: 0,
                count: 0,
                multiplier: 1.30,
                type: 'passive',
                path: 'passive',
                unlock: () => this.upgrades[7].count > 0
            },
            {
                id: 'horse_ranch',
                name: 'Horse Ranch',
                icon: '🐎',
                description: 'Massive ranch with hundreds of horses.',
                baseCost: 75000,
                cost: 75000,
                production: 500,
                clickPower: 0,
                count: 0,
                multiplier: 1.35,
                type: 'passive',
                path: 'passive',
                unlock: () => this.upgrades[8].count > 0
            },
            {
                id: 'unicorn',
                name: 'Unicorn',
                icon: '🦄',
                description: 'Magical unicorn with special Pope powers.',
                baseCost: 400000,
                cost: 400000,
                production: 2500,
                clickPower: 0,
                count: 0,
                multiplier: 1.40,
                type: 'passive',
                path: 'passive',
                unlock: () => this.upgrades[9].count > 0
            },
            {
                id: 'pegasus',
                name: 'Pegasus',
                icon: '🎠',
                description: 'A winged horse from the heavens.',
                baseCost: 2000000,
                cost: 2000000,
                production: 12000,
                clickPower: 0,
                count: 0,
                multiplier: 1.45,
                type: 'passive',
                path: 'passive',
                unlock: () => this.upgrades[10].count > 0
            },
            {
                id: 'centaur_legion',
                name: 'Centaur Legion',
                icon: '🏹',
                description: 'An army of horse-men at your command.',
                baseCost: 10000000,
                cost: 10000000,
                production: 60000,
                clickPower: 0,
                count: 0,
                multiplier: 1.50,
                type: 'passive',
                path: 'passive',
                unlock: () => this.upgrades[11].count > 0
            },
            {
                id: 'royal_cavalry',
                name: 'Royal Cavalry',
                icon: '🛡️',
                description: 'An elite force of mounted warriors.',
                baseCost: 50000000,
                cost: 50000000,
                production: 300000,
                clickPower: 0,
                count: 0,
                multiplier: 1.55,
                type: 'passive',
                path: 'passive',
                unlock: () => this.upgrades[12].count > 0
            },
            {
                id: 'mythical_horse_god',
                name: 'Mythical Horse God',
                icon: '✨',
                description: 'A divine equine being of immense power.',
                baseCost: 250000000,
                cost: 250000000,
                production: 1500000,
                clickPower: 0,
                count: 0,
                multiplier: 1.60,
                type: 'passive',
                path: 'passive',
                unlock: () => this.upgrades[13].count > 0
            },
            {
                id: 'interdimensional_stampede',
                name: 'Interdimensional Stampede',
                icon: '🌀',
                description: 'A never-ending stampede from another dimension.',
                baseCost: 1200000000,
                cost: 1200000000,
                production: 7500000,
                clickPower: 0,
                count: 0,
                multiplier: 1.65,
                type: 'passive',
                path: 'passive',
                unlock: () => this.upgrades[14].count > 0
            },
            {
                id: 'celestial_steed',
                name: 'Celestial Steed',
                icon: '🌠',
                description: 'A horse made of stardust, galloping through the cosmos.',
                baseCost: 6000000000,
                cost: 6000000000,
                production: 40000000,
                clickPower: 0,
                count: 0,
                multiplier: 1.70,
                type: 'passive',
                path: 'passive',
                unlock: () => this.upgrades[15].count > 0
            }
        ];
        
        // Prestige state
        this.prestigePoints = 0;
        this.totalPopePoints = 0;

        // Prestige Upgrades
        this.prestigeUpgrades = [
            // Power Upgrades
            {
                id: 'heavenly_jeans',
                name: 'Heavenly Jeans',
                icon: '✨👖',
                description: 'Permanent boost to your click power.',
                baseCost: 1,
                cost: 1,
                maxLevel: 20,
                level: 0,
                costMultiplier: 1.5,
                effect: (level) => 1 + (level * 0.1), // +10% click power per level
                type: 'prestige',
                unlock: () => this.prestigePoints > 0
            },
            {
                id: 'divine_horses',
                name: 'Divine Horses',
                icon: '✨🐴',
                description: 'Your passive upgrades produce more Nature Valley Bars.',
                baseCost: 1,
                cost: 1,
                maxLevel: 20,
                level: 0,
                costMultiplier: 1.5,
                effect: (level) => 1 + (level * 0.08), // +8% PPS per level
                type: 'prestige',
                unlock: () => this.prestigePoints > 0
            },
            {
                id: 'starting_bonus',
                name: 'Pope\'s Blessing',
                icon: '🙏',
                description: 'Start each prestige run with bonus Nature Valley Bars.',
                baseCost: 3,
                cost: 3,
                maxLevel: 15,
                level: 0,
                costMultiplier: 2.0,
                effect: (level) => level * 1000, // +1000 starting Nature Valley Bars per level
                type: 'prestige',
                unlock: () => this.prestigePoints >= 3
            },
            {
                id: 'faster_clicking',
                name: 'Lightning Reflexes',
                icon: '⚡',
                description: 'Clicking animations are faster and more responsive.',
                baseCost: 5,
                cost: 5,
                maxLevel: 10,
                level: 0,
                costMultiplier: 1.8,
                effect: (level) => 1 + (level * 0.05), // +5% click speed per level
                type: 'prestige',
                unlock: () => this.prestigePoints >= 5
            },
            // Cosmetic Upgrades
            {
                id: 'golden_pope',
                name: 'Golden Pope',
                icon: '🏆',
                description: 'Makes Pope shimmer with golden light.',
                baseCost: 2,
                cost: 2,
                maxLevel: 1,
                level: 0,
                costMultiplier: 1.0,
                effect: (level) => level, // Just a flag for cosmetic effect
                type: 'prestige',
                category: 'cosmetic',
                unlock: () => this.prestigePoints >= 2
            },
            {
                id: 'rainbow_effects',
                name: 'Rainbow Clicks',
                icon: '🌈',
                description: 'Click effects show in rainbow colors.',
                baseCost: 4,
                cost: 4,
                maxLevel: 1,
                level: 0,
                costMultiplier: 1.0,
                effect: (level) => level, // Just a flag for cosmetic effect
                type: 'prestige',
                category: 'cosmetic',
                unlock: () => this.prestigePoints >= 4
            },
            {
                id: 'particle_effects',
                name: 'Particle Storm',
                icon: '✨',
                description: 'Adds sparkle particles around Pope.',
                baseCost: 7,
                cost: 7,
                maxLevel: 1,
                level: 0,
                costMultiplier: 1.0,
                effect: (level) => level, // Just a flag for cosmetic effect
                type: 'prestige',
                category: 'cosmetic',
                unlock: () => this.prestigePoints >= 7
            },
            {
                id: 'background_theme',
                name: 'Cosmic Background',
                icon: '🌌',
                description: 'Changes the background to a cosmic theme.',
                baseCost: 10,
                cost: 10,
                maxLevel: 1,
                level: 0,
                costMultiplier: 1.0,
                effect: (level) => level, // Just a flag for cosmetic effect
                type: 'prestige',
                category: 'cosmetic',
                unlock: () => this.prestigePoints >= 10
            },
            // Advanced Upgrades
            {
                id: 'prestige_multiplier',
                name: 'Prestige Mastery',
                icon: '👑',
                description: 'Gain more prestige points from future prestiges.',
                baseCost: 15,
                cost: 15,
                maxLevel: 5,
                level: 0,
                costMultiplier: 3.0,
                effect: (level) => 1 + (level * 0.2), // +20% prestige points per level
                type: 'prestige',
                unlock: () => this.prestigePoints >= 15
            },
            {
                id: 'auto_clicker',
                name: 'Divine Auto-Clicker',
                icon: '🤖',
                description: 'Automatically clicks Pope once per second.',
                baseCost: 25,
                cost: 25,
                maxLevel: 10,
                level: 0,
                costMultiplier: 2.5,
                effect: (level) => level, // Level = clicks per second
                type: 'prestige',
                unlock: () => this.prestigePoints >= 25
            }
        ];

        // Tab state
        this.currentUpgradeTab = 'click'; // 'click', 'persecond', 'prestige'
        
        // Initialize audio
        this.audioContext = null;
        this.clickBuffer = null;
        this.reverbBuffer = null;
        this.loadClickSound();
        
        // Preload Nature Valley images
        this.preloadImages();
        
        // Initialize DOM elements and game loop
        this.initializeElements();
        this.bindEvents();
        this.calculatePointsPerSecond();
        this.calculateClickPower();
        this.startGameLoop();
        this.renderUpgrades();
        this.renderTabs();
    }
    
    async loadClickSound() {
        // Initialize AudioContext
        if (!window.AudioContext && !window.webkitAudioContext) return;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        try {
            // Load click.ogg as array buffer
            const response = await fetch('click.ogg');
            const arrayBuffer = await response.arrayBuffer();
            this.clickBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            // Create reverb buffer
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

    preloadImages() {
        // Preload Nature Valley images for effects
        this.natureValleyLarge = new Image();
        this.natureValleyLarge.src = 'naturevalley_large.png';
        
        this.natureValleySmall = new Image();
        this.natureValleySmall.src = 'naturevalley_small.png';
    }

    bindEvents() {
        console.log('Binding events...');
        console.log('this.popeImage:', this.popeImage);
        console.log('typeof this.handleClick:', typeof this.handleClick);
        this.popeImage.addEventListener('click', (e) => this.handleClick(e));
        this.popeImage.addEventListener('mousedown', () => this.popeImage.style.transform = 'scale(0.95)');
        this.popeImage.addEventListener('mouseup', () => this.popeImage.style.transform = 'scale(1)');
        this.popeImage.addEventListener('mouseleave', () => this.popeImage.style.transform = 'scale(1)');
        
        // Tab switching for upgrades
        if (this.upgradeTabs) {
            const tabs = this.upgradeTabs.querySelectorAll('.upgrade-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    const tabType = tab.getAttribute('data-tab');
                    this.currentUpgradeTab = tabType;
                    this.renderUpgrades();
                });
            });
        }
        
        // Anti-RSI Mode keyboard events
        this.bindAntiRsiEvents();
        
        // Debug buttons toggle with 'U' key
        this.bindDebugToggle();
    }
    
    bindDebugToggle() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyU') {
                const resetSaveBtn = document.getElementById('resetSave');
                const debugUnlockBtn = document.getElementById('debugUnlock');
                
                if (resetSaveBtn && debugUnlockBtn) {
                    const isVisible = resetSaveBtn.style.display === 'block';
                    const newDisplay = isVisible ? 'none' : 'block';
                    
                    resetSaveBtn.style.display = newDisplay;
                    debugUnlockBtn.style.display = newDisplay;
                    
                    // Show a toast notification
                    const message = isVisible ? 'Debug buttons hidden' : 'Debug buttons revealed';
                    this.showToast(message);
                }
            }
        });
    }
    
    handleClick(e, isAntiRsi = false) {
        // Add Nature Valley Bars based on click power
        this.popePoints += this.clickPower;
        this.totalPopePoints += this.clickPower;
        
        // Play click sound if available
        if (this.clickBuffer && this.audioContext) {
            try {
                const source = this.audioContext.createBufferSource();
                source.buffer = this.clickBuffer;
                
                // Apply some reverb for depth
                const reverb = this.audioContext.createConvolver();
                reverb.buffer = this.reverbBuffer;
                
                const gainNode = this.audioContext.createGain();
                gainNode.gain.value = 0.3; // Adjust volume as needed
                
                source.connect(gainNode);
                gainNode.connect(reverb);
                reverb.connect(this.audioContext.destination);
                
                source.start();
            } catch (error) {
                console.warn('Could not play click sound:', error);
            }
        }
        
        // Show click effect animation
        if (this.clickEffect) {
            this.clickEffect.textContent = `+${this.formatNumber(this.clickPower)}`;
            this.clickEffect.classList.remove('animate');
            void this.clickEffect.offsetWidth; // Trigger reflow
            this.clickEffect.classList.add('animate');
        }
        
        // Update click counter
        if (this.clickCounter) {
            this.clickCounter.textContent = `+${this.formatNumber(this.clickPower)}`;
            this.clickCounter.classList.add('show');
            setTimeout(() => {
                this.clickCounter.classList.remove('show');
            }, 300);
        }
        
        // Update display
        this.updateDisplay();
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
        
        // Re-render tabs in case new upgrades unlocked new tabs
        this.renderTabs();
        
        return true;
    }

    buyPrestigeUpgrade(upgradeId) {
        const upgrade = this.prestigeUpgrades.find(u => u.id === upgradeId);
        if (!upgrade) {
            console.error(`Prestige upgrade not found: ${upgradeId}`);
            return false;
        }

        if (this.prestigePoints < upgrade.cost) {
            return false;
        }

        if (upgrade.level >= upgrade.maxLevel) {
            return false; // Max level reached
        }

        this.prestigePoints -= upgrade.cost;
        upgrade.level++;

        // Update cost for next level (if not maxed out)
        if (upgrade.level < upgrade.maxLevel) {
            upgrade.cost = Math.ceil(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
        }

        // Update game state and UI
        this.calculatePointsPerSecond();
        this.calculateClickPower();
        this.updateDisplay();
        this.renderUpgrades();

        return true;
    }

    calculateClickPower() {
        const clickPowerUpgrade = this.prestigeUpgrades.find(u => u.id === 'heavenly_jeans');
        const clickMultiplier = clickPowerUpgrade ? clickPowerUpgrade.effect(clickPowerUpgrade.level) : 1;

        this.clickPower = (1 + this.upgrades.reduce((total, upgrade) => {
            return total + (upgrade.clickPower || 0) * (upgrade.count || 0);
        }, 0)) * clickMultiplier;
    }

    calculatePointsPerSecond() {
        const ppsUpgrade = this.prestigeUpgrades.find(u => u.id === 'divine_horses');
        const ppsMultiplier = ppsUpgrade ? ppsUpgrade.effect(ppsUpgrade.level) : 1;

        this.pointsPerSecond = this.upgrades.reduce((total, upgrade) => {
            return total + (upgrade.production * upgrade.count);
        }, 0) * ppsMultiplier;
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
        
        // Update prestige points display
        if (this.prestigePointsDisplay) {
            this.prestigePointsDisplay.textContent = this.formatNumber(this.prestigePoints);
        }
        
        // Show/hide prestige button and prestige points stat
        const prestigeBtn = document.getElementById('prestige');
        const prestigePointsStat = document.getElementById('prestigePointsStat');
        
        if (this.totalPopePoints >= 1000000) {
            if (prestigeBtn) prestigeBtn.style.display = 'block';
        } else {
            if (prestigeBtn) prestigeBtn.style.display = 'none';
        }
        
        if (this.prestigePoints > 0) {
            if (prestigePointsStat) prestigePointsStat.style.display = 'block';
        } else {
            if (prestigePointsStat) prestigePointsStat.style.display = 'none';
        }
        
        // Update upgrade affordability colors
        this.updateUpgradeAffordability();
    }
    
    updateUpgradeAffordability() {
        if (!this.upgradesContainer) return;
        
        const upgradeElements = this.upgradesContainer.querySelectorAll('.upgrade-item');
        let visibleUpgrades = [];
        
        if (this.currentUpgradeTab === 'click') {
            visibleUpgrades = this.upgrades.filter(upg => upg.type === 'click' && upg.unlock && upg.unlock());
        } else if (this.currentUpgradeTab === 'persecond') {
            visibleUpgrades = this.upgrades.filter(upg => upg.type === 'passive' && upg.unlock && upg.unlock());
        } else if (this.currentUpgradeTab === 'prestige') {
            visibleUpgrades = this.prestigeUpgrades.filter(upg => upg.unlock && upg.unlock());
        }
        
        upgradeElements.forEach((element, index) => {
            if (index < visibleUpgrades.length) {
                const upgrade = visibleUpgrades[index];
                element.classList.remove('affordable', 'expensive');
                
                if (upgrade.type === 'prestige') {
                    if (this.prestigePoints >= upgrade.cost) {
                        element.classList.add('affordable');
                    } else {
                        element.classList.add('expensive');
                    }
                } else {
                    if (this.popePoints >= upgrade.cost) {
                        element.classList.add('affordable');
                    } else {
                        element.classList.add('expensive');
                    }
                }
            }
        });
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
        let visibleUpgrades = [];
        if (this.currentUpgradeTab === 'click') {
            visibleUpgrades = this.upgrades.filter(upg => upg.type === 'click' && upg.unlock && upg.unlock());
        } else if (this.currentUpgradeTab === 'persecond') {
            visibleUpgrades = this.upgrades.filter(upg => upg.type === 'passive' && upg.unlock && upg.unlock());
        } else if (this.currentUpgradeTab === 'prestige') {
            visibleUpgrades = this.prestigeUpgrades.filter(upg => upg.unlock && upg.unlock());
        }
        const fragment = document.createDocumentFragment();
        visibleUpgrades.forEach((upgrade, idx) => {
            const upgradeElement = document.createElement('div');
            upgradeElement.className = 'upgrade-item';

            if (upgrade.type === 'prestige') {
                if (this.prestigePoints >= upgrade.cost) {
                    upgradeElement.classList.add('affordable');
                } else {
                    upgradeElement.classList.add('expensive');
                }
            } else {
                if (this.popePoints >= upgrade.cost) {
                    upgradeElement.classList.add('affordable');
                } else {
                    upgradeElement.classList.add('expensive');
                }
            }

            let effectText = '';
            if (upgrade.type === 'click' && upgrade.clickPower > 0) {
                effectText = `<div class="upgrade-production" style="color:#ffd700;">+${this.formatNumber(upgrade.clickPower)} per click</div>`;
            } else if (upgrade.type === 'passive' && upgrade.production > 0) {
                effectText = `<div class="upgrade-production">+${this.formatNumber(upgrade.production)} per second</div>`;
            }
            else if (upgrade.type === 'prestige') {
                const currentBonus = (upgrade.effect(upgrade.level) - 1) * 100;
                const nextBonus = (upgrade.effect(upgrade.level + 1) - 1) * 100;
                effectText = `<div class="upgrade-production">+${currentBonus.toFixed(0)}% -> +${nextBonus.toFixed(0)}%</div>`;
            }

            const countOrLevel = (upgrade.type === 'prestige') ? `Lvl: ${upgrade.level}` : upgrade.count;
            const costText = (upgrade.type === 'prestige') ? `Cost: ${this.formatNumber(upgrade.cost)} Prestige` : `Cost: ${this.formatNumber(upgrade.cost)} Nature Valley Bars`;

            upgradeElement.innerHTML = `
                <span class="upgrade-icon">${upgrade.icon}</span>
                <div class="upgrade-details">
                    <div class="upgrade-name">${upgrade.name}</div>
                    <div class="upgrade-cost">${costText}</div>
                    ${effectText}
                </div>
                <div class="upgrade-count">${countOrLevel}</div>
            `;

            upgradeElement.addEventListener('click', () => {
                if (upgrade.type === 'prestige') {
                    this.buyPrestigeUpgrade(upgrade.id);
                } else {
                    this.buyUpgrade(upgrade.id);
                }
            });

            fragment.appendChild(upgradeElement);
        });
        this.upgradesContainer.appendChild(fragment);
    }
    
    getVisibleTabs() {
        const tabs = [];
        
        // Check if any click upgrades are unlocked
        const hasClickUpgrades = this.upgrades.some(upg => 
            upg.type === 'click' && upg.unlock && upg.unlock()
        );
        if (hasClickUpgrades) {
            tabs.push({
                id: 'click',
                name: 'Clicks',
                dataTab: 'click'
            });
        }
        
        // Check if any passive upgrades are unlocked
        const hasPassiveUpgrades = this.upgrades.some(upg => 
            upg.type === 'passive' && upg.unlock && upg.unlock()
        );
        if (hasPassiveUpgrades) {
            tabs.push({
                id: 'persecond',
                name: 'Passives',
                dataTab: 'persecond'
            });
        }
        
        // Prestige tab (placeholder for future implementation)
        if (this.prestigePoints > 0) {
            tabs.push({
                id: 'prestige',
                name: 'Prestige',
                dataTab: 'prestige'
            });
        }
        
        return tabs;
    }

    renderTabs() {
        const visibleTabs = this.getVisibleTabs();
        const tabs = this.upgradeTabs.querySelectorAll('.upgrade-tab');
        
        tabs.forEach(tab => {
            const tabType = tab.getAttribute('data-tab');
            const isVisible = visibleTabs.some(visibleTab => visibleTab.dataTab === tabType);
            if (isVisible) {
                tab.style.display = 'block';
            } else {
                tab.style.display = 'none';
            }
        });
    }
    
    // Anti-RSI Mode Methods
    bindAntiRsiEvents() {
        // Keyboard events for Anti-RSI Mode
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isSpacebarHeld) {
                e.preventDefault();
                this.isSpacebarHeld = true;
                this.startSpacebarHoldTimer();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.isSpacebarHeld = false;
                this.stopSpacebarHoldTimer();
                this.stopAntiRsiClicking();
            }
        });
        
        // Toggle switch event
        const antiRsiToggle = document.getElementById('antiRsiToggle');
        if (antiRsiToggle) {
            antiRsiToggle.addEventListener('change', (e) => {
                this.antiRsiModeEnabled = e.target.checked;
                this.saveGame();
            });
        }
    }
    
    startSpacebarHoldTimer() {
        if (!this.antiRsiModeUnlocked) {
            this.spacebarHeldTime = 0;
            this.spacebarInterval = setInterval(() => {
                this.spacebarHeldTime += 100;
                if (this.spacebarHeldTime >= 2000) { // 2 seconds
                    this.unlockAntiRsiMode();
                    this.stopSpacebarHoldTimer();
                }
            }, 100);
        } else if (this.antiRsiModeEnabled) {
            // Start anti-RSI clicking after a brief delay to prevent immediate clicking
            setTimeout(() => {
                if (this.isSpacebarHeld) {
                    this.startAntiRsiClicking();
                }
            }, 333); // Wait 1/3 second before starting
        }
    }
    
    stopSpacebarHoldTimer() {
        if (this.spacebarInterval) {
            clearInterval(this.spacebarInterval);
            this.spacebarInterval = null;
        }
    }
    
    unlockAntiRsiMode() {
        this.antiRsiModeUnlocked = true;
        this.antiRsiModeEnabled = true; // Default to enabled once unlocked
        
        // Show the toggle switch
        const antiRsiContainer = document.getElementById('antiRsiContainer');
        if (antiRsiContainer) {
            antiRsiContainer.style.display = 'block';
        }
        
        // Set the toggle switch to checked
        const antiRsiToggle = document.getElementById('antiRsiToggle');
        if (antiRsiToggle) {
            antiRsiToggle.checked = true;
        }
        
        // Show toast notification
        this.showToast('Toggle for anti-RSI mode activated.');
        
        // Save the game state
        this.saveGame();
    }
    
    startAntiRsiClicking() {
        if (!this.antiRsiClickInterval && this.antiRsiModeEnabled) {
            this.antiRsiClickInterval = setInterval(() => {
                if (this.isSpacebarHeld) {
                    this.handleClick(null, true); // Pass true to indicate it's from anti-RSI mode
                }
            }, 333); // Click every 1/3 second (3 times per second)
        }
    }
    
    stopAntiRsiClicking() {
        if (this.antiRsiClickInterval) {
            clearInterval(this.antiRsiClickInterval);
            this.antiRsiClickInterval = null;
        }
    }
    
    showToast(message) {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message;
            toast.classList.add('show');
            
            // Hide toast after 3 seconds
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
    }
    
    prestige() {
        const basePrestigePoints = Math.floor(Math.sqrt(this.totalPopePoints / 1e6));
        if (basePrestigePoints > 0) {
            // Apply prestige mastery multiplier
            const prestigeMasteryUpgrade = this.prestigeUpgrades.find(u => u.id === 'prestige_multiplier');
            const prestigeMultiplier = prestigeMasteryUpgrade ? prestigeMasteryUpgrade.effect(prestigeMasteryUpgrade.level) : 1;
            const prestigePointsEarned = Math.floor(basePrestigePoints * prestigeMultiplier);
            
            if (confirm(`Are you sure you want to prestige for ${prestigePointsEarned} prestige points? Your game will reset, but you will gain permanent bonuses.`)) {
                this.prestigePoints += prestigePointsEarned;
                this.totalPopePoints = 0;
                this.resetSave(false); // Soft reset, don't clear prestige
            }
        } else {
            alert('You need at least 1,000,000 total Nature Valley Bars to prestige!');
        }
    }

    resetSave(fullReset = true) {
        if (fullReset) {
            localStorage.removeItem('popeClickerSave');
            this.prestigePoints = 0;
            this.prestigeUpgrades.forEach(upg => {
                upg.level = 0;
                upg.cost = upg.baseCost;
            });
        }

        // Apply starting bonus from prestige upgrade
        const startingBonusUpgrade = this.prestigeUpgrades.find(u => u.id === 'starting_bonus');
        const startingBonus = startingBonusUpgrade ? startingBonusUpgrade.effect(startingBonusUpgrade.level) : 0;
        
        this.popePoints = startingBonus;
        this.totalPopePoints = startingBonus;
        this.upgrades.forEach(upg => {
            upg.count = 0;
            upg.cost = upg.baseCost;
        });

        this.calculatePointsPerSecond();
        this.calculateClickPower();
        this.updateDisplay();
        this.renderUpgrades();
        this.renderTabs();
    }

    // Initialize DOM elements and game loop
    initializeElements() {
        this.popeImage = document.getElementById('popeImage');
        this.clickEffect = document.getElementById('clickEffect');
        this.clickCounter = document.getElementById('clickCounter');
        this.popePointsDisplay = document.getElementById('popePoints');
        this.perSecondDisplay = document.getElementById('perSecond');
        this.clickPowerDisplay = document.getElementById('clickPower');
        this.prestigePointsDisplay = document.getElementById('prestigePoints');
        this.upgradesContainer = document.getElementById('upgradesContainer');
        this.upgradeTabs = document.getElementById('upgradeTabs');
        
        // Debug buttons
        const resetSaveBtn = document.getElementById('resetSave');
        const debugUnlockBtn = document.getElementById('debugUnlock');
        const prestigeBtn = document.getElementById('prestige');
        
        if (resetSaveBtn) {
            resetSaveBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to reset your save? This cannot be undone.')) {
                    this.resetSave();
                }
            });
        }
        
        if (debugUnlockBtn) {
            debugUnlockBtn.addEventListener('click', () => {
                this.popePoints = 1e15;
                this.totalPopePoints = 1e15;
                this.prestigePoints = 100;
                this.antiRsiModeUnlocked = true;
                this.antiRsiModeEnabled = true;
                const antiRsiContainer = document.getElementById('antiRsiContainer');
                if (antiRsiContainer) {
                    antiRsiContainer.style.display = 'block';
                }
                const antiRsiToggle = document.getElementById('antiRsiToggle');
                if (antiRsiToggle) {
                    antiRsiToggle.checked = true;
                }
                this.updateDisplay();
                this.renderUpgrades();
                this.renderTabs();
            });
        }
        
        if (prestigeBtn) {
            prestigeBtn.addEventListener('click', () => {
                this.prestige();
            });
        }
    }

    startGameLoop() {
        // Game loop that runs every 100ms
        this.gameLoopInterval = setInterval(() => {
            if (this.pointsPerSecond > 0) {
                this.popePoints += this.pointsPerSecond * 0.1; // 100ms intervals
                this.totalPopePoints += this.pointsPerSecond * 0.1;
                this.updateDisplay();
            }
        }, 100);
        
        // Auto-save every 30 seconds
        this.autoSaveInterval = setInterval(() => {
            this.saveGame();
        }, 30000);
    }

    loadGame() {
        try {
            const savedGame = localStorage.getItem('popeClickerSave');
            if (savedGame) {
                const gameState = JSON.parse(savedGame);
                
                // Load basic state
                this.popePoints = gameState.popePoints || 0;
                this.totalPopePoints = gameState.totalPopePoints || 0;
                this.prestigePoints = gameState.prestigePoints || 0;
                this.antiRsiModeUnlocked = gameState.antiRsiModeUnlocked || false;
                this.antiRsiModeEnabled = gameState.antiRsiModeEnabled || false;
                
                // Load upgrades
                if (gameState.upgrades) {
                    gameState.upgrades.forEach(savedUpgrade => {
                        const upgrade = this.upgrades.find(u => u.id === savedUpgrade.id);
                        if (upgrade) {
                            upgrade.count = savedUpgrade.count || 0;
                            upgrade.cost = savedUpgrade.cost || upgrade.baseCost;
                        }
                    });
                }
                
                // Load prestige upgrades
                if (gameState.prestigeUpgrades) {
                    gameState.prestigeUpgrades.forEach(savedUpgrade => {
                        const upgrade = this.prestigeUpgrades.find(u => u.id === savedUpgrade.id);
                        if (upgrade) {
                            upgrade.level = savedUpgrade.level || 0;
                        }
                    });
                }
                
                // Show Anti-RSI toggle if unlocked
                if (this.antiRsiModeUnlocked) {
                    const antiRsiContainer = document.getElementById('antiRsiContainer');
                    if (antiRsiContainer) {
                        antiRsiContainer.style.display = 'block';
                    }
                    const antiRsiToggle = document.getElementById('antiRsiToggle');
                    if (antiRsiToggle) {
                        antiRsiToggle.checked = this.antiRsiModeEnabled;
                    }
                }
                
                // Recalculate values
                this.calculatePointsPerSecond();
                this.calculateClickPower();
                this.updateDisplay();
                
                return true;
            }
        } catch (error) {
            console.error('Failed to load game:', error);
        }
        return false;
    }

    saveGame() {
        try {
            const gameState = {
                popePoints: this.popePoints,
                totalPopePoints: this.totalPopePoints,
                prestigePoints: this.prestigePoints,
                antiRsiModeUnlocked: this.antiRsiModeUnlocked,
                antiRsiModeEnabled: this.antiRsiModeEnabled,
                upgrades: this.upgrades.map(upgrade => ({
                    id: upgrade.id,
                    count: upgrade.count,
                    cost: upgrade.cost
                })),
                prestigeUpgrades: this.prestigeUpgrades.map(upgrade => ({
                    id: upgrade.id,
                    level: upgrade.level
                }))
            };
            
            localStorage.setItem('popeClickerSave', JSON.stringify(gameState));
        } catch (error) {
            console.error('Failed to save game:', error);
        }
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
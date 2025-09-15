// Theme Manager - Handles theme switching functionality
export class ThemeManager {
  constructor() {
    this.themes = [
      'pastel',
      'dark',
      'gothic',
      'forest',
      'cyberpunk',
      'glassmorphism',
      'galaxy',
      'vintage-newspaper',
      'matrix',
      'futuristic-hud',
      'desert'
    ];
    
    this.autoThemeInterval = null;
  }

  init() {
    this.createThemeControls();
    this.loadSavedTheme();
    this.setupEventListeners();
  }

  createThemeControls() {
    const themeButton = document.getElementById('theme-button');
    if (!themeButton) return;

    // Create auto-theme container
    const autoThemeContainer = document.createElement('div');
    autoThemeContainer.className = 'auto-theme-container';
    autoThemeContainer.style.display = 'flex';
    autoThemeContainer.style.alignItems = 'center';
    autoThemeContainer.style.marginTop = '8px';
    
    // Create checkbox
    const autoThemeCheckbox = document.createElement('input');
    autoThemeCheckbox.type = 'checkbox';
    autoThemeCheckbox.id = 'auto-theme-toggle';
    autoThemeCheckbox.style.margin = '0 5px 0 0';
    
    // Load saved preference
    const autoSwitchEnabled = localStorage.getItem('autoThemeSwitch') === 'true';
    autoThemeCheckbox.checked = autoSwitchEnabled;
    
    // Create label
    const autoThemeLabel = document.createElement('label');
    autoThemeLabel.htmlFor = 'auto-theme-toggle';
    autoThemeLabel.textContent = 'Auto-switch';
    autoThemeLabel.style.fontSize = '14px';
    autoThemeLabel.style.color = 'white';
    
    autoThemeContainer.appendChild(autoThemeCheckbox);
    autoThemeContainer.appendChild(autoThemeLabel);

    // Create theme container wrapper
    let themeContainer = themeButton.parentElement;
    
    if (!themeContainer.classList.contains('theme-controls')) {
      themeContainer = document.createElement('div');
      themeContainer.className = 'theme-controls';
      themeContainer.style.display = 'flex';
      themeContainer.style.flexDirection = 'column';
      themeContainer.style.alignItems = 'center';
      
      themeButton.parentNode.insertBefore(themeContainer, themeButton);
      themeContainer.appendChild(themeButton);
    }
    
    themeContainer.appendChild(autoThemeContainer);
    
    // Store references
    this.autoThemeCheckbox = autoThemeCheckbox;
    this.themeButton = themeButton;
    
    // Initialize auto-switching
    this.initAutoThemeSwitching(autoSwitchEnabled);
  }

  setupEventListeners() {
    if (this.autoThemeCheckbox) {
      this.autoThemeCheckbox.addEventListener('change', (e) => {
        const isAutoEnabled = e.target.checked;
        localStorage.setItem('autoThemeSwitch', isAutoEnabled);
        this.initAutoThemeSwitching(isAutoEnabled);
      });
    }

    if (this.themeButton) {
      this.themeButton.addEventListener('click', () => {
        this.switchToNextTheme();
      });
    }
  }

  loadSavedTheme() {
    const savedTheme = localStorage.getItem('preferredTheme') || 'pastel';
    this.applyTheme(savedTheme);
    this.updateCurrentThemeDisplay(savedTheme);
  }

  switchToNextTheme() {
    const currentTheme = document.body.getAttribute('data-theme') || 'pastel';
    const currentIndex = this.themes.indexOf(currentTheme);
    const nextTheme = this.themes[(currentIndex + 1) % this.themes.length];
    
    this.applyTheme(nextTheme);
    localStorage.setItem('preferredTheme', nextTheme);
    this.updateCurrentThemeDisplay(nextTheme);
  }

  applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    document.body.classList.remove(...this.themes);
    document.body.classList.add(theme);
    
    // Trigger card color update if we have a UI manager reference
    if (window.uiManager) {
      window.uiManager.applyCardColors(theme);
    }
  }

  updateCurrentThemeDisplay(theme) {
    const currentThemeElement = document.getElementById('current-theme');
    if (currentThemeElement) {
      currentThemeElement.innerText = this.capitalizeFirstLetter(theme);
    }
  }

  initAutoThemeSwitching(enabled) {
    // Clear existing interval
    if (this.autoThemeInterval) {
      clearInterval(this.autoThemeInterval);
      this.autoThemeInterval = null;
    }
    
    if (enabled) {
      this.autoThemeInterval = setInterval(() => {
        this.switchToNextTheme();
      }, 60000); // Change theme every 1 minute
    }
  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  getCurrentTheme() {
    return document.body.getAttribute('data-theme') || 'pastel';
  }

  setTheme(theme) {
    if (this.themes.includes(theme)) {
      this.applyTheme(theme);
      localStorage.setItem('preferredTheme', theme);
      this.updateCurrentThemeDisplay(theme);
    }
  }

  getAvailableThemes() {
    return [...this.themes];
  }

  destroy() {
    if (this.autoThemeInterval) {
      clearInterval(this.autoThemeInterval);
      this.autoThemeInterval = null;
    }
  }
}
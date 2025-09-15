// js/app.js - Updated to work with your HTML structure
import { DOMManager } from './modules/domManager.js';
import { AudioManager } from './modules/audioManager.js';
import { UIManager } from './modules/uiManager.js';
import { ThemeManager } from './modules/themeManager.js';
import { NavigationManager } from './modules/navigationManager.js';
import { SearchManager } from './modules/searchManager.js';
import { EventManager } from './modules/eventManager.js';

class MusicPlayerApp {
  constructor() {
    // Check if required dependencies are available
    this.checkDependencies();
    
    // Initialize managers in proper order
    this.domManager = new DOMManager();
    this.audioManager = new AudioManager();
    this.uiManager = new UIManager(this.domManager, this.audioManager);
    this.themeManager = new ThemeManager();
    this.navigationManager = new NavigationManager(this.domManager, this.uiManager);
    
    // SearchManager now needs navigationManager reference
    this.searchManager = new SearchManager(this.domManager, this.uiManager, this.navigationManager);
    this.eventManager = new EventManager(this.audioManager, this.uiManager, this.navigationManager);
    
    // Make uiManager available globally for theme manager
    window.uiManager = this.uiManager;
  }

  checkDependencies() {
    const missing = [];
    
    if (typeof Swal === 'undefined') {
      missing.push('SweetAlert2 (Swal)');
    }
    
    if (typeof window.songs === 'undefined') {
      missing.push('Songs data');
    }
    
    if (typeof window.artists === 'undefined') {
      missing.push('Artists data');
    }
    
    if (missing.length > 0) {
      const errorMsg = `Missing dependencies: ${missing.join(', ')}`;
      console.error(errorMsg);
      alert(errorMsg + '\n\nPlease check your script loading order.');
      throw new Error(errorMsg);
    }
    
    console.log('✅ All dependencies loaded successfully');
  }

  async init() {
    try {
      console.log('🚀 Initializing Music Player App...');
      
      // Initialize all managers in correct order
      this.domManager.createNavbar();
      this.domManager.createFloatingWindow();
      this.domManager.createLoadingIndicator();
      
      this.uiManager.init();
      this.themeManager.init();
      this.eventManager.init();
      
      // Load initial content
      const initialSongs = await this.navigationManager.displayAllSongs();
      this.audioManager.setCurrentPlaylist(initialSongs);
      
      console.log('✅ Music Player App initialized successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize Music Player App:', error);
      alert('Failed to initialize the music player. Please refresh the page.');
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
  // Small delay to ensure all scripts are loaded
  setTimeout(async () => {
    try {
      const app = new MusicPlayerApp();
      await app.init();
    } catch (error) {
      console.error('Failed to start app:', error);
    }
  }, 100);
});
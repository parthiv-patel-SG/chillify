// js/app.js - Updated to include playlist management, queue system, and mini player
import { DOMManager } from './modules/domManager.js';
import { AudioManager } from './modules/audioManager.js';
import { UIManager } from './modules/uiManager.js';
import { ThemeManager } from './modules/themeManager.js';
import { NavigationManager } from './modules/navigationManager.js';
import { SearchManager } from './modules/searchManager.js';
import { EventManager } from './modules/eventManager.js';
import { PlaylistManager } from './modules/playlistManager.js';
import { QueueManager } from './modules/queueManager.js';
import { MiniPlayerManager } from './modules/miniPlayerManager.js';

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
    
    // SearchManager needs navigationManager reference
    this.searchManager = new SearchManager(this.domManager, this.uiManager, this.navigationManager);
    
    // New feature managers
    this.playlistManager = new PlaylistManager(this.domManager, this.uiManager, this.navigationManager);
    this.queueManager = new QueueManager(this.domManager, this.uiManager, this.audioManager);
    this.miniPlayerManager = new MiniPlayerManager(this.domManager, this.uiManager, this.audioManager);
    
    // EventManager comes last as it coordinates everything
    this.eventManager = new EventManager(this.audioManager, this.uiManager, this.navigationManager);
    
    // Make managers available globally for inter-manager communication
    this.setupGlobalReferences();
  }

  setupGlobalReferences() {
    // Make key managers available globally for cross-component communication
    window.uiManager = this.uiManager;
    window.eventManager = this.eventManager;
    window.playlistManager = this.playlistManager;
    window.queueManager = this.queueManager;
    window.miniPlayerManager = this.miniPlayerManager;
    window.audioManager = this.audioManager;
    window.navigationManager = this.navigationManager;
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
      console.log('🚀 Initializing Enhanced Music Player App...');
      
      // Initialize core components first
      this.domManager.createNavbar();
      this.domManager.createFloatingWindow();
      this.domManager.createLoadingIndicator();
      
      this.uiManager.init();
      this.themeManager.init();
      
      // Initialize new feature managers
      // PlaylistManager and QueueManager init are called in their constructors
      
      // Initialize event handling last
      this.eventManager.init();
      
      // Setup integrations between managers
      this.setupManagerIntegrations();
      
      // Load initial content
      const initialSongs = await this.navigationManager.displayAllSongs();
      this.audioManager.setCurrentPlaylist(initialSongs);
      
      // Setup audio event listeners for new features
      this.setupAudioEventListeners();
      
      // Setup keyboard shortcuts for mini player
      this.miniPlayerManager.setupKeyboardShortcuts();
      
      // Load saved mini player state
      this.miniPlayerManager.loadState();
      
      console.log('✅ Enhanced Music Player App initialized successfully!');
      console.log('🎵 New Features Available:');
      console.log('  • Playlist Management (Right-click songs or use Playlists dropdown)');
      console.log('  • Favorites System (❤️ button or right-click)');
      console.log('  • Queue Management (📋 button in player)');
      console.log('  • Mini Player Mode (Mini Player button)');
      console.log('  • Enhanced Shuffle (maintains context)');
      
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Music Player App:', error);
      alert('Failed to initialize the enhanced music player. Please refresh the page.');
    }
  }

  setupManagerIntegrations() {
    // Integrate queue manager with audio manager
    this.queueManager.integrateWithAudioManager();
    
    // Setup progress updates for mini player
    this.audioManager.updateProgress((percentage) => {
      // Original progress update
      const progressBar = document.getElementById("progress-bar");
      const floatingProgressBar = document.getElementById("floating-progress-bar");
      
      if (progressBar) {
        progressBar.style.width = `${percentage}%`;
      }
      
      if (floatingProgressBar) {
        floatingProgressBar.style.width = `${percentage}%`;
      }
      
      // Update mini player progress
      this.miniPlayerManager.onProgressUpdate(percentage);
    });
    
    // Update mini player when songs change
    const originalPlaySong = this.uiManager.playSong.bind(this.uiManager);
    this.uiManager.playSong = async function(song, index, element) {
      await originalPlaySong(song, index, element);
      window.miniPlayerManager.onSongChange();
    };
    
    // Update mini player on play/pause
    const originalTogglePlayPause = this.audioManager.togglePlayPause.bind(this.audioManager);
    this.audioManager.togglePlayPause = function() {
      const result = originalTogglePlayPause();
      window.miniPlayerManager.onPlayStateChange();
      return result;
    };
  }

  setupAudioEventListeners() {
    // Enhanced song end handling to check queue first
    this.audioManager.setOnSongEnd(() => {
      // Check if there are songs in queue first
      const nextQueueSong = this.queueManager.getNextQueueSong();
      
      if (nextQueueSong) {
        // Play from queue
        const currentPlaylist = this.audioManager.getCurrentPlaylist();
        let songIndex = currentPlaylist.findIndex(s => s.id === nextQueueSong.id);
        
        if (songIndex === -1) {
          // Add to playlist temporarily
          currentPlaylist.push(nextQueueSong);
          songIndex = currentPlaylist.length - 1;
        }
        
        this.uiManager.playSong(nextQueueSong, songIndex, null);
      } else {
        // Use default next song behavior
        this.eventManager.playNextSong();
      }
    });

    // Update queue display when playlist changes
    const originalSetCurrentPlaylist = this.audioManager.setCurrentPlaylist.bind(this.audioManager);
    this.audioManager.setCurrentPlaylist = function(playlist) {
      originalSetCurrentPlaylist(playlist);
      // Update queue display if it's visible
      const queuePanel = document.getElementById("queue-panel");
      if (queuePanel && queuePanel.style.display !== "none") {
        window.queueManager.updateQueueDisplay();
      }
    };
  }

  // Utility methods for managing the app
  getManagerState() {
    return {
      isMinimized: this.miniPlayerManager.getIsMinimized(),
      currentContext: this.navigationManager.getCurrentContext(),
      queueLength: this.queueManager.getQueueLength(),
      playlistCount: this.playlistManager.getPlaylists().length,
      favoritesCount: this.playlistManager.getFavorites().length,
      isShuffleMode: this.queueManager.isShuffleModeEnabled()
    };
  }

  // Export user data (playlists and favorites)
  exportUserData() {
    const userData = {
      playlists: this.playlistManager.getPlaylists(),
      favorites: this.playlistManager.getFavorites(),
      settings: {
        theme: this.themeManager.getCurrentTheme(),
        viewMode: this.domManager.getIsCardView() ? 'card' : 'list',
        miniPlayerPosition: this.miniPlayerManager.getLastPosition()
      },
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `chillify-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    console.log('User data exported successfully');
  }

  // Import user data
  importUserData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const userData = JSON.parse(e.target.result);
        
        // Import playlists
        if (userData.playlists) {
          localStorage.setItem('musicPlayer_playlists', JSON.stringify(userData.playlists));
          this.playlistManager.playlists = userData.playlists;
          this.playlistManager.updatePlaylistDropdown();
        }
        
        // Import favorites
        if (userData.favorites) {
          localStorage.setItem('musicPlayer_favorites', JSON.stringify(userData.favorites));
          this.playlistManager.favorites = userData.favorites;
        }
        
        // Import settings
        if (userData.settings) {
          if (userData.settings.theme) {
            this.themeManager.setTheme(userData.settings.theme);
          }
          if (userData.settings.viewMode) {
            const isCardView = userData.settings.viewMode === 'card';
            if (isCardView !== this.domManager.getIsCardView()) {
              this.domManager.toggleViewMode();
            }
          }
          if (userData.settings.miniPlayerPosition) {
            this.miniPlayerManager.setPosition(
              userData.settings.miniPlayerPosition.x,
              userData.settings.miniPlayerPosition.y
            );
          }
        }
        
        alert('User data imported successfully!');
        console.log('User data imported successfully');
        
      } catch (error) {
        console.error('Failed to import user data:', error);
        alert('Failed to import user data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  }

  // Cleanup method
  destroy() {
    console.log('🛑 Shutting down Enhanced Music Player App...');
    
    // Save current state
    this.miniPlayerManager.destroy();
    this.themeManager.destroy();
    
    // Clean up global references
    delete window.uiManager;
    delete window.eventManager;
    delete window.playlistManager;
    delete window.queueManager;
    delete window.miniPlayerManager;
    delete window.audioManager;
    delete window.navigationManager;
    
    console.log('✅ App shutdown complete');
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
  // Small delay to ensure all scripts are loaded
  setTimeout(async () => {
    try {
      const app = new MusicPlayerApp();
      await app.init();
      
      // Make app instance globally available for debugging/advanced usage
      window.musicPlayerApp = app;
      
      // Setup cleanup on page unload
      window.addEventListener('beforeunload', () => {
        app.destroy();
      });
      
    } catch (error) {
      console.error('Failed to start enhanced app:', error);
    }
  }, 100);
});
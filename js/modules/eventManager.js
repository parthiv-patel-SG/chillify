// Event Manager - Handles all event listeners and user interactions
export class EventManager {
  constructor(audioManager, uiManager, navigationManager) {
    this.audioManager = audioManager;
    this.uiManager = uiManager;
    this.navigationManager = navigationManager;
    // Add direct reference to domManager for easier access
    this.domManager = uiManager.domManager;
  }

  init() {
    this.setupNavigationEvents();
    this.setupAudioControlEvents();
    this.setupKeyboardShortcuts();
    this.setupTouchEvents();
    this.setupViewToggleEvents();
    this.setupAudioEvents();
  }

  setupNavigationEvents() {
    const allSongsBtn = document.getElementById("all-songs-btn");
    const shuffleBtn = document.getElementById("shuffle-btn");
    const explicitBtn = document.getElementById("explicit-btn");

    if (allSongsBtn) {
      allSongsBtn.addEventListener("click", () => {
        this.navigationManager.displayAllSongs().then(songs => {
          this.audioManager.setCurrentPlaylist(songs);
        });
      });
    }

    if (shuffleBtn) {
      shuffleBtn.addEventListener("click", () => {
        // Use the new context-aware shuffle method
        this.navigationManager.shuffleCurrentContext().then(songs => {
          this.audioManager.setCurrentPlaylist(songs);
        });
      });
    }

    if (explicitBtn) {
      explicitBtn.addEventListener("click", () => {
        this.navigationManager.displayExplicitSongs().then(songs => {
          if (songs) {
            this.audioManager.setCurrentPlaylist(songs);
          }
        });
      });
    }

    // Create artist buttons
    this.navigationManager.createArtistButtons();
  }

  setupAudioControlEvents() {
    const prevBtn = document.getElementById("prev-btn");
    const playPauseBtn = document.getElementById("play-pause-btn");
    const nextBtn = document.getElementById("next-btn");

    if (prevBtn) {
      prevBtn.addEventListener("click", () => this.playPreviousSong());
    }

    if (playPauseBtn) {
      playPauseBtn.addEventListener("click", () => this.togglePlayPause());
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => this.playNextSong());
    }
  }

  setupViewToggleEvents() {
    const viewToggleBtn = document.getElementById("view-toggle-btn");
    if (viewToggleBtn) {
      viewToggleBtn.addEventListener("click", async () => {
        // Toggle the view mode
        const newViewMode = this.domManager.toggleViewMode();
        
        // Get current context songs from navigation manager
        const currentContextSongs = this.navigationManager.getCurrentContextSongs();
        if (currentContextSongs.length > 0) {
          // Reload current context with new view
          await this.uiManager.loadSongsInBatches(currentContextSongs);
        } else {
          // Fallback to displaying all songs if no current context
          const songs = await this.navigationManager.displayAllSongs();
          this.audioManager.setCurrentPlaylist(songs);
        }
      });
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Prevent default behavior when target is body (not in input fields)
      if (e.target === document.body) {
        switch (e.code) {
          case 'Space':
            e.preventDefault();
            this.togglePlayPause();
            break;
        }
      }

      // Alt key combinations work everywhere
      if (e.altKey) {
        switch (e.code) {
          case 'ArrowRight':
            e.preventDefault();
            this.playNextSong();
            break;
          case 'ArrowLeft':
            e.preventDefault();
            this.playPreviousSong();
            break;
          case 'KeyV':
            e.preventDefault();
            document.getElementById("view-toggle-btn")?.click();
            break;
          case 'KeyS':
            e.preventDefault();
            // Alt+S to shuffle current context
            document.getElementById("shuffle-btn")?.click();
            break;
          case 'KeyA':
            e.preventDefault();
            // Alt+A to shuffle current artist (if in artist view)
            this.shuffleCurrentArtist();
            break;
        }
      }
    });
  }

  setupTouchEvents() {
    const navbarScroll = document.getElementById("music-navbar-scroll");
    if (!navbarScroll) return;

    let touchStartX = 0;

    navbarScroll.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });

    navbarScroll.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const swipeDistance = touchEndX - touchStartX;

      if (Math.abs(swipeDistance) > 50) {
        navbarScroll.scrollBy({
          left: -swipeDistance,
          behavior: 'smooth'
        });
      }
    });
  }

  setupAudioEvents() {
    // Set up callback for when a song ends
    this.audioManager.setOnSongEnd(() => {
      this.playNextSong();
    });
  }

  // New method to shuffle current artist specifically
  shuffleCurrentArtist() {
    this.navigationManager.shuffleCurrentArtist().then(songs => {
      if (songs && songs.length > 0) {
        this.audioManager.setCurrentPlaylist(songs);
      } else {
        console.log('No artist songs to shuffle or not in artist view');
      }
    });
  }

  togglePlayPause() {
    const isPlaying = this.audioManager.togglePlayPause();
    this.uiManager.updatePlayPauseButton();
    return isPlaying;
  }

  playNextSong() {
    const nextSongData = this.audioManager.getNextSong();
    if (!nextSongData) return;

    const { song, index } = nextSongData;
    const domManager = this.uiManager.domManager;
    const isCardView = domManager.getIsCardView();
    
    // Find the DOM element for the next song
    const selector = isCardView 
      ? `.card[data-index="${index}"]` 
      : `.list-item[data-index="${index}"]`;
    const nextElement = document.querySelector(selector);

    if (song && nextElement) {
      this.uiManager.playSong(song, index, nextElement);
      nextElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  playPreviousSong() {
    const prevSongData = this.audioManager.getPreviousSong();
    if (!prevSongData) return;

    const { song, index } = prevSongData;
    const domManager = this.uiManager.domManager;
    const isCardView = domManager.getIsCardView();
    
    // Find the DOM element for the previous song
    const selector = isCardView 
      ? `.card[data-index="${index}"]` 
      : `.list-item[data-index="${index}"]`;
    const prevElement = document.querySelector(selector);

    if (song && prevElement) {
      this.uiManager.playSong(song, index, prevElement);
      prevElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  // Utility method to add custom event listeners
  addEventListener(element, event, handler) {
    if (element && typeof handler === 'function') {
      element.addEventListener(event, handler);
    }
  }

  // Utility method to remove event listeners
  removeEventListener(element, event, handler) {
    if (element && typeof handler === 'function') {
      element.removeEventListener(event, handler);
    }
  }

  // Clean up method
  destroy() {
    // Remove all event listeners if needed
    // This would be useful for cleanup when destroying the app
  }
}
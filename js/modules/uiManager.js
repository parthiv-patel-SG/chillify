// UI Manager - Handles UI updates and interactions
export class UIManager {
  constructor(domManager, audioManager) {
    this.domManager = domManager;
    this.audioManager = audioManager;
  }

  init() {
    this.setupProgressBarSeeking();
    this.addListViewStyles();
    this.setupAudioProgressUpdates();
  }

  async loadSongsInBatches(songsToLoad, batchSize = 6) {
    return new Promise((resolve) => {
      const totalSongs = songsToLoad.length;
      let loadedCount = 0;
      
      this.domManager.showLoadingIndicator(true);
      this.domManager.clearContainer();
      
      const isCardView = this.domManager.getIsCardView();
      this.domManager.setContainerMode(isCardView);
      
      const loadBatch = (startIndex) => {
        const endIndex = Math.min(startIndex + batchSize, totalSongs);
        const cardContainer = this.domManager.getElements().cardContainer;
        
        for (let i = startIndex; i < endIndex; i++) {
          const item = isCardView 
            ? this.domManager.createSongCard(songsToLoad[i], i)
            : this.domManager.createSongListItem(songsToLoad[i], i);
            
          // Add click event listeners
          this.addSongClickListeners(item, songsToLoad[i], i);
          cardContainer.appendChild(item);
          loadedCount++;
        }
        
        const progress = Math.min(100, Math.round((loadedCount / totalSongs) * 100));
        this.domManager.updateLoadingProgress(progress);
        
        if (endIndex < totalSongs) {
          setTimeout(() => loadBatch(endIndex), 10);
        } else {
          // Apply theme colors if in card view
          if (isCardView) {
            const currentTheme = document.body.getAttribute('data-theme') || 'pastel';
            this.applyCardColors(currentTheme);
          }
          
          setTimeout(() => {
            this.domManager.showLoadingIndicator(false);
            resolve();
          }, 200);
        }
      };
      
      loadBatch(0);
    });
  }

  addSongClickListeners(element, song, index) {
    const playButton = element.querySelector('.play-button, .list-play-button');
    
    if (playButton) {
      playButton.addEventListener("click", (e) => {
        e.stopPropagation();
        this.playSong(song, index, element);
      });
    }
    
    element.addEventListener("click", () => {
      this.playSong(song, index, element);
    });
  }

  async playSong(song, index, element) {
    const onPlay = () => {
      this.updateFloatingWindow(song.title, element);
      this.updatePlayPauseButton();
      this.highlightPlayingElement(element);
    };
    
    const onError = (error) => {
      alert("Unable to play this song. Please try another one.");
    };
    
    await this.audioManager.playSong(song, index, onPlay, onError);
  }

  highlightPlayingElement(element) {
    const isCardView = this.domManager.getIsCardView();
    
    if (isCardView) {
      // Highlight cards in card view
      document.querySelectorAll(".card").forEach(c => {
        c.style.border = "none";
        c.style.transform = "scale(1)";
      });
      
      element.style.border = "2px solid #1DB954";
      element.style.transform = "scale(1.03)";
    } else {
      // Highlight list items in list view
      document.querySelectorAll(".list-item").forEach(item => {
        item.style.backgroundColor = "rgba(25, 25, 25, 0.6)";
        item.style.borderLeft = "none";
      });
      
      element.style.backgroundColor = "rgba(40, 40, 40, 0.8)";
      element.style.borderLeft = "4px solid #1DB954";
    }
  }

  updateFloatingWindow(songTitle, element) {
    const floatingWindow = document.getElementById("floating-window");
    if (!floatingWindow) return;
    
    document.getElementById("floating-song-title").textContent = `Now Playing: ${songTitle}`;
    floatingWindow.style.display = "flex";
    
    floatingWindow.dataset.currentIndex = element.dataset.index;
    
    // Add click event to scroll to the song
    const songTitleElement = document.getElementById("floating-song-title");
    if (songTitleElement) {
      songTitleElement.removeEventListener("click", this.scrollToCurrentSong);
      songTitleElement.addEventListener("click", this.scrollToCurrentSong.bind(this));
    }
  }

  scrollToCurrentSong() {
    const currentIndex = this.audioManager.getCurrentIndex();
    const isCardView = this.domManager.getIsCardView();
    
    const selector = isCardView 
      ? `.card[data-index="${currentIndex}"]` 
      : `.list-item[data-index="${currentIndex}"]`;
      
    const currentElement = document.querySelector(selector);
    if (currentElement) {
      currentElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  updatePlayPauseButton() {
    const playPauseBtn = document.getElementById("play-pause-btn");
    if (!playPauseBtn) return;
    
    const isPlaying = this.audioManager.getIsPlaying();
    playPauseBtn.textContent = isPlaying ? "⏸" : "▶️";
  }

  setupProgressBarSeeking() {
    const progressContainer = document.getElementById("progress-container");
    const floatingProgressContainer = document.getElementById("floating-progress-container");
    
    if (progressContainer) {
      progressContainer.addEventListener("click", (e) => {
        if (!this.audioManager.getCurrentAudio()) return;
        
        const percent = (e.offsetX / progressContainer.offsetWidth);
        this.audioManager.seekTo(percent);
      });
    }
    
    if (floatingProgressContainer) {
      floatingProgressContainer.addEventListener("click", (e) => {
        if (!this.audioManager.getCurrentAudio()) return;
        
        const percent = (e.offsetX / floatingProgressContainer.offsetWidth);
        this.audioManager.seekTo(percent);
      });
    }
  }

  setupAudioProgressUpdates() {
    this.audioManager.updateProgress((percentage) => {
      const progressBar = document.getElementById("progress-bar");
      const floatingProgressBar = document.getElementById("floating-progress-bar");
      
      if (progressBar) {
        progressBar.style.width = `${percentage}%`;
      }
      
      if (floatingProgressBar) {
        floatingProgressBar.style.width = `${percentage}%`;
      }
    });
  }

  highlightButton(button) {
    document.querySelectorAll("#music-navbar-scroll button").forEach((btn) => {
      btn.style.background = "#444";
      btn.style.transform = "scale(1)";
      btn.style.boxShadow = "none";
    });
    
    button.style.background = "linear-gradient(135deg, #ff8c00, #ff2e63)";
    button.style.transform = "scale(1.05)";
    button.style.boxShadow = "0 0 8px rgba(255, 140, 0, 0.7)";
    
    // Scroll to center of button
    const navbarScroll = document.getElementById("music-navbar-scroll");
    if (navbarScroll) {
      setTimeout(() => {
        const scrollPos = button.offsetLeft - (navbarScroll.clientWidth / 2) + (button.clientWidth / 2);
        navbarScroll.scrollTo({
          left: scrollPos,
          behavior: 'smooth'
        });
      }, 50);
    }
  }

  applyCardColors(theme) {
    const songCards = document.querySelectorAll('.card');
    
    const colors = {
      pastel: ['#FFB6C1', '#BFD8B8', '#A2DFF7', '#FFE156', '#FF8B94'],
      dark: ['#1F1F1F', '#2E2E2E', '#393939', '#4C4C4C', '#606060'],
      gothic: ['#2B2B2B', '#6F1F8D', '#D53D4B', '#000000', '#A2A2A2'],
      forest: ['#2E8B57', '#3CB371', '#228B22', '#6B8E23', '#98FB98'],
      cyberpunk: ['#00FFAB', '#FF00A0', '#FF00D9', '#0D00FF', '#D500F9'],
      glassmorphism: ['#FFFFFF', '#A9A9A9', '#F0F0F0', '#D3D3D3', '#EAEAEA'],
      galaxy: ['#2F3A54', '#423C58', '#6C55A1', '#9E77D3', '#4B3F5B'],
      'vintage-newspaper': ['#C1B897', '#D1C7B7', '#B69A6E', '#9E7A4A', '#6A4E3A'],
      matrix: ['#00FF00', '#00FF33', '#00CC00', '#003300', '#003333'],
      'futuristic-hud': ['#18A0FB', '#0F8DFF', '#0D72E3', '#1D1F2E', '#1F2529'],
      desert: ['#D17B5B', '#DB9F7F', '#E4C29B', '#C68E17', '#9A7A3A']
    };
    
    const themeColors = colors[theme] || colors.pastel;
    
    songCards.forEach(card => {
      const randomColor = themeColors[Math.floor(Math.random() * themeColors.length)];
      card.style.backgroundColor = randomColor;
    });
  }

  addListViewStyles() {
    const listViewStyle = document.createElement('style');
    listViewStyle.textContent = `
      .list-container {
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
        padding: 10px;
      }
      
      .list-item:hover {
        background-color: rgba(40, 40, 40, 0.8) !important;
        transform: translateX(5px);
      }
      
      body[data-theme="pastel"] .list-item {
        background-color: rgba(255, 230, 240, 0.5);
        color: #333;
      }
      
      body[data-theme="dark"] .list-item {
        background-color: rgba(25, 25, 25, 0.8);
        color: #eee;
      }
      
      body[data-theme="matrix"] .list-item {
        background-color: rgba(0, 20, 0, 0.8);
        color: #00FF00;
      }
      
      body[data-theme="cyberpunk"] .list-item {
        background-color: rgba(20, 0, 30, 0.7);
        color: #FF00A0;
        border-left: 1px solid #00FFAB;
      }
    `;
    document.head.appendChild(listViewStyle);
  }
}
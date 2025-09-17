// Mini Player Manager - Handles compact always-on-top player mode
export class MiniPlayerManager {
  constructor(domManager, uiManager, audioManager) {
    this.domManager = domManager;
    this.uiManager = uiManager;
    this.audioManager = audioManager;
    
    this.miniPlayer = null;
    this.isMinimized = false;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.lastPosition = { x: 20, y: 20 };
    
    this.init();
  }

  init() {
    this.createMiniPlayerToggle();
    this.addMiniPlayerStyles();
    this.loadState();
  }

  createMiniPlayerToggle() {
    // Add mini player toggle to the main header
    const themeContainer = document.getElementById("theme-container");
    if (!themeContainer) return;

    const miniPlayerToggle = document.createElement("button");
    miniPlayerToggle.id = "mini-player-toggle";
    miniPlayerToggle.textContent = "Mini Player";
    miniPlayerToggle.title = "Toggle Mini Player Mode";
    miniPlayerToggle.style.cssText = `
      padding: 8px 16px;
      margin-left: 10px;
      border: 1px solid #444;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border-radius: 20px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s ease;
    `;

    themeContainer.appendChild(miniPlayerToggle);

    miniPlayerToggle.addEventListener("click", () => {
      this.toggleMiniPlayer();
    });

    // Also add to floating window for easy access
    this.addMiniPlayerButtonToFloating();
  }

  addMiniPlayerButtonToFloating() {
    const floatingWindow = document.getElementById("floating-window");
    if (!floatingWindow) return;

    const miniBtn = document.createElement("button");
    miniBtn.id = "mini-btn";
    miniBtn.innerHTML = "🔳";
    miniBtn.title = "Mini Player";
    miniBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 16px;
      cursor: pointer;
      padding: 5px;
      margin-left: 8px;
    `;

    // Insert before queue button or at the end
    const queueBtn = document.getElementById("queue-btn");
    if (queueBtn) {
      floatingWindow.insertBefore(miniBtn, queueBtn);
    } else {
      const progressContainer = document.getElementById("floating-progress-container");
      if (progressContainer) {
        floatingWindow.insertBefore(miniBtn, progressContainer);
      }
    }

    miniBtn.addEventListener("click", () => {
      this.toggleMiniPlayer();
    });
  }

  toggleMiniPlayer() {
    if (this.isMinimized) {
      this.exitMiniPlayer();
    } else {
      this.enterMiniPlayer();
    }
  }

  enterMiniPlayer() {
    if (this.isMinimized) return;

    this.createMiniPlayer();
    this.hideMainInterface();
    this.isMinimized = true;
    
    // Update toggle button states
    this.updateToggleButtons(true);
    
    console.log("Entered Mini Player mode");
  }

  exitMiniPlayer() {
    if (!this.isMinimized) return;

    this.removeMiniPlayer();
    this.showMainInterface();
    this.isMinimized = false;
    
    // Update toggle button states
    this.updateToggleButtons(false);
    
    console.log("Exited Mini Player mode");
  }

  createMiniPlayer() {
    if (this.miniPlayer) return;

    this.miniPlayer = document.createElement("div");
    this.miniPlayer.id = "mini-player";
    this.miniPlayer.className = "mini-player";
    
    // Get current song info
    const currentSong = this.getCurrentSongInfo();
    
    this.miniPlayer.innerHTML = `
      <div class="mini-player-header">
        <div class="mini-player-drag-handle">⋮⋮</div>
        <div class="mini-player-close" title="Exit Mini Player">✖</div>
      </div>
      <div class="mini-player-content">
        <div class="mini-player-info">
          <div class="mini-song-title">${currentSong.title}</div>
          <div class="mini-song-artist">${currentSong.artist}</div>
        </div>
        <div class="mini-player-controls">
          <button class="mini-prev-btn" title="Previous">⏮</button>
          <button class="mini-play-pause-btn" title="Play/Pause">${currentSong.isPlaying ? "⏸" : "▶️"}</button>
          <button class="mini-next-btn" title="Next">⏭</button>
        </div>
        <div class="mini-progress-container">
          <div class="mini-progress-bar"></div>
        </div>
        <div class="mini-player-extras">
          <button class="mini-queue-btn" title="Queue">📋</button>
          <button class="mini-volume-btn" title="Volume">🔊</button>
          <button class="mini-expand-btn" title="Expand">🔍</button>
        </div>
      </div>
    `;

    // Position mini player
    this.miniPlayer.style.left = `${this.lastPosition.x}px`;
    this.miniPlayer.style.top = `${this.lastPosition.y}px`;

    document.body.appendChild(this.miniPlayer);
    
    this.setupMiniPlayerEvents();
    this.updateMiniPlayerInfo();
  }

  removeMiniPlayer() {
    if (this.miniPlayer) {
      // Save position before removing
      const rect = this.miniPlayer.getBoundingClientRect();
      this.lastPosition = { x: rect.left, y: rect.top };
      
      this.miniPlayer.remove();
      this.miniPlayer = null;
    }
  }

  setupMiniPlayerEvents() {
    if (!this.miniPlayer) return;

    // Close button
    const closeBtn = this.miniPlayer.querySelector(".mini-player-close");
    closeBtn.addEventListener("click", () => {
      this.exitMiniPlayer();
    });

    // Expand button
    const expandBtn = this.miniPlayer.querySelector(".mini-expand-btn");
    expandBtn.addEventListener("click", () => {
      this.exitMiniPlayer();
    });

    // Control buttons
    const prevBtn = this.miniPlayer.querySelector(".mini-prev-btn");
    const playPauseBtn = this.miniPlayer.querySelector(".mini-play-pause-btn");
    const nextBtn = this.miniPlayer.querySelector(".mini-next-btn");

    prevBtn.addEventListener("click", () => {
      // Trigger previous song (we need to access event manager)
      if (window.eventManager) {
        window.eventManager.playPreviousSong();
      }
    });

    playPauseBtn.addEventListener("click", () => {
      if (window.eventManager) {
        window.eventManager.togglePlayPause();
      }
      this.updateMiniPlayerControls();
    });

    nextBtn.addEventListener("click", () => {
      if (window.eventManager) {
        window.eventManager.playNextSong();
      }
    });

    // Queue button
    const queueBtn = this.miniPlayer.querySelector(".mini-queue-btn");
    queueBtn.addEventListener("click", () => {
      const queuePanel = document.getElementById("queue-panel");
      if (queuePanel) {
        const isVisible = queuePanel.style.display !== "none";
        queuePanel.style.display = isVisible ? "none" : "block";
        if (!isVisible && window.queueManager) {
          window.queueManager.updateQueueDisplay();
        }
      }
    });

    // Volume button (placeholder for future volume control)
    const volumeBtn = this.miniPlayer.querySelector(".mini-volume-btn");
    volumeBtn.addEventListener("click", () => {
      // TODO: Implement volume control
      alert("Volume control coming soon!");
    });

    // Progress bar
    const progressContainer = this.miniPlayer.querySelector(".mini-progress-container");
    progressContainer.addEventListener("click", (e) => {
      const rect = progressContainer.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      this.audioManager.seekTo(percent);
    });

    // Dragging functionality
    this.setupMiniPlayerDragging();

    // Double-click to expand
    this.miniPlayer.addEventListener("dblclick", (e) => {
      if (e.target.classList.contains("mini-player-drag-handle")) {
        this.exitMiniPlayer();
      }
    });
  }

  setupMiniPlayerDragging() {
    const dragHandle = this.miniPlayer.querySelector(".mini-player-drag-handle");
    
    dragHandle.addEventListener("mousedown", (e) => {
      this.isDragging = true;
      const rect = this.miniPlayer.getBoundingClientRect();
      this.dragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      
      dragHandle.style.cursor = "grabbing";
      this.miniPlayer.classList.add("dragging");
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!this.isDragging) return;
      
      const x = e.clientX - this.dragOffset.x;
      const y = e.clientY - this.dragOffset.y;
      
      // Keep within viewport bounds
      const maxX = window.innerWidth - this.miniPlayer.offsetWidth;
      const maxY = window.innerHeight - this.miniPlayer.offsetHeight;
      
      const boundedX = Math.max(0, Math.min(x, maxX));
      const boundedY = Math.max(0, Math.min(y, maxY));
      
      this.miniPlayer.style.left = `${boundedX}px`;
      this.miniPlayer.style.top = `${boundedY}px`;
      
      e.preventDefault();
    });

    document.addEventListener("mouseup", () => {
      if (this.isDragging) {
        this.isDragging = false;
        dragHandle.style.cursor = "grab";
        this.miniPlayer.classList.remove("dragging");
        
        // Save position
        const rect = this.miniPlayer.getBoundingClientRect();
        this.lastPosition = { x: rect.left, y: rect.top };
        this.saveState();
      }
    });
  }

  hideMainInterface() {
    const elementsToHide = [
      "header",
      "#menu",
      "main",
      "hr"
    ];

    elementsToHide.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        element.style.display = "none";
      }
    });

    // Hide floating window
    const floatingWindow = document.getElementById("floating-window");
    if (floatingWindow) {
      floatingWindow.style.display = "none";
    }

    // Set body background to prevent white flash
    document.body.style.background = "#000";
  }

  showMainInterface() {
    const elementsToShow = [
      "header",
      "#menu", 
      "main",
      "hr"
    ];

    elementsToShow.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        element.style.display = "";
      }
    });

    // Show floating window if song is playing
    const floatingWindow = document.getElementById("floating-window");
    if (floatingWindow && this.audioManager.getIsPlaying()) {
      floatingWindow.style.display = "flex";
    }

    // Reset body background
    document.body.style.background = "";
  }

  updateToggleButtons(isMinimized) {
    const mainToggle = document.getElementById("mini-player-toggle");
    if (mainToggle) {
      mainToggle.textContent = isMinimized ? "Exit Mini" : "Mini Player";
      mainToggle.style.background = isMinimized ? 
        "linear-gradient(135deg, #ff8c00, #ff2e63)" : 
        "rgba(255, 255, 255, 0.1)";
    }
  }

  getCurrentSongInfo() {
    const currentPlaylist = this.audioManager.getCurrentPlaylist();
    const currentIndex = this.audioManager.getCurrentIndex();
    const currentSong = currentPlaylist[currentIndex];
    
    if (currentSong) {
      const artist = window.artists?.find(a => a.artistId === currentSong.artistId);
      return {
        title: currentSong.title,
        artist: artist ? artist.name : "Unknown Artist",
        isPlaying: this.audioManager.getIsPlaying()
      };
    }
    
    return {
      title: "No song playing",
      artist: "",
      isPlaying: false
    };
  }

  updateMiniPlayerInfo() {
    if (!this.miniPlayer) return;

    const songInfo = this.getCurrentSongInfo();
    
    const titleElement = this.miniPlayer.querySelector(".mini-song-title");
    const artistElement = this.miniPlayer.querySelector(".mini-song-artist");
    
    if (titleElement) titleElement.textContent = songInfo.title;
    if (artistElement) artistElement.textContent = songInfo.artist;
    
    this.updateMiniPlayerControls();
  }

  updateMiniPlayerControls() {
    if (!this.miniPlayer) return;

    const playPauseBtn = this.miniPlayer.querySelector(".mini-play-pause-btn");
    if (playPauseBtn) {
      const isPlaying = this.audioManager.getIsPlaying();
      playPauseBtn.innerHTML = isPlaying ? "⏸" : "▶️";
    }
  }

  updateMiniPlayerProgress(percentage) {
    if (!this.miniPlayer) return;

    const progressBar = this.miniPlayer.querySelector(".mini-progress-bar");
    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
    }
  }

  addMiniPlayerStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .mini-player {
        position: fixed;
        width: 280px;
        background: rgba(0, 0, 0, 0.95);
        border: 1px solid #444;
        border-radius: 12px;
        z-index: 10000;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(20px);
        user-select: none;
        overflow: hidden;
        transition: all 0.3s ease;
        animation: miniPlayerSlideIn 0.3s ease-out;
      }

      .mini-player:hover {
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.9);
      }

      .mini-player-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.05);
        border-bottom: 1px solid #333;
      }

      .mini-player-drag-handle {
        cursor: grab;
        color: #666;
        font-size: 12px;
        padding: 4px;
        user-select: none;
      }

      .mini-player-close {
        cursor: pointer;
        color: #999;
        font-size: 14px;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s;
      }

      .mini-player-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ff4444;
      }

      .mini-player-content {
        padding: 12px;
      }

      .mini-player-info {
        margin-bottom: 12px;
        text-align: center;
      }

      .mini-song-title {
        color: white;
        font-weight: bold;
        font-size: 14px;
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .mini-song-artist {
        color: #999;
        font-size: 12px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .mini-player-controls {
        display: flex;
        justify-content: center;
        gap: 12px;
        margin-bottom: 12px;
      }

      .mini-player-controls button {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: white;
        cursor: pointer;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 14px;
        transition: all 0.2s;
      }

      .mini-player-controls button:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.05);
      }

      .mini-play-pause-btn {
        background: rgba(29, 185, 84, 0.8) !important;
      }

      .mini-play-pause-btn:hover {
        background: rgba(29, 185, 84, 1) !important;
      }

      .mini-progress-container {
        height: 4px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
        cursor: pointer;
        margin-bottom: 12px;
        overflow: hidden;
      }

      .mini-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #1DB954, #1ed760);
        width: 0%;
        transition: width 0.1s ease;
      }

      .mini-player-extras {
        display: flex;
        justify-content: space-around;
        gap: 8px;
      }

      .mini-player-extras button {
        background: none;
        border: none;
        color: #999;
        cursor: pointer;
        padding: 6px 8px;
        border-radius: 6px;
        font-size: 14px;
        transition: all 0.2s;
        flex: 1;
      }

      .mini-player-extras button:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }

      /* Mini player toggle button hover effects */
      #mini-player-toggle:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: #666;
        transform: translateY(-1px);
      }

      #mini-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
      }

      /* Animation for mini player appearance */
      @keyframes miniPlayerSlideIn {
        from {
          opacity: 0;
          transform: scale(0.8) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      /* Prevent text selection while dragging */
      .mini-player.dragging * {
        user-select: none !important;
      }

      /* Responsive design */
      @media (max-width: 768px) {
        .mini-player {
          width: 250px;
        }
        
        .mini-player-controls {
          gap: 8px;
        }
        
        .mini-player-controls button {
          padding: 6px 10px;
          font-size: 12px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Integration methods for updating mini player
  onSongChange() {
    if (this.isMinimized) {
      this.updateMiniPlayerInfo();
    }
  }

  onProgressUpdate(percentage) {
    if (this.isMinimized) {
      this.updateMiniPlayerProgress(percentage);
    }
  }

  onPlayStateChange() {
    if (this.isMinimized) {
      this.updateMiniPlayerControls();
    }
  }

  // Utility methods
  getIsMinimized() {
    return this.isMinimized;
  }

  getLastPosition() {
    return { ...this.lastPosition };
  }

  setPosition(x, y) {
    this.lastPosition = { x, y };
    if (this.miniPlayer) {
      this.miniPlayer.style.left = `${x}px`;
      this.miniPlayer.style.top = `${y}px`;
    }
  }

  // Keyboard shortcuts for mini player
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (!this.isMinimized) return;

      // Only respond to shortcuts when mini player is active
      switch (e.code) {
        case 'Space':
          if (e.target === document.body) {
            e.preventDefault();
            if (window.eventManager) {
              window.eventManager.togglePlayPause();
            }
          }
          break;
        case 'Escape':
          e.preventDefault();
          this.exitMiniPlayer();
          break;
        case 'ArrowRight':
          if (e.altKey) {
            e.preventDefault();
            if (window.eventManager) {
              window.eventManager.playNextSong();
            }
          }
          break;
        case 'ArrowLeft':
          if (e.altKey) {
            e.preventDefault();
            if (window.eventManager) {
              window.eventManager.playPreviousSong();
            }
          }
          break;
      }
    });
  }

  // Save/restore mini player state
  saveState() {
    const state = {
      isMinimized: this.isMinimized,
      position: this.lastPosition
    };
    localStorage.setItem('miniPlayer_state', JSON.stringify(state));
  }

  loadState() {
    const saved = localStorage.getItem('miniPlayer_state');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.position) {
          this.lastPosition = state.position;
        }
        // Don't auto-restore minimized state - let user control this
      } catch (e) {
        console.warn('Failed to load mini player state:', e);
      }
    }
  }

  // Auto-minimize on window blur (optional feature)
  setupAutoMinimize() {
    window.addEventListener('blur', () => {
      if (!this.isMinimized && this.audioManager.getIsPlaying()) {
        // Auto-minimize when window loses focus and music is playing
        // This is optional behavior - can be controlled by user preference
        const autoMinimize = localStorage.getItem('autoMiniPlayer');
        if (autoMinimize === 'true') {
          this.enterMiniPlayer();
        }
      }
    });
  }

  // Cleanup method
  destroy() {
    this.saveState();
    if (this.miniPlayer) {
      this.removeMiniPlayer();
    }
  }
}
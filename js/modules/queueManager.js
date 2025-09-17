// Queue Manager - Handles playback queue and queue management
export class QueueManager {
  constructor(domManager, uiManager, audioManager) {
    this.domManager = domManager;
    this.uiManager = uiManager;
    this.audioManager = audioManager;
    
    this.queue = [];
    this.queueHistory = [];
    this.currentQueueIndex = -1;
    this.isShuffleMode = false;
    this.shuffledQueue = [];
    
    this.init();
  }

  init() {
    this.createQueueUI();
    this.setupEventListeners();
  }

  createQueueUI() {
    const floatingWindow = document.getElementById("floating-window");
    if (!floatingWindow) return;

    // Add queue button to floating window
    const queueBtn = document.createElement("button");
    queueBtn.id = "queue-btn";
    queueBtn.innerHTML = "📋";
    queueBtn.title = "Show Queue";
    queueBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      padding: 5px;
      margin-left: 10px;
    `;

    // Insert queue button before progress container
    const progressContainer = document.getElementById("floating-progress-container");
    if (progressContainer) {
      floatingWindow.insertBefore(queueBtn, progressContainer);
    } else {
      floatingWindow.appendChild(queueBtn);
    }

    // Create queue panel
    this.createQueuePanel();
    
    // Add shuffle button to navbar
    this.createShuffleToggle();
    
    this.addQueueStyles();
  }

  createQueuePanel() {
    const queuePanel = document.createElement("div");
    queuePanel.id = "queue-panel";
    queuePanel.className = "queue-panel";
    queuePanel.style.display = "none";
    
    queuePanel.innerHTML = `
      <div class="queue-header">
        <h3>Playback Queue</h3>
        <div class="queue-controls">
          <button id="clear-queue-btn" title="Clear Queue">🗑️</button>
          <button id="save-queue-btn" title="Save as Playlist">💾</button>
          <button id="close-queue-btn" title="Close">✖️</button>
        </div>
      </div>
      <div class="queue-content">
        <div class="current-playing">
          <h4>Now Playing:</h4>
          <div id="current-song-display">No song playing</div>
        </div>
        <div class="queue-divider"></div>
        <div class="up-next">
          <h4>Up Next: <span id="queue-count">(0)</span></h4>
          <div id="queue-list" class="queue-list">
            <div class="empty-queue">Queue is empty. Add songs to get started!</div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(queuePanel);
  }

  createShuffleToggle() {
    const shuffleBtn = document.getElementById("shuffle-btn");
    if (!shuffleBtn) return;

    // Add shuffle state indicator
    const shuffleIndicator = document.createElement("span");
    shuffleIndicator.id = "shuffle-indicator";
    shuffleIndicator.textContent = "🔀";
    shuffleIndicator.style.cssText = `
      opacity: 0.3;
      margin-left: 5px;
      transition: opacity 0.3s;
    `;
    shuffleBtn.appendChild(shuffleIndicator);
  }

  setupEventListeners() {
    // Queue panel toggle
    const queueBtn = document.getElementById("queue-btn");
    const queuePanel = document.getElementById("queue-panel");
    const closeQueueBtn = document.getElementById("close-queue-btn");

    if (queueBtn && queuePanel) {
      queueBtn.addEventListener("click", () => {
        const isVisible = queuePanel.style.display !== "none";
        queuePanel.style.display = isVisible ? "none" : "block";
        if (!isVisible) {
          this.updateQueueDisplay();
        }
      });
    }

    if (closeQueueBtn && queuePanel) {
      closeQueueBtn.addEventListener("click", () => {
        queuePanel.style.display = "none";
      });
    }

    // Clear queue
    const clearQueueBtn = document.getElementById("clear-queue-btn");
    if (clearQueueBtn) {
      clearQueueBtn.addEventListener("click", () => {
        if (confirm("Clear the entire queue?")) {
          this.clearQueue();
        }
      });
    }

    // Save queue as playlist
    const saveQueueBtn = document.getElementById("save-queue-btn");
    if (saveQueueBtn) {
      saveQueueBtn.addEventListener("click", () => {
        this.saveQueueAsPlaylist();
      });
    }

    // Enhanced shuffle button functionality
    const shuffleBtn = document.getElementById("shuffle-btn");
    if (shuffleBtn) {
      // Remove existing event listeners and add our enhanced one
      const newShuffleBtn = shuffleBtn.cloneNode(true);
      shuffleBtn.parentNode.replaceChild(newShuffleBtn, shuffleBtn);
      
      newShuffleBtn.addEventListener("click", () => {
        this.toggleShuffleMode();
      });
    }

    // Setup song context menu additions for queue
    this.setupQueueContextMenus();
  }

  setupQueueContextMenus() {
    // Extend existing context menu functionality
    document.addEventListener("contextmenu", (e) => {
      const songElement = e.target.closest(".card, .list-item");
      if (songElement && songElement.dataset.index !== undefined) {
        // This will be handled by the existing context menu system
        // We'll add our queue options there
        setTimeout(() => this.addQueueOptionsToContextMenu(songElement), 10);
      }
    });
  }

  addQueueOptionsToContextMenu(songElement) {
    const contextMenu = document.getElementById("song-context-menu");
    if (!contextMenu) return;

    const songIndex = parseInt(songElement.dataset.index);
    const currentPlaylist = this.audioManager.getCurrentPlaylist();
    const song = currentPlaylist[songIndex];
    
    if (!song) return;

    // Add queue options to existing context menu
    const queueDivider = document.createElement("div");
    queueDivider.className = "context-menu-divider";

    const addToQueueItem = document.createElement("div");
    addToQueueItem.className = "context-menu-item";
    addToQueueItem.dataset.action = "add-to-queue";
    addToQueueItem.textContent = "➕ Add to Queue";

    const playNextItem = document.createElement("div");
    playNextItem.className = "context-menu-item";
    playNextItem.dataset.action = "play-next";
    playNextItem.textContent = "⏭️ Play Next";

    contextMenu.appendChild(queueDivider);
    contextMenu.appendChild(addToQueueItem);
    contextMenu.appendChild(playNextItem);

    // Add event listeners
    addToQueueItem.addEventListener("click", () => {
      this.addToQueue(song);
      contextMenu.remove();
    });

    playNextItem.addEventListener("click", () => {
      this.addToQueue(song, 0); // Add at beginning of queue
      contextMenu.remove();
    });
  }

  // Queue Management Methods
  addToQueue(song, position = null) {
    if (!song) return;

    if (position === null) {
      this.queue.push(song);
    } else {
      this.queue.splice(position, 0, song);
    }

    this.updateQueueDisplay();
    console.log(`Added "${song.title}" to queue`);

    // Show brief notification
    this.showQueueNotification(`Added to queue: ${song.title}`);
  }

  removeFromQueue(index) {
    if (index >= 0 && index < this.queue.length) {
      const removed = this.queue.splice(index, 1)[0];
      this.updateQueueDisplay();
      console.log(`Removed "${removed.title}" from queue`);
      return removed;
    }
  }

  clearQueue() {
    this.queue = [];
    this.shuffledQueue = [];
    this.currentQueueIndex = -1;
    this.updateQueueDisplay();
    console.log("Queue cleared");
  }

  getNextQueueSong() {
    if (this.queue.length === 0) return null;

    let nextSong;
    
    if (this.isShuffleMode) {
      if (this.shuffledQueue.length === 0) {
        this.shuffledQueue = [...this.queue].sort(() => Math.random() - 0.5);
      }
      nextSong = this.shuffledQueue.shift();
    } else {
      nextSong = this.queue.shift();
    }

    if (nextSong) {
      this.queueHistory.push(nextSong);
      this.updateQueueDisplay();
    }

    return nextSong;
  }

  reorderQueue(oldIndex, newIndex) {
    if (oldIndex < 0 || oldIndex >= this.queue.length || 
        newIndex < 0 || newIndex >= this.queue.length) {
      return;
    }

    const song = this.queue.splice(oldIndex, 1)[0];
    this.queue.splice(newIndex, 0, song);
    this.updateQueueDisplay();
  }

  toggleShuffleMode() {
    this.isShuffleMode = !this.isShuffleMode;
    
    const shuffleIndicator = document.getElementById("shuffle-indicator");
    const shuffleBtn = document.getElementById("shuffle-btn");
    
    if (shuffleIndicator) {
      shuffleIndicator.style.opacity = this.isShuffleMode ? "1" : "0.3";
    }
    
    if (shuffleBtn) {
      if (this.isShuffleMode) {
        shuffleBtn.style.background = "linear-gradient(135deg, #1DB954, #1ed760)";
        shuffleBtn.style.boxShadow = "0 0 8px rgba(29, 185, 84, 0.7)";
      } else {
        shuffleBtn.style.background = "#444";
        shuffleBtn.style.boxShadow = "none";
      }
    }

    // Reset shuffled queue when toggling
    if (this.isShuffleMode) {
      this.shuffledQueue = [...this.queue].sort(() => Math.random() - 0.5);
    } else {
      this.shuffledQueue = [];
    }

    console.log(`Shuffle mode: ${this.isShuffleMode ? 'ON' : 'OFF'}`);
    this.showQueueNotification(`Shuffle ${this.isShuffleMode ? 'enabled' : 'disabled'}`);
  }

  updateQueueDisplay() {
    const queueList = document.getElementById("queue-list");
    const queueCount = document.getElementById("queue-count");
    const currentSongDisplay = document.getElementById("current-song-display");

    if (!queueList || !queueCount) return;

    // Update queue count
    queueCount.textContent = `(${this.queue.length})`;

    // Update current song display
    const currentAudio = this.audioManager.getCurrentAudio();
    if (currentAudio && currentAudio.src) {
      const currentPlaylist = this.audioManager.getCurrentPlaylist();
      const currentIndex = this.audioManager.getCurrentIndex();
      const currentSong = currentPlaylist[currentIndex];
      
      if (currentSong) {
        const artist = window.artists?.find(a => a.artistId === currentSong.artistId);
        const artistName = artist ? artist.name : "Unknown Artist";
        currentSongDisplay.innerHTML = `
          <div class="current-song-info">
            <span class="current-song-title">${currentSong.title}</span>
            <span class="current-song-artist">${artistName}</span>
          </div>
        `;
      } else {
        currentSongDisplay.textContent = "No song playing";
      }
    } else {
      currentSongDisplay.textContent = "No song playing";
    }

    // Update queue list
    if (this.queue.length === 0) {
      queueList.innerHTML = '<div class="empty-queue">Queue is empty. Add songs to get started!</div>';
      return;
    }

    const displayQueue = this.isShuffleMode && this.shuffledQueue.length > 0 
      ? this.shuffledQueue 
      : this.queue;

    queueList.innerHTML = displayQueue.map((song, index) => {
      const artist = window.artists?.find(a => a.artistId === song.artistId);
      const artistName = artist ? artist.name : "Unknown Artist";
      
      return `
        <div class="queue-item" data-queue-index="${index}">
          <div class="queue-song-info">
            <div class="queue-song-title">${song.title}</div>
            <div class="queue-song-artist">${artistName}</div>
          </div>
          <div class="queue-item-actions">
            <button class="queue-play-now" title="Play Now">▶️</button>
            <button class="queue-move-up" title="Move Up" ${index === 0 ? 'disabled' : ''}>⬆️</button>
            <button class="queue-move-down" title="Move Down" ${index === displayQueue.length - 1 ? 'disabled' : ''}>⬇️</button>
            <button class="queue-remove" title="Remove">🗑️</button>
          </div>
        </div>
      `;
    }).join('');

    // Add event listeners to queue items
    this.setupQueueItemEvents();
  }

  setupQueueItemEvents() {
    const queueList = document.getElementById("queue-list");
    if (!queueList) return;

    queueList.addEventListener("click", (e) => {
      const target = e.target;
      const queueItem = target.closest(".queue-item");
      if (!queueItem) return;

      const queueIndex = parseInt(queueItem.dataset.queueIndex);
      
      if (target.classList.contains("queue-play-now")) {
        this.playQueueSong(queueIndex);
      } else if (target.classList.contains("queue-move-up") && queueIndex > 0) {
        this.reorderQueue(queueIndex, queueIndex - 1);
      } else if (target.classList.contains("queue-move-down") && queueIndex < this.queue.length - 1) {
        this.reorderQueue(queueIndex, queueIndex + 1);
      } else if (target.classList.contains("queue-remove")) {
        this.removeFromQueue(queueIndex);
      }
    });
  }

  playQueueSong(queueIndex) {
    if (queueIndex < 0 || queueIndex >= this.queue.length) return;
    
    const song = this.queue[queueIndex];
    
    // Remove song from queue since we're playing it now
    this.removeFromQueue(queueIndex);
    
    // Find the song in the current playlist or add it temporarily
    const currentPlaylist = this.audioManager.getCurrentPlaylist();
    let songIndex = currentPlaylist.findIndex(s => s.id === song.id);
    
    if (songIndex === -1) {
      // Song not in current playlist, add it temporarily
      currentPlaylist.push(song);
      songIndex = currentPlaylist.length - 1;
    }
    
    // Play the song
    this.uiManager.playSong(song, songIndex, null);
  }

  saveQueueAsPlaylist() {
    if (this.queue.length === 0) {
      alert("Queue is empty! Add some songs first.");
      return;
    }

    const playlistName = prompt("Enter playlist name:", `Queue - ${new Date().toLocaleDateString()}`);
    if (!playlistName || playlistName.trim() === "") return;

    // This requires the PlaylistManager to be available
    if (window.playlistManager) {
      const playlist = {
        id: Date.now().toString(),
        name: playlistName.trim(),
        songs: this.queue.map(song => song.id),
        created: new Date().toISOString()
      };

      window.playlistManager.playlists.push(playlist);
      window.playlistManager.savePlaylists();
      window.playlistManager.updatePlaylistDropdown();
      window.playlistManager.setupPlaylistDropdownEvents();

      alert(`Queue saved as "${playlistName}"!`);
      this.clearQueue();
    } else {
      alert("Playlist manager not available. Please ensure it's loaded.");
    }
  }

  showQueueNotification(message) {
    // Create temporary notification
    const notification = document.createElement("div");
    notification.className = "queue-notification";
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      background: rgba(29, 185, 84, 0.9);
      color: white;
      padding: 10px 15px;
      border-radius: 6px;
      z-index: 3000;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      transform: translateY(20px);
      opacity: 0;
      transition: all 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = "translateY(0)";
      notification.style.opacity = "1";
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = "translateY(20px)";
      notification.style.opacity = "0";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  addQueueStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .queue-panel {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 350px;
        max-height: 80vh;
        background: rgba(0, 0, 0, 0.95);
        border: 1px solid #444;
        border-radius: 12px;
        z-index: 2000;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(10px);
      }

      .queue-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        border-bottom: 1px solid #444;
      }

      .queue-header h3 {
        margin: 0;
        color: white;
        font-size: 18px;
      }

      .queue-controls {
        display: flex;
        gap: 8px;
      }

      .queue-controls button {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 5px;
        border-radius: 4px;
        transition: background 0.2s;
      }

      .queue-controls button:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .queue-content {
        padding: 15px 20px;
        max-height: calc(80vh - 80px);
        overflow-y: auto;
      }

      .current-playing h4,
      .up-next h4 {
        margin: 0 0 10px 0;
        color: #1DB954;
        font-size: 14px;
        font-weight: bold;
      }

      .current-song-info {
        display: flex;
        flex-direction: column;
        padding: 8px 0;
      }

      .current-song-title {
        font-weight: bold;
        color: white;
        margin-bottom: 4px;
      }

      .current-song-artist {
        color: #999;
        font-size: 12px;
      }

      .queue-divider {
        height: 1px;
        background: #444;
        margin: 15px 0;
      }

      .queue-list {
        min-height: 100px;
      }

      .empty-queue {
        color: #666;
        text-align: center;
        padding: 20px 0;
        font-style: italic;
      }

      .queue-item {
        display: flex;
        align-items: center;
        padding: 10px;
        border-radius: 8px;
        margin-bottom: 8px;
        background: rgba(255, 255, 255, 0.05);
        transition: background 0.2s;
      }

      .queue-item:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .queue-song-info {
        flex: 1;
        min-width: 0;
      }

      .queue-song-title {
        color: white;
        font-weight: bold;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 2px;
      }

      .queue-song-artist {
        color: #999;
        font-size: 12px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .queue-item-actions {
        display: flex;
        gap: 4px;
      }

      .queue-item-actions button {
        background: none;
        border: none;
        color: #999;
        cursor: pointer;
        padding: 4px 6px;
        border-radius: 4px;
        font-size: 12px;
        transition: all 0.2s;
      }

      .queue-item-actions button:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }

      .queue-item-actions button:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      #shuffle-indicator {
        pointer-events: none;
      }

      /* Queue button in floating window */
      #queue-btn:hover {
        background: rgba(255, 255, 255, 0.1) !important;
        border-radius: 4px;
      }

      /* Mobile responsiveness */
      @media (max-width: 768px) {
        .queue-panel {
          width: calc(100vw - 40px);
          right: 20px;
          left: 20px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Integration Methods
  integrateWithAudioManager() {
    // Override the audio manager's next song logic to check queue first
    const originalGetNextSong = this.audioManager.getNextSong.bind(this.audioManager);
    
    this.audioManager.getNextSong = () => {
      // Check queue first
      const queueSong = this.getNextQueueSong();
      if (queueSong) {
        // Find the song index in current playlist
        const currentPlaylist = this.audioManager.getCurrentPlaylist();
        let index = currentPlaylist.findIndex(s => s.id === queueSong.id);
        
        if (index === -1) {
          // Add to playlist temporarily and get new index
          currentPlaylist.push(queueSong);
          index = currentPlaylist.length - 1;
        }
        
        return {
          song: queueSong,
          index: index
        };
      }
      
      // If no queue, use original logic
      return originalGetNextSong();
    };
  }

  // Utility Methods
  getQueue() {
    return [...this.queue];
  }

  getQueueLength() {
    return this.queue.length;
  }

  isShuffleModeEnabled() {
    return this.isShuffleMode;
  }

  addCurrentPlaylistToQueue() {
    const currentPlaylist = this.audioManager.getCurrentPlaylist();
    const currentIndex = this.audioManager.getCurrentIndex();
    
    // Add remaining songs from current playlist to queue
    const remainingSongs = currentPlaylist.slice(currentIndex + 1);
    remainingSongs.forEach(song => this.addToQueue(song));
    
    this.showQueueNotification(`Added ${remainingSongs.length} songs to queue`);
  }
}
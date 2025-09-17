// Playlist Manager - Handles playlist creation, management, and favorites
export class PlaylistManager {
  constructor(domManager, uiManager, navigationManager) {
    this.domManager = domManager;
    this.uiManager = uiManager;
    this.navigationManager = navigationManager;
    
    // Initialize storage
    this.playlists = this.loadPlaylists();
    this.favorites = this.loadFavorites();
    
    this.init();
  }

  init() {
    this.createPlaylistUI();
    this.setupEventListeners();
  }

  createPlaylistUI() {
    // Create playlist controls in the navbar
    const artistButtonsContainer = document.getElementById("artist-buttons");
    if (!artistButtonsContainer) return;

    // Create playlist dropdown
    const playlistContainer = document.createElement("div");
    playlistContainer.className = "playlist-container";
    playlistContainer.style.position = "relative";
    playlistContainer.style.display = "inline-block";
    playlistContainer.style.marginRight = "10px";

    const playlistBtn = document.createElement("button");
    playlistBtn.id = "playlist-btn";
    playlistBtn.textContent = "Playlists";
    playlistBtn.style.position = "relative";

    const playlistDropdown = document.createElement("div");
    playlistDropdown.id = "playlist-dropdown";
    playlistDropdown.className = "playlist-dropdown";
    playlistDropdown.style.display = "none";
    
    // Add favorites button
    const favoritesBtn = document.createElement("button");
    favoritesBtn.id = "favorites-btn";
    favoritesBtn.textContent = "❤️ Favorites";
    favoritesBtn.style.marginRight = "10px";

    playlistContainer.appendChild(playlistBtn);
    playlistContainer.appendChild(playlistDropdown);
    
    // Insert before view toggle button
    const viewToggleBtn = document.getElementById("view-toggle-btn");
    if (viewToggleBtn) {
      artistButtonsContainer.insertBefore(favoritesBtn, viewToggleBtn);
      artistButtonsContainer.insertBefore(playlistContainer, viewToggleBtn);
    } else {
      artistButtonsContainer.appendChild(favoritesBtn);
      artistButtonsContainer.appendChild(playlistContainer);
    }

    this.updatePlaylistDropdown();
    this.addPlaylistStyles();
  }

  updatePlaylistDropdown() {
    const dropdown = document.getElementById("playlist-dropdown");
    if (!dropdown) return;

    dropdown.innerHTML = `
      <div class="playlist-dropdown-content">
        <div class="playlist-header">
          <input type="text" id="new-playlist-name" placeholder="New playlist name..." maxlength="30">
          <button id="create-playlist-btn">Create</button>
        </div>
        <div class="playlist-divider"></div>
        <div id="playlist-list">
          ${this.playlists.length === 0 ? 
            '<div class="no-playlists">No playlists yet. Create one!</div>' : 
            this.playlists.map(playlist => `
              <div class="playlist-item" data-playlist-id="${playlist.id}">
                <span class="playlist-name">${playlist.name}</span>
                <span class="playlist-count">(${playlist.songs.length})</span>
                <div class="playlist-actions">
                  <button class="play-playlist-btn" title="Play">▶️</button>
                  <button class="edit-playlist-btn" title="Rename">✏️</button>
                  <button class="delete-playlist-btn" title="Delete">🗑️</button>
                </div>
              </div>
            `).join('')
          }
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // Playlist dropdown toggle
    const playlistBtn = document.getElementById("playlist-btn");
    const playlistDropdown = document.getElementById("playlist-dropdown");
    
    if (playlistBtn && playlistDropdown) {
      playlistBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        playlistDropdown.style.display = 
          playlistDropdown.style.display === "none" ? "block" : "none";
      });
    }

    // Close dropdown when clicking outside
    document.addEventListener("click", () => {
      if (playlistDropdown) {
        playlistDropdown.style.display = "none";
      }
    });

    // Favorites button
    const favoritesBtn = document.getElementById("favorites-btn");
    if (favoritesBtn) {
      favoritesBtn.addEventListener("click", () => {
        this.displayFavorites();
      });
    }

    // Setup playlist dropdown event delegation
    this.setupPlaylistDropdownEvents();
    
    // Setup song context menu for adding to playlists
    this.setupSongContextMenus();
  }

  setupPlaylistDropdownEvents() {
    const dropdown = document.getElementById("playlist-dropdown");
    if (!dropdown) return;

    dropdown.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent dropdown from closing
      
      const target = e.target;
      
      // Create playlist
      if (target.id === "create-playlist-btn") {
        this.createPlaylist();
      }
      
      // Play playlist
      else if (target.classList.contains("play-playlist-btn")) {
        const playlistId = target.closest(".playlist-item").dataset.playlistId;
        this.playPlaylist(playlistId);
      }
      
      // Edit playlist
      else if (target.classList.contains("edit-playlist-btn")) {
        const playlistId = target.closest(".playlist-item").dataset.playlistId;
        this.editPlaylist(playlistId);
      }
      
      // Delete playlist
      else if (target.classList.contains("delete-playlist-btn")) {
        const playlistId = target.closest(".playlist-item").dataset.playlistId;
        this.deletePlaylist(playlistId);
      }
      
      // Play playlist by clicking name
      else if (target.classList.contains("playlist-name")) {
        const playlistId = target.closest(".playlist-item").dataset.playlistId;
        this.playPlaylist(playlistId);
      }
    });
  }

  setupSongContextMenus() {
    // We'll add context menu listeners to song elements
    // This will be called after songs are loaded
    document.addEventListener("contextmenu", (e) => {
      const songElement = e.target.closest(".card, .list-item");
      if (songElement && songElement.dataset.index !== undefined) {
        e.preventDefault();
        this.showSongContextMenu(e, songElement);
      }
    });
  }

  showSongContextMenu(e, songElement) {
    const songIndex = parseInt(songElement.dataset.index);
    const currentPlaylist = this.navigationManager.getCurrentContextSongs();
    const song = currentPlaylist[songIndex];
    
    if (!song) return;

    // Remove existing context menu
    const existingMenu = document.getElementById("song-context-menu");
    if (existingMenu) {
      existingMenu.remove();
    }

    // Create context menu
    const contextMenu = document.createElement("div");
    contextMenu.id = "song-context-menu";
    contextMenu.className = "context-menu";
    
    const isFavorite = this.favorites.includes(song.id);
    
    contextMenu.innerHTML = `
      <div class="context-menu-item" data-action="favorite">
        ${isFavorite ? "💔 Remove from Favorites" : "❤️ Add to Favorites"}
      </div>
      <div class="context-menu-divider"></div>
      ${this.playlists.map(playlist => `
        <div class="context-menu-item" data-action="add-to-playlist" data-playlist-id="${playlist.id}">
          📋 Add to "${playlist.name}"
        </div>
      `).join('')}
      ${this.playlists.length === 0 ? '<div class="context-menu-item disabled">No playlists available</div>' : ''}
    `;

    // Position the context menu
    contextMenu.style.left = `${e.pageX}px`;
    contextMenu.style.top = `${e.pageY}px`;
    
    document.body.appendChild(contextMenu);

    // Handle context menu clicks
    contextMenu.addEventListener("click", (e) => {
      const action = e.target.dataset.action;
      
      if (action === "favorite") {
        this.toggleFavorite(song.id);
      } else if (action === "add-to-playlist") {
        const playlistId = e.target.dataset.playlistId;
        this.addSongToPlaylist(song.id, playlistId);
      }
      
      contextMenu.remove();
    });

    // Remove context menu when clicking elsewhere
    const removeMenu = () => {
      contextMenu.remove();
      document.removeEventListener("click", removeMenu);
    };
    setTimeout(() => document.addEventListener("click", removeMenu), 10);
  }

  // Playlist Management Methods
  createPlaylist() {
    const nameInput = document.getElementById("new-playlist-name");
    if (!nameInput) return;
    
    const name = nameInput.value.trim();
    if (!name) {
      alert("Please enter a playlist name");
      return;
    }

    if (this.playlists.some(p => p.name === name)) {
      alert("A playlist with that name already exists");
      return;
    }

    const playlist = {
      id: Date.now().toString(),
      name: name,
      songs: [],
      created: new Date().toISOString()
    };

    this.playlists.push(playlist);
    this.savePlaylists();
    nameInput.value = "";
    this.updatePlaylistDropdown();
    this.setupPlaylistDropdownEvents(); // Re-setup events
    
    console.log(`Created playlist: ${name}`);
  }

  editPlaylist(playlistId) {
    const playlist = this.playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    const newName = prompt("Enter new playlist name:", playlist.name);
    if (!newName || newName.trim() === "") return;
    
    const trimmedName = newName.trim();
    if (this.playlists.some(p => p.name === trimmedName && p.id !== playlistId)) {
      alert("A playlist with that name already exists");
      return;
    }

    playlist.name = trimmedName;
    this.savePlaylists();
    this.updatePlaylistDropdown();
    this.setupPlaylistDropdownEvents();
  }

  deletePlaylist(playlistId) {
    const playlist = this.playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    if (confirm(`Delete playlist "${playlist.name}"?`)) {
      this.playlists = this.playlists.filter(p => p.id !== playlistId);
      this.savePlaylists();
      this.updatePlaylistDropdown();
      this.setupPlaylistDropdownEvents();
    }
  }

  addSongToPlaylist(songId, playlistId) {
    const playlist = this.playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    if (!playlist.songs.includes(songId)) {
      playlist.songs.push(songId);
      this.savePlaylists();
      this.updatePlaylistDropdown();
      this.setupPlaylistDropdownEvents();
      
      // Show confirmation
      const song = window.songs.find(s => s.id === songId);
      const songTitle = song ? song.title : "Song";
      console.log(`Added "${songTitle}" to playlist "${playlist.name}"`);
    }
  }

  playPlaylist(playlistId) {
    const playlist = this.playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    const songs = playlist.songs
      .map(songId => window.songs.find(s => s.id === songId))
      .filter(song => song); // Remove any null/undefined songs

    if (songs.length === 0) {
      alert("This playlist is empty or contains unavailable songs");
      return;
    }

    // Update navigation context
    this.navigationManager.currentContext = {
      type: 'playlist',
      data: playlist,
      songs: songs
    };

    // Update UI
    const elements = this.domManager.getElements();
    elements.selectedArtistTitle.innerHTML = `📋 Playlist: ${playlist.name}`;
    
    // Highlight playlist button
    const playlistBtn = document.getElementById("playlist-btn");
    if (playlistBtn) {
      this.uiManager.highlightButton(playlistBtn);
    }

    // Load and play songs
    this.uiManager.loadSongsInBatches(songs).then(() => {
      // Set as current playlist and start playing
      // You might want to auto-play the first song
    });

    // Close dropdown
    const dropdown = document.getElementById("playlist-dropdown");
    if (dropdown) {
      dropdown.style.display = "none";
    }
  }

  // Favorites Management
  toggleFavorite(songId) {
    const index = this.favorites.indexOf(songId);
    if (index === -1) {
      this.favorites.push(songId);
      console.log("Added to favorites");
    } else {
      this.favorites.splice(index, 1);
      console.log("Removed from favorites");
    }
    this.saveFavorites();
  }

  displayFavorites() {
    const favoriteSongs = this.favorites
      .map(songId => window.songs.find(s => s.id === songId))
      .filter(song => song);

    if (favoriteSongs.length === 0) {
      alert("No favorite songs yet! Right-click on songs to add them to favorites.");
      return;
    }

    // Update navigation context
    this.navigationManager.currentContext = {
      type: 'favorites',
      data: null,
      songs: favoriteSongs
    };

    // Update UI
    const elements = this.domManager.getElements();
    elements.selectedArtistTitle.innerHTML = "❤️ Favorite Songs";
    
    // Highlight favorites button
    const favoritesBtn = document.getElementById("favorites-btn");
    if (favoritesBtn) {
      this.uiManager.highlightButton(favoritesBtn);
    }

    // Load songs
    this.uiManager.loadSongsInBatches(favoriteSongs);
  }

  // Storage Methods
  savePlaylists() {
    localStorage.setItem('musicPlayer_playlists', JSON.stringify(this.playlists));
  }

  loadPlaylists() {
    const saved = localStorage.getItem('musicPlayer_playlists');
    return saved ? JSON.parse(saved) : [];
  }

  saveFavorites() {
    localStorage.setItem('musicPlayer_favorites', JSON.stringify(this.favorites));
  }

  loadFavorites() {
    const saved = localStorage.getItem('musicPlayer_favorites');
    return saved ? JSON.parse(saved) : [];
  }

  addPlaylistStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .playlist-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        background: rgba(0, 0, 0, 0.95);
        border: 1px solid #444;
        border-radius: 8px;
        min-width: 300px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      .playlist-dropdown-content {
        padding: 10px;
      }

      .playlist-header {
        display: flex;
        gap: 8px;
        margin-bottom: 8px;
      }

      #new-playlist-name {
        flex: 1;
        padding: 6px;
        border: 1px solid #666;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }

      #create-playlist-btn {
        padding: 6px 12px;
        background: #1DB954;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }

      .playlist-divider {
        height: 1px;
        background: #444;
        margin: 8px 0;
      }

      .playlist-item {
        display: flex;
        align-items: center;
        padding: 8px;
        border-radius: 4px;
        margin-bottom: 4px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .playlist-item:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .playlist-name {
        flex: 1;
        font-weight: bold;
        cursor: pointer;
      }

      .playlist-count {
        color: #999;
        font-size: 12px;
        margin-right: 8px;
      }

      .playlist-actions {
        display: flex;
        gap: 4px;
      }

      .playlist-actions button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 2px 4px;
        border-radius: 2px;
        font-size: 12px;
      }

      .playlist-actions button:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .no-playlists {
        color: #999;
        text-align: center;
        padding: 20px;
        font-style: italic;
      }

      .context-menu {
        position: absolute;
        background: rgba(0, 0, 0, 0.95);
        border: 1px solid #444;
        border-radius: 6px;
        padding: 4px 0;
        min-width: 180px;
        z-index: 2000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      .context-menu-item {
        padding: 8px 16px;
        cursor: pointer;
        color: white;
        font-size: 14px;
        transition: background 0.2s;
      }

      .context-menu-item:hover:not(.disabled) {
        background: rgba(255, 255, 255, 0.1);
      }

      .context-menu-item.disabled {
        color: #666;
        cursor: not-allowed;
      }

      .context-menu-divider {
        height: 1px;
        background: #444;
        margin: 4px 0;
      }
    `;
    document.head.appendChild(style);
  }

  // Utility Methods
  getPlaylists() {
    return this.playlists;
  }

  getFavorites() {
    return this.favorites;
  }

  isFavorite(songId) {
    return this.favorites.includes(songId);
  }
}
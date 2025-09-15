// Navigation Manager - Handles navigation between different song views
export class NavigationManager {
  constructor(domManager, uiManager) {
    this.domManager = domManager;
    this.uiManager = uiManager;
    this.explicitPassword = "9"; // Change as needed
    
    // Add context tracking
    this.currentContext = {
      type: 'all', // 'all', 'artist', 'explicit', 'search'
      data: null, // artist object, search query, etc.
      songs: [] // current songs being displayed
    };
  }

  async displayAllSongs() {
    const elements = this.domManager.getElements();
    elements.selectedArtistTitle.innerHTML = "All Songs";
    
    const allSongsBtn = document.getElementById("all-songs-btn");
    if (allSongsBtn) {
      this.uiManager.highlightButton(allSongsBtn);
    }
    
    const filteredSongs = window.songs?.filter((song) => !song.explicit) || [];
    
    // Update context
    this.currentContext = {
      type: 'all',
      data: null,
      songs: filteredSongs
    };
    
    await this.uiManager.loadSongsInBatches(filteredSongs);
    
    return filteredSongs;
  }

  async shuffleCurrentPlaylist(audioManager) {
    const currentPlaylist = audioManager.getCurrentPlaylist();
    
    if (!currentPlaylist || currentPlaylist.length === 0) {
      // If no current playlist, shuffle all songs as fallback
      return await this.shuffleAllSongs();
    }
    
    const elements = this.domManager.getElements();
    const shuffleBtn = document.getElementById("shuffle-btn");
    
    if (shuffleBtn) {
      this.uiManager.highlightButton(shuffleBtn);
    }
    
    // Get current title and add "Shuffled" prefix
    const currentTitle = elements.selectedArtistTitle.innerHTML;
    const isAlreadyShuffled = currentTitle.startsWith("🔀 Shuffled");
    
    if (!isAlreadyShuffled) {
      elements.selectedArtistTitle.innerHTML = `🔀 Shuffled: ${currentTitle}`;
    }
    
    // Shuffle the current playlist
    const shuffled = [...currentPlaylist].sort(() => Math.random() - 0.5);
    
    // Update context to maintain shuffle state
    this.currentContext.songs = shuffled;
    
    await this.uiManager.loadSongsInBatches(shuffled);
    return shuffled;
  }

  async shuffleCurrentContext() {
    const elements = this.domManager.getElements();
    const shuffleBtn = document.getElementById("shuffle-btn");
    
    if (shuffleBtn) {
      this.uiManager.highlightButton(shuffleBtn);
    }
    
    let songsToShuffle = [];
    let titlePrefix = "";
    
    switch (this.currentContext.type) {
      case 'all':
        songsToShuffle = window.songs?.filter((song) => !song.explicit) || [];
        titlePrefix = "All Songs";
        break;
        
      case 'artist':
        if (this.currentContext.data) {
          songsToShuffle = window.songs?.filter(
            (song) => song.artistId === this.currentContext.data.artistId && !song.explicit
          ) || [];
          titlePrefix = this.currentContext.data.name;
        }
        break;
        
      case 'explicit':
        songsToShuffle = window.songs?.filter((song) => song.explicit) || [];
        titlePrefix = "Explicit Songs";
        break;
        
      case 'search':
        songsToShuffle = this.currentContext.songs || [];
        titlePrefix = `Search Results for "${this.currentContext.data}"`;
        break;
        
      default:
        // Fallback to current playlist
        songsToShuffle = this.currentContext.songs || [];
        titlePrefix = "Current Selection";
    }
    
    if (songsToShuffle.length === 0) {
      console.warn('No songs to shuffle in current context');
      return [];
    }
    
    const shuffled = [...songsToShuffle].sort(() => Math.random() - 0.5);
    
    // Update title
    elements.selectedArtistTitle.innerHTML = `🔀 Shuffled: ${titlePrefix}`;
    
    // Update context
    this.currentContext.songs = shuffled;
    
    await this.uiManager.loadSongsInBatches(shuffled);
    return shuffled;
  }

  async shuffleCurrentArtist() {
    if (this.currentContext.type !== 'artist' || !this.currentContext.data) {
      console.warn('No current artist to shuffle');
      // If not in artist view, try to shuffle current context instead
      return await this.shuffleCurrentContext();
    }
    
    const elements = this.domManager.getElements();
    const artist = this.currentContext.data;
    
    // Find the artist button and highlight shuffle button
    const shuffleBtn = document.getElementById("shuffle-btn");
    if (shuffleBtn) {
      this.uiManager.highlightButton(shuffleBtn);
    }
    
    elements.selectedArtistTitle.innerHTML = `🔀 Shuffled: ${artist.name}`;
    
    const artistSongs = window.songs?.filter(
      (song) => song.artistId === artist.artistId && !song.explicit
    ) || [];
    
    const shuffled = [...artistSongs].sort(() => Math.random() - 0.5);
    
    // Update context
    this.currentContext.songs = shuffled;
    
    await this.uiManager.loadSongsInBatches(shuffled);
    return shuffled;
  }

  async shuffleAllSongs() {
    const elements = this.domManager.getElements();
    const shuffleBtn = document.getElementById("shuffle-btn");
    
    if (shuffleBtn) {
      this.uiManager.highlightButton(shuffleBtn);
    }
    
    elements.selectedArtistTitle.innerHTML = "🔀 Shuffled: All Songs";
    
    const filteredSongs = window.songs?.filter((song) => !song.explicit) || [];
    const shuffled = [...filteredSongs].sort(() => Math.random() - 0.5);
    
    // Update context
    this.currentContext = {
      type: 'all',
      data: null,
      songs: shuffled
    };
    
    await this.uiManager.loadSongsInBatches(shuffled);
    return shuffled;
  }

  async displayArtistSongs(artist) {
    const elements = this.domManager.getElements();
    elements.selectedArtistTitle.innerHTML = artist.name;
    
    // Find the artist button and highlight it
    const artistButtonsContainer = document.getElementById("artist-buttons");
    if (artistButtonsContainer) {
      const artistButtons = artistButtonsContainer.querySelectorAll('button');
      for (const btn of artistButtons) {
        if (btn.textContent === artist.name) {
          this.uiManager.highlightButton(btn);
          break;
        }
      }
    }
    
    const artistSongs = window.songs?.filter(
      (song) => song.artistId === artist.artistId && !song.explicit
    ) || [];
    
    // Update context
    this.currentContext = {
      type: 'artist',
      data: artist,
      songs: artistSongs
    };
    
    await this.uiManager.loadSongsInBatches(artistSongs);
    return artistSongs;
  }

  async displayExplicitSongs() {
    const { value: password } = await Swal.fire({
      title: "🕶️ Enter Access Code",
      html: `
        <p class="swal-message">
          Restricted content. Enter the access code to proceed.
        </p>
        <div class="swal-password-container">
          <input id="swal-input-password" type="password" class="swal-password-input" 
            placeholder="Enter Code">
          <span id="toggle-password" class="swal-sunglasses-icon">
            🕶️
          </span>
        </div>
      `,
      background: "#222",
      color: "#fff",
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Confirm",
      cancelButtonText: "Cancel",
      customClass: {
        confirmButton: "swal-confirm-button",
        cancelButton: "swal-cancel-button",
      },
      didOpen: () => {
        const input = document.getElementById("swal-input-password");
        const toggle = document.getElementById("toggle-password");

        toggle.addEventListener("click", () => {
          if (input.type === "password") {
            input.type = "text";
            toggle.innerHTML = "😱";
          } else {
            input.type = "password";
            toggle.innerHTML = "🕶️";
          }
        });

        input.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            const password = input.value;
            this.handleExplicitPassword(password);
          }
        });
      },
      preConfirm: () => {
        return document.getElementById("swal-input-password").value;
      },
    });

    if (password === this.explicitPassword) {
      return await this.loadExplicitSongs();
    } else if (password !== undefined) {
      this.showAccessDenied();
    }
  }

  async handleExplicitPassword(password) {
    if (password === this.explicitPassword) {
      Swal.fire({
        title: "Success",
        text: "Access Granted!",
        icon: "success",
        background: "#222",
        color: "#fff",
      }).then(() => {
        this.loadExplicitSongs();
      });
    } else {
      this.showAccessDenied();
    }
  }

  async loadExplicitSongs() {
    const elements = this.domManager.getElements();
    elements.selectedArtistTitle.innerHTML = "Explicit Songs";
    
    const explicitBtn = document.getElementById("explicit-btn");
    if (explicitBtn) {
      this.uiManager.highlightButton(explicitBtn);
    }

    const explicitSongs = window.songs?.filter((song) => song.explicit) || [];
    
    // Update context
    this.currentContext = {
      type: 'explicit',
      data: null,
      songs: explicitSongs
    };
    
    await this.uiManager.loadSongsInBatches(explicitSongs);
    return explicitSongs;
  }

  showAccessDenied() {
    Swal.fire({
      title: "Access Denied",
      text: "Incorrect Code!",
      icon: "error",
      background: "#222",
      color: "#fff",
    });
  }

  createArtistButtons() {
    const artistButtonsContainer = document.getElementById("artist-buttons");
    if (!artistButtonsContainer || !window.artists) return;

    window.artists.forEach((artist) => {
      const artistBtn = document.createElement("button");
      artistBtn.textContent = artist.name;
      artistBtn.addEventListener("click", () => this.displayArtistSongs(artist));
      artistButtonsContainer.appendChild(artistBtn);
    });
  }

  // New method to update context when search is performed
  updateSearchContext(query, songs) {
    this.currentContext = {
      type: 'search',
      data: query,
      songs: songs
    };
  }

  // Getter methods for context information
  getCurrentContext() {
    return this.currentContext;
  }

  getCurrentContextType() {
    return this.currentContext.type;
  }

  getCurrentContextData() {
    return this.currentContext.data;
  }

  getCurrentContextSongs() {
    return this.currentContext.songs;
  }
}
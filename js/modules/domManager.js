// DOM Manager - Handles all DOM creation and manipulation
export class DOMManager {
  constructor() {
    this.elements = {
      selectedArtistTitle: document.getElementById("selected-artist"),
      cardContainer: document.querySelector(".card-container"),
      searchBar: document.getElementById("searchBar"),
      navbar: null,
      floatingWindow: null,
      loadingIndicator: null
    };
    
    this.isCardView = true;
    this.loadViewPreference();
  }

  createNavbar() {
    this.elements.navbar = document.createElement("div");
    this.elements.navbar.id = "music-navbar-container";
    this.elements.navbar.innerHTML = `
      <div id="music-navbar-scroll">
        <button id="all-songs-btn">All Songs</button>
        <button id="shuffle-btn">Shuffle</button>
        <div id="artist-buttons"></div>
      </div>
      <div id="progress-container">
        <div id="progress-bar"></div>
      </div>
    `;
    document.body.appendChild(this.elements.navbar);
    
    this.createViewToggleButton();
    this.createExplicitButton();
  }

  createViewToggleButton() {
    const artistButtonsContainer = document.getElementById("artist-buttons");
    const viewToggleBtn = document.createElement("button");
    viewToggleBtn.textContent = "List View";
    viewToggleBtn.id = "view-toggle-btn";
    viewToggleBtn.style.marginLeft = "auto";
    artistButtonsContainer.appendChild(viewToggleBtn);
    
    return viewToggleBtn;
  }

  createExplicitButton() {
    const artistButtonsContainer = document.getElementById("artist-buttons");
    const explicitBtn = document.createElement("button");
    explicitBtn.textContent = "Explicit";
    explicitBtn.id = "explicit-btn";
    artistButtonsContainer.appendChild(explicitBtn);
    
    return explicitBtn;
  }

  createFloatingWindow() {
    this.elements.floatingWindow = document.createElement('div');
    this.elements.floatingWindow.id = 'floating-window';
    this.elements.floatingWindow.innerHTML = `
      <span id="floating-song-title">No song playing</span>
      <button id="prev-btn">⏮</button>
      <button id="play-pause-btn">⏯</button>
      <button id="next-btn">⏭</button>
      <div id="floating-progress-container">
        <div id="floating-progress-bar"></div>
      </div>
    `;
    document.body.appendChild(this.elements.floatingWindow);
    this.elements.floatingWindow.style.display = "none";
  }

  createLoadingIndicator() {
    this.elements.loadingIndicator = document.createElement('div');
    this.elements.loadingIndicator.id = 'loading-indicator';
    this.elements.loadingIndicator.innerHTML = `
      <div class="spinner"></div>
      <p>Loading songs...</p>
    `;
    
    // Apply styles
    Object.assign(this.elements.loadingIndicator.style, {
      display: 'none',
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      padding: '20px',
      borderRadius: '10px',
      zIndex: '9999',
      textAlign: 'center'
    });
    
    document.body.appendChild(this.elements.loadingIndicator);
  }

  createSongCard(song, index) {
    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.index = index;

    const songImg = document.createElement("img");
    songImg.src = song.imgurl || "https://via.placeholder.com/250x150";
    songImg.alt = song.title;
    songImg.loading = "lazy";
    card.appendChild(songImg);

    const songTitle = document.createElement("h2");
    songTitle.textContent = song.title;
    card.appendChild(songTitle);
    
    // Find artist name
    const artist = window.artists?.find(a => a.artistId === song.artistId);
    const artistName = document.createElement("p");
    artistName.textContent = artist ? artist.name : "Unknown Artist";
    artistName.style.margin = "0 0 10px 0";
    card.appendChild(artistName);

    const playButton = document.createElement("button");
    playButton.textContent = "Play";
    playButton.classList.add("play-button");
    
    // Style the play button
    Object.assign(playButton.style, {
      padding: "8px 16px",
      marginTop: "10px",
      borderRadius: "20px",
      border: "none",
      backgroundColor: "#1DB954",
      color: "white",
      cursor: "pointer",
      fontWeight: "bold"
    });
    
    card.appendChild(playButton);
    return card;
  }

  createSongListItem(song, index) {
    const listItem = document.createElement("div");
    listItem.classList.add("list-item");
    listItem.dataset.index = index;
    
    const artist = window.artists?.find(a => a.artistId === song.artistId);
    const artistName = artist ? artist.name : "Unknown Artist";
    
    const songInfo = document.createElement("div");
    songInfo.classList.add("song-info");
    
    const songTitle = document.createElement("span");
    songTitle.classList.add("song-title");
    songTitle.textContent = song.title;
    songInfo.appendChild(songTitle);
    
    const artistSpan = document.createElement("span");
    artistSpan.classList.add("song-artist");
    artistSpan.textContent = artistName;
    songInfo.appendChild(artistSpan);
    
    listItem.appendChild(songInfo);
    
    const playButton = document.createElement("button");
    playButton.innerHTML = "▶️";
    playButton.classList.add("list-play-button");
    listItem.appendChild(playButton);
    
    // Apply styles
    this.styleListItem(listItem, songInfo, songTitle, artistSpan, playButton);
    
    return listItem;
  }

  styleListItem(listItem, songInfo, songTitle, artistSpan, playButton) {
    Object.assign(listItem.style, {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 15px",
      margin: "8px 0",
      borderRadius: "8px",
      backgroundColor: "rgba(25, 25, 25, 0.6)",
      cursor: "pointer",
      transition: "all 0.2s ease"
    });
    
    songInfo.style.display = "flex";
    songInfo.style.flexDirection = "column";
    
    Object.assign(songTitle.style, {
      fontSize: "16px",
      fontWeight: "bold"
    });
    
    Object.assign(artistSpan.style, {
      fontSize: "14px",
      color: "#999"
    });
    
    Object.assign(playButton.style, {
      backgroundColor: "transparent",
      border: "none",
      fontSize: "20px",
      cursor: "pointer",
      padding: "5px"
    });
  }

  toggleViewMode() {
    this.isCardView = !this.isCardView;
    const viewToggleBtn = document.getElementById("view-toggle-btn");
    if (viewToggleBtn) {
      viewToggleBtn.textContent = this.isCardView ? "List View" : "Card View";
    }
    
    localStorage.setItem('viewMode', this.isCardView ? 'card' : 'list');
    return this.isCardView;
  }

  loadViewPreference() {
    const savedView = localStorage.getItem('viewMode');
    if (savedView) {
      this.isCardView = savedView === 'card';
      const viewToggleBtn = document.getElementById("view-toggle-btn");
      if (viewToggleBtn) {
        viewToggleBtn.textContent = this.isCardView ? "List View" : "Card View";
      }
    }
  }

  showLoadingIndicator(show = true) {
    if (this.elements.loadingIndicator) {
      this.elements.loadingIndicator.style.display = show ? 'block' : 'none';
    }
  }

  updateLoadingProgress(progress) {
    const progressText = this.elements.loadingIndicator?.querySelector('p');
    if (progressText) {
      progressText.textContent = `Loading songs... ${progress}%`;
    }
  }

  clearContainer() {
    if (this.elements.cardContainer) {
      this.elements.cardContainer.innerHTML = "";
    }
  }

  setContainerMode(isCardView) {
    if (this.elements.cardContainer) {
      this.elements.cardContainer.classList.remove("card-container", "list-container");
      this.elements.cardContainer.classList.add(isCardView ? "card-container" : "list-container");
    }
  }

  getElements() {
    return this.elements;
  }

  getIsCardView() {
    return this.isCardView;
  }
}
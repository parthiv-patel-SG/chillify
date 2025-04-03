document.addEventListener("DOMContentLoaded", () => {
  // DOM Element references
  const selectedArtistTitle = document.getElementById("selected-artist");
  const cardContainer = document.querySelector(".card-container");
  const searchBar = document.getElementById("searchBar");
  
  // Audio state management
  let currentAudio = null;
  let currentIndex = 0;
  let isPlaying = false;
  let currentPlaylist = [];
  let audioCache = new Map(); // Cache for preloaded audio
  let isCardView = true; // Track current view mode

  // Create the navbar dynamically
  const navbar = document.createElement("div");
  navbar.id = "music-navbar-container";
  navbar.innerHTML = `
    <div id="music-navbar-scroll">
      <button id="all-songs-btn">All Songs</button>
      <button id="shuffle-btn">Shuffle</button>
      <div id="artist-buttons"></div>
    </div>
    <div id="progress-container">
      <div id="progress-bar"></div>
    </div>
  `;
  document.body.appendChild(navbar);

  // Navbar button elements
  const allSongsBtn = document.getElementById("all-songs-btn");
  const shuffleBtn = document.getElementById("shuffle-btn");
  const artistButtonsContainer = document.getElementById("artist-buttons");
  const progressBar = document.getElementById("progress-bar");
  const navbarScroll = document.getElementById("music-navbar-scroll");

  // Create view toggle button
  const viewToggleBtn = document.createElement("button");
  viewToggleBtn.textContent = "List View";
  viewToggleBtn.id = "view-toggle-btn";
  viewToggleBtn.style.marginLeft = "auto"; // Push to the right side
  viewToggleBtn.addEventListener("click", toggleViewMode);
  artistButtonsContainer.appendChild(viewToggleBtn);

  // Create the "Explicit" button
  const explicitBtn = document.createElement("button");
  explicitBtn.textContent = "Explicit";
  explicitBtn.id = "explicit-btn";
  explicitBtn.addEventListener("click", displayExplicitSongs);
  artistButtonsContainer.appendChild(explicitBtn);

  // Create floating window for music controls
  const floatingWindow = document.createElement('div');
  floatingWindow.id = 'floating-window';
  floatingWindow.innerHTML = `
    <span id="floating-song-title">No song playing</span>
    <button id="prev-btn">⏮</button>
    <button id="play-pause-btn">⏯</button>
    <button id="next-btn">⏭</button>
    <div id="floating-progress-container">
      <div id="floating-progress-bar"></div>
    </div>
  `;
  document.body.appendChild(floatingWindow);
  floatingWindow.style.display = "none";

  // Add event listeners for floating window controls
  document.getElementById("prev-btn").addEventListener("click", playPreviousSong);
  document.getElementById("play-pause-btn").addEventListener("click", togglePlayPause);
  document.getElementById("next-btn").addEventListener("click", playNextSong);
  
  // Create a loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.id = 'loading-indicator';
  loadingIndicator.innerHTML = `
    <div class="spinner"></div>
    <p>Loading songs...</p>
  `;
  loadingIndicator.style.display = 'none';
  loadingIndicator.style.position = 'fixed';
  loadingIndicator.style.top = '50%';
  loadingIndicator.style.left = '50%';
  loadingIndicator.style.transform = 'translate(-50%, -50%)';
  loadingIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  loadingIndicator.style.color = 'white';
  loadingIndicator.style.padding = '20px';
  loadingIndicator.style.borderRadius = '10px';
  loadingIndicator.style.zIndex = '9999';
  loadingIndicator.style.textAlign = 'center';
  document.body.appendChild(loadingIndicator);

  // Function to toggle between card and list view
  function toggleViewMode() {
    isCardView = !isCardView;
    viewToggleBtn.textContent = isCardView ? "List View" : "Card View";
    
    // Save view preference
    localStorage.setItem('viewMode', isCardView ? 'card' : 'list');
    
    // Reload the current playlist with the new view
    if (currentPlaylist.length > 0) {
      loadSongsInBatches(currentPlaylist);
    } else {
      displayAllSongs();
    }
  }

  // Load saved view preference
  function loadViewPreference() {
    const savedView = localStorage.getItem('viewMode');
    if (savedView) {
      isCardView = savedView === 'card';
      viewToggleBtn.textContent = isCardView ? "List View" : "Card View";
    }
  }

  // Function to update progress bar
  function updateProgress(audio) {
    if (!audio) return;
    
    audio.addEventListener("timeupdate", () => {
      if (audio.duration) {
        const percentage = (audio.currentTime / audio.duration) * 100;
        progressBar.style.width = `${percentage}%`;
        
        // Update floating progress bar
        const floatingProgressBar = document.getElementById("floating-progress-bar");
        if (floatingProgressBar) {
          floatingProgressBar.style.width = `${percentage}%`;
        }
      }
    });
  }
  
  // Function to enable seeking on progress bars
  function enableProgressBarSeeking() {
    const progressContainer = document.getElementById("progress-container");
    const floatingProgressContainer = document.getElementById("floating-progress-container");
    
    // Add seeking functionality to main progress bar
    if (progressContainer) {
      progressContainer.addEventListener("click", function(e) {
        if (!currentAudio) return;
        
        const percent = (e.offsetX / this.offsetWidth);
        seekAudio(percent);
      });
    }
    
    // Add seeking functionality to floating progress bar
    if (floatingProgressContainer) {
      floatingProgressContainer.addEventListener("click", function(e) {
        if (!currentAudio) return;
        
        const percent = (e.offsetX / this.offsetWidth);
        seekAudio(percent);
      });
    }
  }

  // Function to seek to a specific position in the audio
  function seekAudio(percent) {
    if (!currentAudio || !currentAudio.duration) return;
    
    // Calculate the time to seek to
    const seekTime = percent * currentAudio.duration;
    
    // Set audio current time to new position
    currentAudio.currentTime = seekTime;
    
    // Update progress bars
    const percentage = (seekTime / currentAudio.duration) * 100;
    progressBar.style.width = `${percentage}%`;
    
    const floatingProgressBar = document.getElementById("floating-progress-bar");
    if (floatingProgressBar) {
      floatingProgressBar.style.width = `${percentage}%`;
    }
  }

  // Function to highlight active button and scroll it into view
  function highlightButton(button) {
    document.querySelectorAll("#music-navbar-scroll button").forEach((btn) => {
      btn.style.background = "#444";
      btn.style.transform = "scale(1)";
      btn.style.boxShadow = "none";
    });
    
    // Highlight the active button
    button.style.background = "linear-gradient(135deg, #ff8c00, #ff2e63)";
    button.style.transform = "scale(1.05)";
    button.style.boxShadow = "0 0 8px rgba(255, 140, 0, 0.7)";
    
    // Scroll to center of button
    setTimeout(() => {
      const scrollPos = button.offsetLeft - (navbarScroll.clientWidth / 2) + (button.clientWidth / 2);
      navbarScroll.scrollTo({
        left: scrollPos,
        behavior: 'smooth'
      });
    }, 50);
  }

  // Load songs in batches to improve performance
  function loadSongsInBatches(songsToLoad, batchSize = 6) {
    return new Promise((resolve) => {
      const totalSongs = songsToLoad.length;
      let loadedCount = 0;
      
      loadingIndicator.style.display = 'block';
      cardContainer.innerHTML = ""; // Clear container
      
      // Set container class based on view mode
      cardContainer.classList.remove("card-container", "list-container");
      cardContainer.classList.add(isCardView ? "card-container" : "list-container");
      
      function loadBatch(startIndex) {
        const endIndex = Math.min(startIndex + batchSize, totalSongs);
        
        for (let i = startIndex; i < endIndex; i++) {
          // Create appropriate item based on view mode
          const item = isCardView 
            ? createSongCard(songsToLoad[i], i)
            : createSongListItem(songsToLoad[i], i);
            
          cardContainer.appendChild(item);
          loadedCount++;
        }
        
        // Update loading indicator
        const progress = Math.min(100, Math.round((loadedCount / totalSongs) * 100));
        loadingIndicator.querySelector('p').textContent = `Loading songs... ${progress}%`;
        
        if (endIndex < totalSongs) {
          // Load next batch after a short delay to allow DOM to update
          setTimeout(() => loadBatch(endIndex), 10);
        } else {
          // Apply card colors and hide loading indicator
          if (isCardView) {
            const currentTheme = document.body.getAttribute('data-theme') || 'pastel';
            applyCardColors(currentTheme);
          }
          
          // Preload the next few audio files
          preloadNextAudioFiles(songsToLoad, 0, 3);
          
          setTimeout(() => {
            loadingIndicator.style.display = 'none';
            resolve();
          }, 200);
        }
      }
      
      // Start loading the first batch
      loadBatch(0);
    });
  }
  
  // Preload next few audio files
  function preloadNextAudioFiles(songsList, currentIdx, count) {
    for (let i = 0; i < count; i++) {
      const index = (currentIdx + i + 1) % songsList.length;
      const song = songsList[index];
      
      // Check if already cached
      if (!audioCache.has(song.src)) {
        const audio = new Audio();
        audio.preload = 'metadata';
        audio.src = song.src;
        
        audioCache.set(song.src, { 
          audio,
          loaded: false
        });
        
        // Mark as loaded when metadata is loaded
        audio.addEventListener('loadedmetadata', () => {
          const cacheItem = audioCache.get(song.src);
          if (cacheItem) cacheItem.loaded = true;
        });
      }
    }
  }

  // Function to display all songs
  async function displayAllSongs() {
    selectedArtistTitle.innerHTML = "All Songs";
    highlightButton(allSongsBtn);
    
    const filteredSongs = songs.filter((song) => !song.explicit);
    currentPlaylist = filteredSongs;
    
    await loadSongsInBatches(filteredSongs);
  }

  // Function to shuffle songs
  async function shuffleSongs() {
    highlightButton(shuffleBtn);
    selectedArtistTitle.innerHTML = "Shuffled Songs";
    
    const filteredSongs = songs.filter((song) => !song.explicit);
    const shuffled = [...filteredSongs].sort(() => Math.random() - 0.5);
    currentPlaylist = shuffled;
    
    await loadSongsInBatches(shuffled);
  }

  // Function to display artist songs
  async function displayArtistSongs(artist) {
    selectedArtistTitle.innerHTML = artist.name;
    
    // Find the artist button and highlight it
    const artistButtons = artistButtonsContainer.querySelectorAll('button');
    for (const btn of artistButtons) {
      if (btn.textContent === artist.name) {
        highlightButton(btn);
        break;
      }
    }
    
    const artistSongs = songs.filter(
      (song) => song.artistId === artist.artistId && !song.explicit
    );
    currentPlaylist = artistSongs;
    
    await loadSongsInBatches(artistSongs);
  }

  // Function to display explicit songs
// Predefined password (Change as needed)
const explicitPassword = "9";

// Function to display explicit songs
async function displayExplicitSongs() {
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
    background: "#222", // Dark background
    color: "#fff", // Light text
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
          toggle.innerHTML = "😱"; // No Glasses mode
        } else {
          input.type = "password";
          toggle.innerHTML = "🕶️"; // Hidden mode
        }
      });
      // Listen for Enter key (keyCode 13) to trigger confirm
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const password = input.value; // Get password from input field
    if (password === explicitPassword) {
      Swal.fire({
        title: "Success",
        text: "Access Granted!",
        icon: "success",
        background: "#222",
        color: "#fff",
      }).then(() => {
        selectedArtistTitle.innerHTML = "Explicit Songs";
        highlightButton(explicitBtn);

        const explicitSongs = songs.filter((song) => song.explicit);
        currentPlaylist = explicitSongs;

        loadSongsInBatches(explicitSongs);
      });
    } else {
      Swal.fire({
        title: "Access Denied",
        text: "Incorrect Code!",
        icon: "error",
        background: "#222",
        color: "#fff",
      });
    }
  }
});
},
      preConfirm: () => {
      return document.getElementById("swal-input-password").value;
    },
  });

  if (password === explicitPassword) {
    selectedArtistTitle.innerHTML = "Explicit Songs";
    highlightButton(explicitBtn);

    const explicitSongs = songs.filter((song) => song.explicit);
    currentPlaylist = explicitSongs;

    await loadSongsInBatches(explicitSongs);
  } else if (password !== undefined) {
    Swal.fire({
      title: "Access Denied",
      text: "Incorrect Code!",
      icon: "error",
      background: "#222",
      color: "#fff",
    });
  }
}

// Create the "Explicit" button and attach event listener
document.addEventListener("DOMContentLoaded", () => {
  const explicitBtn = document.createElement("button");
  explicitBtn.textContent = "Explicit";
  explicitBtn.id = "explicit-btn";

  const artistButtonsContainer = document.getElementById("artist-buttons-container");
  if (!artistButtonsContainer) {
    console.error("artistButtonsContainer not found!");
    return;
  }

  artistButtonsContainer.appendChild(explicitBtn);
  explicitBtn.addEventListener("click", displayExplicitSongs);
});



  // Function to create a song card (Card View)
  function createSongCard(song, index) {
    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.index = index;
  
    const songImg = document.createElement("img");
    songImg.src = song.imgurl || "https://via.placeholder.com/250x150";
    songImg.alt = song.title;
    songImg.loading = "lazy"; // Lazy load images
    card.appendChild(songImg);
  
    const songTitle = document.createElement("h2");
    songTitle.textContent = song.title;
    card.appendChild(songTitle);
    
    // Find artist name
    const artist = artists.find(a => a.artistId === song.artistId);
    const artistName = document.createElement("p");
    artistName.textContent = artist ? artist.name : "Unknown Artist";
    artistName.style.margin = "0 0 10px 0";
    card.appendChild(artistName);
  
    const playButton = document.createElement("button");
    playButton.textContent = "Play";
    playButton.classList.add("play-button");
    playButton.style.padding = "8px 16px";
    playButton.style.marginTop = "10px";
    playButton.style.borderRadius = "20px";
    playButton.style.border = "none";
    playButton.style.backgroundColor = "#1DB954";
    playButton.style.color = "white";
    playButton.style.cursor = "pointer";
    playButton.style.fontWeight = "bold";
    
    playButton.addEventListener("click", () => {
      playSong(song, index, card);
    });
    
    card.appendChild(playButton);
    
    // Make the whole card clickable
    card.addEventListener("click", (e) => {
      if (e.target !== playButton) { // Avoid double trigger when clicking the button
        playSong(song, index, card);
      }
    });
    
    return card;
  }
  
  // Function to create a song list item (List View)
  function createSongListItem(song, index) {
    const listItem = document.createElement("div");
    listItem.classList.add("list-item");
    listItem.dataset.index = index;
    
    // Find artist name
    const artist = artists.find(a => a.artistId === song.artistId);
    const artistName = artist ? artist.name : "Unknown Artist";
    
    // Create song info container
    const songInfo = document.createElement("div");
    songInfo.classList.add("song-info");
    
    // Song title
    const songTitle = document.createElement("span");
    songTitle.classList.add("song-title");
    songTitle.textContent = song.title;
    songInfo.appendChild(songTitle);
    
    // Artist name
    const artistSpan = document.createElement("span");
    artistSpan.classList.add("song-artist");
    artistSpan.textContent = artistName;
    songInfo.appendChild(artistSpan);
    
    listItem.appendChild(songInfo);
    
    // Play button
    const playButton = document.createElement("button");
    playButton.innerHTML = "▶️";
    playButton.classList.add("list-play-button");
    listItem.appendChild(playButton);
    
    // Add event listeners
    listItem.addEventListener("click", (e) => {
      playSong(song, index, listItem);
    });
    
    // Add styles to list item
    listItem.style.display = "flex";
    listItem.style.justifyContent = "space-between";
    listItem.style.alignItems = "center";
    listItem.style.padding = "10px 15px";
    listItem.style.margin = "8px 0";
    listItem.style.borderRadius = "8px";
    listItem.style.backgroundColor = "rgba(25, 25, 25, 0.6)";
    listItem.style.cursor = "pointer";
    listItem.style.transition = "all 0.2s ease";
    
    // Style song info
    songInfo.style.display = "flex";
    songInfo.style.flexDirection = "column";
    
    // Style song title
    songTitle.style.fontSize = "16px";
    songTitle.style.fontWeight = "bold";
    
    // Style artist name
    artistSpan.style.fontSize = "14px";
    artistSpan.style.color = "#999";
    
    // Style play button
    playButton.style.backgroundColor = "transparent";
    playButton.style.border = "none";
    playButton.style.fontSize = "20px";
    playButton.style.cursor = "pointer";
    playButton.style.padding = "5px";
    
    return listItem;
  }
  
  // Function to play a song
  function playSong(song, index, element) {
    // Create or get audio element
    let audio;
    
    // Check if the song is in the cache
    const cached = audioCache.get(song.src);
    if (cached && cached.loaded) {
      audio = cached.audio;
    } else {
      // Create new audio if not cached
      audio = new Audio(song.src);
      audio.preload = "auto";
      
      // Cache the audio
      audioCache.set(song.src, {
        audio,
        loaded: true
      });
    }
    
    // Stop current audio if playing
    if (currentAudio && currentAudio !== audio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    
    // Set the current audio and play
    currentAudio = audio;
    currentIndex = index;
    
    // Try to play and handle any errors
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isPlaying = true;
          updateFloatingWindow(song.title, element);
          updatePlayPauseButton();
          
          // Preload next audio files
          preloadNextAudioFiles(currentPlaylist, currentIndex, 3);
        })
        .catch(error => {
          console.error("Error playing audio:", error);
          alert("Unable to play this song. Please try another one.");
        });
    }
    
    // Set up ended event to play next song
    audio.addEventListener("ended", playNextSong);
    
    // Set up progress bar update
    updateProgress(audio);
    
    // Highlight the playing element
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
  
  // Toggle play/pause
  function togglePlayPause() {
    if (!currentAudio) return;

    if (currentAudio.paused) {
      currentAudio.play();
      isPlaying = true;
    } else {
      currentAudio.pause();
      isPlaying = false;
    }
    
    updatePlayPauseButton();
  }
  
  // Update play/pause button icon
  function updatePlayPauseButton() {
    const playPauseBtn = document.getElementById("play-pause-btn");
    if (!playPauseBtn) return;
    
    playPauseBtn.textContent = isPlaying ? "⏸" : "▶️";
  }
  
  // Play next song
  function playNextSong() {
    if (currentPlaylist.length === 0) return;
    
    const nextIndex = (currentIndex + 1) % currentPlaylist.length;
    const nextSong = currentPlaylist[nextIndex];
    
    // Find the item for the next song
    const selector = isCardView ? `.card[data-index="${nextIndex}"]` : `.list-item[data-index="${nextIndex}"]`;
    const nextElement = document.querySelector(selector);
    
    if (nextSong && nextElement) {
      playSong(nextSong, nextIndex, nextElement);
      nextElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
  
  // Play previous song
  function playPreviousSong() {
    if (currentPlaylist.length === 0) return;
    
    const prevIndex = (currentIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
    const prevSong = currentPlaylist[prevIndex];
    
    // Find the item for the previous song
    const selector = isCardView ? `.card[data-index="${prevIndex}"]` : `.list-item[data-index="${prevIndex}"]`;
    const prevElement = document.querySelector(selector);
    
    if (prevSong && prevElement) {
      playSong(prevSong, prevIndex, prevElement);
      prevElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
  
  // Update floating window
  function updateFloatingWindow(songTitle, element) {
    const floatingWindow = document.getElementById("floating-window");
    if (!floatingWindow) return;
    
    document.getElementById("floating-song-title").textContent = `Now Playing: ${songTitle}`;
    floatingWindow.style.display = "flex";
    
    // Store reference to current element for scrolling
    floatingWindow.dataset.currentIndex = element.dataset.index;
    
    // Add click event to scroll to the song
    floatingWindow.addEventListener("click", (e) => {
      // Only scroll when clicking on the text, not the buttons
      if (e.target.id === "floating-song-title") {
        scrollToCurrentSong();
      }
    });
  }
  
  // Scroll to current song
  function scrollToCurrentSong() {
    const selector = isCardView 
      ? `.card[data-index="${currentIndex}"]` 
      : `.list-item[data-index="${currentIndex}"]`;
      
    const currentElement = document.querySelector(selector);
    if (currentElement) {
      currentElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
  
  // Setup search functionality
  searchBar.addEventListener("input", async () => {
    const query = searchBar.value.toLowerCase().trim();
    
    if (query === "") {
      await displayAllSongs();
      return;
    }
    
    const filteredSongs = songs.filter((song) => {
      const songTitle = song.title.toLowerCase();
      const artistName = artists.find(artist => artist.artistId === song.artistId)?.name.toLowerCase() || "";
      
      return songTitle.includes(query) || artistName.includes(query);
    });
    
    currentPlaylist = filteredSongs;
    selectedArtistTitle.innerHTML = `Search Results for "${query}"`;
    
    await loadSongsInBatches(filteredSongs);
  });
  
  // Add event listeners for navigation buttons
  allSongsBtn.addEventListener("click", displayAllSongs);
  shuffleBtn.addEventListener("click", shuffleSongs);
  
  // Create buttons for each artist
  artists.forEach((artist) => {
    const artistBtn = document.createElement("button");
    artistBtn.textContent = artist.name;
    artistBtn.addEventListener("click", () => displayArtistSongs(artist));
    artistButtonsContainer.appendChild(artistBtn);
  });
  
  // Touch swipe support for mobile
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
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target === document.body) {
      e.preventDefault(); // Prevent page scroll
      togglePlayPause();
    } else if (e.code === 'ArrowRight' && e.altKey) {
      playNextSong();
    } else if (e.code === 'ArrowLeft' && e.altKey) {
      playPreviousSong();
    } else if (e.code === 'KeyV' && e.altKey) {
      // Add Alt+V shortcut to toggle view
      toggleViewMode();
    }
  });
  
  // Add CSS for list view
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
    
    /* Response to theme changes */
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
  
  // Initialize the application
  loadViewPreference(); // Load saved view preference
  displayAllSongs();
  enableProgressBarSeeking();
});

// Add theme toggle functionality
document.addEventListener('DOMContentLoaded', function() {
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
  
  // Append elements
  autoThemeContainer.appendChild(autoThemeCheckbox);
  autoThemeContainer.appendChild(autoThemeLabel);
  
  // Find theme button and create wrapper
  const themeButton = document.getElementById('theme-button');
  if (themeButton) {
    let themeContainer = themeButton.parentElement;
    
    if (themeContainer.tagName !== 'DIV' || !themeContainer.classList.contains('theme-controls')) {
      themeContainer = document.createElement('div');
      themeContainer.className = 'theme-controls';
      themeContainer.style.display = 'flex';
      themeContainer.style.flexDirection = 'column';
      themeContainer.style.alignItems = 'center';
      
      themeButton.parentNode.insertBefore(themeContainer, themeButton);
      themeContainer.appendChild(themeButton);
    }
    
    themeContainer.appendChild(autoThemeContainer);
  }
  
  // Load saved theme
  const savedTheme = localStorage.getItem('preferredTheme') || 'pastel';
  document.body.setAttribute('data-theme', savedTheme);
  updateTheme(savedTheme);
  
  if (document.getElementById('current-theme')) {
    document.getElementById('current-theme').innerText = capitalizeFirstLetter(savedTheme);
  }
  
  // Initialize auto-switching
  initAutoThemeSwitching(autoSwitchEnabled);
  
  // Add event listener for checkbox
  autoThemeCheckbox.addEventListener('change', function() {
    const isAutoEnabled = this.checked;
    localStorage.setItem('autoThemeSwitch', isAutoEnabled);
    initAutoThemeSwitching(isAutoEnabled);
  });
  
  // Theme button click handler
  themeButton.addEventListener('click', function() {
    let currentTheme = document.body.getAttribute('data-theme') || 'pastel';
    
    const themes = [
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
    
    let nextTheme = themes[(themes.indexOf(currentTheme) + 1) % themes.length];
    document.body.setAttribute('data-theme', nextTheme);
    
    localStorage.setItem('preferredTheme', nextTheme);
    
    updateTheme(nextTheme);
    applyCardColors(nextTheme);
    
    document.getElementById('current-theme').innerText = capitalizeFirstLetter(nextTheme);
  });
});

// Auto theme switching interval
let autoThemeInterval = null;

// Initialize or clear auto theme switching
function initAutoThemeSwitching(enabled) {
  if (autoThemeInterval) {
    clearInterval(autoThemeInterval);
    autoThemeInterval = null;
  }
  
  if (enabled) {
    autoThemeInterval = setInterval(() => {
      let currentTheme = document.body.getAttribute('data-theme') || 'pastel';
      
      const themes = [
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
      
      let nextTheme = themes[(themes.indexOf(currentTheme) + 1) % themes.length];
      document.body.setAttribute('data-theme', nextTheme);
      
      localStorage.setItem('preferredTheme', nextTheme);
      
      updateTheme(nextTheme);
      applyCardColors(nextTheme);
      
      if (document.getElementById('current-theme')) {
        document.getElementById('current-theme').innerText = capitalizeFirstLetter(nextTheme);
      }
    }, 60000); // Change theme every 1 minute
  }
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Update theme function
function updateTheme(theme) {
  document.body.classList.remove(...document.body.classList);
  document.body.classList.add(theme);
}

// Applying colors to the cards according to the theme
function applyCardColors(theme) {
  const songCards = document.querySelectorAll('.card'); // Using '.card' for the song cards
  
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
  
  // Get the color set for the selected theme
  const themeColors = colors[theme] || [];
  
  // Apply random color to each song card
  songCards.forEach(card => {
    const randomColor = themeColors[Math.floor(Math.random() * themeColors.length)];
    card.style.backgroundColor = randomColor;
  });
}
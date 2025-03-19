document.addEventListener("DOMContentLoaded", () => {
  const artistMenu = document.getElementById("menu");
  const selectedArtistTitle = document.getElementById("selected-artist");
  const cardContainer = document.querySelector(".card-container");
  const searchBar = document.getElementById("searchBar");

  // Create the navbar dynamically
  // Navigation bar creation
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

// Create the "Explicit" button
const explicitBtn = document.createElement("button");
explicitBtn.textContent = "Explicit";
explicitBtn.id = "explicit-btn";
explicitBtn.addEventListener("click", displayExplicitSongs);
artistButtonsContainer.appendChild(explicitBtn);

// Function to update progress bar
function updateProgress(audio) {
  audio.addEventListener("timeupdate", () => {
    const percentage = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width = `${percentage}%`;
  });
}

// Function to highlight active button and scroll it into view
function highlightButton(button) {
  // Remove active class from all buttons
  document.querySelectorAll("#music-navbar-scroll button").forEach((btn) => {
    btn.classList.remove("active-button");
  });
  
  // Add active class to clicked button
  
  // Scroll button into view
  setTimeout(() => {
    const buttonRect = button.getBoundingClientRect();
    const navRect = navbarScroll.getBoundingClientRect();
    
    // Calculate scroll position to center the button
    const scrollPos = button.offsetLeft - (navbarScroll.clientWidth / 2) + (button.clientWidth / 2);
    
    // Scroll to the button
    navbarScroll.scrollTo({
      left: scrollPos,
      behavior: 'smooth'
    });
  }, 50);
}

// Update event listeners
allSongsBtn.addEventListener("click", function() {
  displayAllSongs();
});

shuffleBtn.addEventListener("click", function() {
  shuffleSongs();
});

// Update artist buttons creation
artists.forEach((artist) => {
  const artistBtn = document.createElement("button");
  artistBtn.textContent = artist.name;
  artistBtn.addEventListener("click", function() {
    displayArtistSongs(artist);
  });
  artistButtonsContainer.appendChild(artistBtn);
});

// Update explicit button
explicitBtn.addEventListener("click", function() {
  displayExplicitSongs();
});

// Add touch swipe support for mobile
let touchStartX = 0;
let touchEndX = 0;

navbarScroll.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
});

navbarScroll.addEventListener('touchend', (e) => {
  touchEndX = e.changedTouches[0].screenX;
  const swipeDistance = touchEndX - touchStartX;
  
  if (Math.abs(swipeDistance) > 50) {
    navbarScroll.scrollBy({
      left: -swipeDistance,
      behavior: 'smooth'
    });
  }
});

// Highlight All Songs button by default
window.addEventListener('DOMContentLoaded', () => {
  highlightButton(allSongsBtn);
});

  // Function to display all songs
  function displayAllSongs() {
    selectedArtistTitle.innerHTML = "All Songs";
    cardContainer.innerHTML = "";

    const filteredSongs = songs.filter((song) => !song.explicit);

    filteredSongs.forEach((song, index) => {
      const card = createSongCard(song, index);
      cardContainer.appendChild(card);
    });
  }

  // Function to shuffle songs
  function shuffleSongs() {
    const filteredSongs = songs.filter((song) => !song.explicit);
    const shuffled = filteredSongs.sort(() => Math.random() - 0.5);
    cardContainer.innerHTML = "";

    shuffled.forEach((song, index) => {
      const card = createSongCard(song, index);
      cardContainer.appendChild(card);
    });
  }

  function displayArtistSongs(artist) {
    selectedArtistTitle.innerHTML = artist.name;
    cardContainer.innerHTML = "";

    const artistSongs = songs.filter(
      (song) => song.artistId === artist.artistId && !song.explicit
    );
      artistSongs.forEach((song, index) => {
      const card = createSongCard(song, index);
      cardContainer.appendChild(card);
    });
  }

  function displayExplicitSongs() {
    const userConfirmed = window.confirm(
      "Warning: Explicit content ahead. These songs may be harmful or inappropriate for some users. Do you wish to continue?"
    );
  
    if (userConfirmed) {
      selectedArtistTitle.innerHTML = "Explicit Songs";
      cardContainer.innerHTML = "";
  
      // Filter songs to show only explicit ones
      const explicitSongs = songs.filter((song) => song.explicit);
  
      // Create and display cards for each explicit song
      explicitSongs.forEach((song) => {
        const card = createSongCard(song);
        cardContainer.appendChild(card);
      });
  
      // Ensure currentTheme is set before applying colors
      const currentTheme = document.body.getAttribute("data-theme") || "pastel";
      applyCardColors(currentTheme);
    } else {
      alert("You have canceled the explicit content display.");
    }
  }
  

  allSongsBtn.addEventListener("click", displayAllSongs);
  shuffleBtn.addEventListener("click", shuffleSongs);

  // Function to create a song card
  let currentAudio = null; // Store the currently playing audio
  let currentIndex = 0; // Track the current song index
  
  function createSongCard(song, index) {
    const card = document.createElement("div");
    card.classList.add("card");
  
    const songImg = document.createElement("img");
    songImg.src = song.imgurl || "https://via.placeholder.com/250x150";
    card.appendChild(songImg);
  
    const songTitle = document.createElement("h2");
    songTitle.textContent = song.title;
    card.appendChild(songTitle);
  
    const audio = document.createElement("audio");
    audio.src = song.src;
    audio.controls = true;
    card.appendChild(audio);
  
    audio.addEventListener("play", () => {
      if (currentAudio && currentAudio !== audio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      currentAudio = audio;
      currentIndex = index; // Update index
      updateFloatingWindow(song.title, card);
    });
  
    audio.addEventListener("ended", () => {
      playNextSong();
    });
  
    updateProgress(audio);
    return card;
  }
  
  
  function togglePlayPause() {
    if (currentAudio) {
      if (currentAudio.paused) {
        currentAudio.play();
      } else {
        currentAudio.pause();
      }
    }
  }
  
  // Contols Buttons
  function playNextSong() {
    const allAudioElements = document.querySelectorAll("audio");
  
    if (currentIndex < allAudioElements.length - 1) {
      currentIndex++;
    } else {
      currentIndex = 0; // Loop back
    }
  
    allAudioElements[currentIndex].play();
  }
  
  function playPreviousSong() {
    const allAudioElements = document.querySelectorAll("audio");
  
    if (currentIndex > 0) {
      currentIndex--;
    } else {
      currentIndex = allAudioElements.length - 1; // Loop back to last song
    }
  
    allAudioElements[currentIndex].play();
  }
  
  displayAllSongs();

  searchBar.addEventListener("input", () => {
    const query = searchBar.value.toLowerCase().trim(); // Get the trimmed search query

    // Clear the current cards
    cardContainer.innerHTML = "";

    // If the search bar is empty, show all songs
    if (query === "") {
      displayAllSongs();
      return;
    }

    // Filter songs based on the query
    const filteredSongs = songs.filter((song) => {
      const songTitle = song.title.toLowerCase();
      const artistName = artists.find(artist => artist.artistId === song.artistId).name.toLowerCase();
      
      return songTitle.includes(query) || artistName.includes(query);
    });

    // Display the filtered songs
    filteredSongs.forEach((song) => {
      const card = createSongCard(song);
      cardContainer.appendChild(card);
    });

    // Apply random colors to the cards based on the current theme
    const currentTheme = document.body.getAttribute('data-theme') || 'pastel';
    applyCardColors(currentTheme);  });

    // Create floating window dynamically
const floatingWindow = document.createElement('div');
floatingWindow.id = 'floating-window';
floatingWindow.innerHTML = `
  <h5 id="currently-playing-title">Currently Playing</h2>
  <p id="currently-playing-song">No song is playing</p>
  <div id="floating-progress-container">
    <div id="floating-progress-bar"></div>
  </div>
`;
document.body.appendChild(floatingWindow);

let currentPlayingCard = null; // To store the currently playing song's card

let currentSongCard = null; // Store the reference to the playing song's card

function updateFloatingWindow(songTitle, card) {
  let floatingWindow = document.getElementById("floating-window");

  if (!floatingWindow) {
    floatingWindow = document.createElement("div");
    floatingWindow.id = "floating-window";
    document.body.appendChild(floatingWindow);
  }

  floatingWindow.innerHTML = `
    <span id="floating-song-title">Now Playing: ${songTitle}</span>
    <button id="prev-btn">⏮</button>
    <button id="play-pause-btn">⏯</button>
    <button id="next-btn">⏭</button>
  `;

  floatingWindow.style.display = "block";

  // Store the reference to the currently playing song card
  currentSongCard = card;

  // Add event listeners for controls
  document.getElementById("prev-btn").addEventListener("click", playPreviousSong);
  document.getElementById("play-pause-btn").addEventListener("click", togglePlayPause);
  document.getElementById("next-btn").addEventListener("click", playNextSong);

  // Add event listener for clicking floating window to scroll to the song
  floatingWindow.addEventListener("click", scrollToCurrentSong);
}

function scrollToCurrentSong() {
  if (currentSongCard) {
    currentSongCard.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}


function highlightButton(button) {
  // Remove 'active-button' class from all navbar buttons
  document.querySelectorAll("#music-navbar button").forEach((btn) => {
    btn.classList.remove("active-button");
  });

  // Add 'active-button' class to the clicked button
  button.classList.add("active-button");
}

// Update event listeners to highlight buttons when clicked
allSongsBtn.addEventListener("click", function () {
  displayAllSongs();
  highlightButton(this);
});

shuffleBtn.addEventListener("click", function () {
  shuffleSongs();
  highlightButton(this);
});

// Highlight artist buttons when clicked
artistButtonsContainer.querySelectorAll("button").forEach((button) => {
  button.addEventListener("click", function () {
    highlightButton(this);
  });
});

// Highlight explicit button when clicked
document.getElementById("explicit-btn").addEventListener("click", function () {
  displayExplicitSongs();
  highlightButton(this);
});

document.querySelectorAll("#music-navbar button").forEach(button => {
  button.addEventListener("click", () => {
    const navbar = document.getElementById("music-navbar");
    const buttonRect = button.getBoundingClientRect();
    const navbarRect = navbar.getBoundingClientRect();

    // Scroll the navbar so the button is centered
    navbar.scrollBy({
      left: buttonRect.left - navbarRect.left - (navbarRect.width / 2) + (buttonRect.width / 2),
      behavior: "smooth"
    });
  });
});


  
});

// Add the checkbox under the theme button
document.addEventListener('DOMContentLoaded', function() {
  // Create the checkbox and label container
  const autoThemeContainer = document.createElement('div');
  autoThemeContainer.className = 'auto-theme-container';
  autoThemeContainer.style.display = 'flex';
  autoThemeContainer.style.alignItems = 'center';
  autoThemeContainer.style.marginTop = '8px'; // Space below the theme button
  
  // Create the checkbox
  const autoThemeCheckbox = document.createElement('input');
  autoThemeCheckbox.type = 'checkbox';
  autoThemeCheckbox.id = 'auto-theme-toggle';
  autoThemeCheckbox.style.margin = '0 5px 0 0';
  
  // Load saved auto-switch preference
  const autoSwitchEnabled = localStorage.getItem('autoThemeSwitch') === 'true';
  autoThemeCheckbox.checked = autoSwitchEnabled;
  
  // Create the label
  const autoThemeLabel = document.createElement('label');
  autoThemeLabel.htmlFor = 'auto-theme-toggle';
  autoThemeLabel.textContent = 'Auto-switch';
  autoThemeLabel.style.fontSize = '14px';
  autoThemeLabel.style.color = 'white';
  
  // Append elements
  autoThemeContainer.appendChild(autoThemeCheckbox);
  autoThemeContainer.appendChild(autoThemeLabel);
  
  // Find the theme button and create a wrapper for it if it doesn't exist
  const themeButton = document.getElementById('theme-button');
  if (themeButton) {
    // Check if theme button is already in a container
    let themeContainer = themeButton.parentElement;
    
    // If the button isn't in a div container already, create one and wrap the button
    if (themeContainer.tagName !== 'DIV' || !themeContainer.classList.contains('theme-controls')) {
      themeContainer = document.createElement('div');
      themeContainer.className = 'theme-controls';
      themeContainer.style.display = 'flex';
      themeContainer.style.flexDirection = 'column';
      themeContainer.style.alignItems = 'center';
      
      // Replace the button with our container
      themeButton.parentNode.insertBefore(themeContainer, themeButton);
      themeContainer.appendChild(themeButton);
    }
    
    // Add the auto-theme container under the button
    themeContainer.appendChild(autoThemeContainer);
  }
  
  // Load saved theme on page load
  const savedTheme = localStorage.getItem('preferredTheme') || 'pastel';
  document.body.setAttribute('data-theme', savedTheme);
  updateTheme(savedTheme);
  applyCardColors(savedTheme);
  
  if (document.getElementById('current-theme')) {
    document.getElementById('current-theme').innerText = capitalizeFirstLetter(savedTheme);
  }
  
  // Initialize auto-switching based on saved preference
  initAutoThemeSwitching(autoSwitchEnabled);
  
  // Add event listener for the checkbox
  autoThemeCheckbox.addEventListener('change', function() {
    const isAutoEnabled = this.checked;
    
    // Save preference to localStorage
    localStorage.setItem('autoThemeSwitch', isAutoEnabled);
    
    // Initialize or clear the auto switching
    initAutoThemeSwitching(isAutoEnabled);
  });
});

// Theme buttons logic 
document.getElementById('theme-button').addEventListener('click', function() {
  let currentTheme = document.body.getAttribute('data-theme') || 'pastel';
  
  // List of available themes
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
  
  // Save the selected theme to localStorage
  localStorage.setItem('preferredTheme', nextTheme);
  
  updateTheme(nextTheme);
  applyCardColors(nextTheme);
  
  // Update the text for the current theme
  document.getElementById('current-theme').innerText = capitalizeFirstLetter(nextTheme);
});

// Auto theme switching interval reference
let autoThemeInterval = null;

// Function to initialize or clear auto theme switching
function initAutoThemeSwitching(enabled) {
  // Clear any existing interval
  if (autoThemeInterval) {
    clearInterval(autoThemeInterval);
    autoThemeInterval = null;
  }
  
  // Set up new interval if enabled
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
      
      // Save the auto-switched theme to localStorage
      localStorage.setItem('preferredTheme', nextTheme);
      
      updateTheme(nextTheme);
      applyCardColors(nextTheme);
      
      // Update the text for the current theme
      if (document.getElementById('current-theme')) {
        document.getElementById('current-theme').innerText = capitalizeFirstLetter(nextTheme);
      }
    }, 100000); // Change theme every 1 min (100000ms)
  }
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function updateTheme(theme) {
  // Remove all existing theme classes
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
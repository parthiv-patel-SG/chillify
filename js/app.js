document.addEventListener("DOMContentLoaded", () => {
  // Get elements for the artist menu, card container, and theme elements
  const artistMenu = document.getElementById("menu");
  const selectedArtistTitle = document.getElementById("selected-artist");
  const cardContainer = document.querySelector(".card-container");
  const themeButton = document.getElementById("theme-button");
  const themeNameDisplay = document.getElementById("current-theme");

  // Define available themes
  const themes = ["light", "dark", "gothic"];
  let currentTheme = localStorage.getItem("theme") || "light"; // Load saved theme or default to light

  // Apply the saved theme on page load
  document.body.classList.add(`${currentTheme}-mode`);
  themeNameDisplay.textContent = capitalizeFirstLetter(currentTheme);

  // Create buttons for all songs in nav-bar.
  const showAllSongsButton = document.createElement("button");
  showAllSongsButton.textContent = "All Songs";
  showAllSongsButton.addEventListener("click", displayAllSongs);
  artistMenu.appendChild(showAllSongsButton);


  // Create buttons for each artist in the navigation menu
  artists.forEach((artist) => {
    const button = document.createElement("button");
    button.textContent = artist.name;
    button.addEventListener("click", () => displayArtistData(artist));
    artistMenu.appendChild(button);
  });
  // Button for explicit songs.
  const showExplicitSongsButton = document.createElement("button");
  showExplicitSongsButton.textContent = "Explicit";
  showExplicitSongsButton.addEventListener("click", displayExplicitSongs);
  artistMenu.appendChild(showExplicitSongsButton);

  // Function to display all songs
function displayAllSongs() {
  // Update the selected artist title to "All Songs"
  selectedArtistTitle.innerHTML = "All Songs";

  // Clear the current cards
  cardContainer.innerHTML = "";
 
  // Filter songs that are not explicit and have a non-null image URL
  const filteredSongs = songs.filter((song) =>!song.explicit && song.imgurl);

  // Loop through all songs and create a card for each one
  filteredSongs.forEach((song) => {
    const card = createSongCard(song);
    cardContainer.appendChild(card);
  });

  // Apply random colors to the cards based on the current theme
  applyCardColors(currentTheme);
}

// Display all songs as default
 displayAllSongs();
  // // Display songs for the first artist by default
  // displayArtistData(artists[0]);

  // Function to display artist data and songs as cards
  function displayArtistData(artist) {
    selectedArtistTitle.innerHTML = `${artist.name} (${artist.urls
      .map((link) => `<a href="${link.url}" target="_blank">${link.name}</a>`)
      .join(", ")})`;

    cardContainer.innerHTML = "";

    const artistSongs = songs.filter((song) => song.artistId === artist.artistId && !song.explicit);
    artistSongs.forEach((song) => {
      const card = createSongCard(song);
      cardContainer.appendChild(card);
    });

    applyCardColors(currentTheme);
  }

  // Function to update active button in navbar
  {
function updateActiveNavButton(selectedButton) {
  // Get all buttons inside the menu
  const navButtons = document.querySelectorAll("#menu button");

  // Remove 'active' class from all buttons
  navButtons.forEach(button => button.classList.remove("active"));

  // Add 'active' class to the clicked button
  selectedButton.classList.add("active");
   // Scroll the navbar so the selected button is visible
   selectedButton.scrollIntoView({ behavior: "smooth", inline: "center" });
}

// Example usage: Call this function when switching views
document.querySelectorAll("#menu button").forEach(button => {
  button.addEventListener("click", function () {
    updateActiveNavButton(this);
  });
});
  }
 // force Start the scroll bar from the first button
  document.addEventListener("DOMContentLoaded", function () {
    const menu = document.getElementById("menu");
  
    // Scrolls to the first button on load
    menu.scrollLeft = 0;
  });
  

  // Function to create a song card
  function createSongCard(song) {
    const card = document.createElement("div");
    card.classList.add("card");

    const songImg = document.createElement("img");
    songImg.src = song.imgurl || "https://via.placeholder.com/250x150";
    songImg.alt = `${song.title} Image`;
    card.appendChild(songImg);

    const songTitle = document.createElement("h2");
    songTitle.textContent = song.title;
    card.appendChild(songTitle);

    const songYear = document.createElement("time");
    songYear.textContent = `Year: ${song.year}`;
    card.appendChild(songYear);

    const songDuration = document.createElement("span");
    const minutes = Math.floor(song.duration / 60);
    const seconds = song.duration % 60;
    songDuration.textContent = `Duration: ${minutes}:${seconds.toString().padStart(2, "0")}`;
    card.appendChild(songDuration);

    songImg.addEventListener("click", () => window.open(song.url, "_blank"));
    return card;
  }

  // Function to generate a random color for the cards
  function getRandomColor(theme) {
    const colors = {
      light: ["#80c1f5", "#d3d3d3", "#C3A2D1", "#D4E4F7", "#f5f5f5"],
      dark: ["#1E1E1E", "#333", "#4B4B4B", "#2C2C2C", "#424242"],
      gothic: ["#B71C1C", "#673AB7", "#607D8B", "#795548"],
    };

    return colors[theme][Math.floor(Math.random() * colors[theme].length)];
  }

  // Apply colors to the cards based on theme
  function applyCardColors(theme) {
    document.querySelectorAll(".card").forEach((card) => {
      card.style.backgroundColor = getRandomColor(theme);
      card.style.boxShadow = `0 4px 8px rgba(0, 0, 0, 0.1)`;
      card.style.border = `2px solid ${getRandomColor(theme)}`;
    });
  }

  // / Function to display explicit songs with a warning
  function displayExplicitSongs() {
    const userConfirmed = window.confirm("Warning: Explicit content ahead. These songs may be harmful or inappropriate for some users. Do you wish to continue?");
    
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

      // Apply random colors to the cards based on the current theme
      applyCardColors(currentTheme);
    } else {
      // If the user cancels, you can show an alert or return
      alert("You have canceled the explicit content display.");
    }
  }
   // Search functionality
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
    applyCardColors(currentTheme);
  });

  // Theme change handler
  themeButton.addEventListener("click", () => {
    let currentIndex = themes.indexOf(currentTheme);
    currentTheme = themes[(currentIndex + 1) % themes.length]; // Cycle through themes

    // Update body class for theme
    document.body.className = `${currentTheme}-mode`;

    // Update theme display
    themeNameDisplay.textContent = capitalizeFirstLetter(currentTheme);

    // Save the theme in localStorage
    localStorage.setItem("theme", currentTheme);

    // Apply new colors
    applyCardColors(currentTheme);
  });

  // Capitalize first letter of theme name
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
});

// Search Manager - Handles search functionality
export class SearchManager {
  constructor(domManager, uiManager, navigationManager) {
    this.domManager = domManager;
    this.uiManager = uiManager;
    this.navigationManager = navigationManager;
    this.init();
  }

  init() {
    const elements = this.domManager.getElements();
    if (elements.searchBar) {
      elements.searchBar.addEventListener("input", this.handleSearch.bind(this));
    }
  }

  async handleSearch() {
    const elements = this.domManager.getElements();
    const query = elements.searchBar.value.toLowerCase().trim();
    
    if (query === "") {
      // If search is cleared, display all songs and update context
      const allSongs = window.songs?.filter((song) => !song.explicit) || [];
      elements.selectedArtistTitle.innerHTML = "All Songs";
      
      // Update navigation context
      this.navigationManager.currentContext = {
        type: 'all',
        data: null,
        songs: allSongs
      };
      
      await this.uiManager.loadSongsInBatches(allSongs);
      return allSongs;
    }
    
    const filteredSongs = this.searchSongs(query);
    elements.selectedArtistTitle.innerHTML = `Search Results for "${query}"`;
    
    // Update navigation context with search results
    this.navigationManager.updateSearchContext(query, filteredSongs);
    
    await this.uiManager.loadSongsInBatches(filteredSongs);
    return filteredSongs;
  }

  searchSongs(query) {
    if (!window.songs || !window.artists) return [];

    return window.songs.filter((song) => {
      const songTitle = song.title.toLowerCase();
      const artist = window.artists.find(artist => artist.artistId === song.artistId);
      const artistName = artist ? artist.name.toLowerCase() : "";
      
      return songTitle.includes(query) || artistName.includes(query);
    });
  }

  clearSearch() {
    const elements = this.domManager.getElements();
    if (elements.searchBar) {
      elements.searchBar.value = "";
      // Trigger search handler to reset to all songs
      this.handleSearch();
    }
  }
}
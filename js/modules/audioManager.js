// Audio Manager - Handles all audio playback functionality
export class AudioManager {
  constructor() {
    this.currentAudio = null;
    this.currentIndex = 0;
    this.isPlaying = false;
    this.currentPlaylist = [];
    this.audioCache = new Map();
  }

  async playSong(song, index, onPlay, onError) {
    try {
      let audio = this.getOrCreateAudio(song.src);
      
      // Stop current audio if playing
      if (this.currentAudio && this.currentAudio !== audio) {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      }
      
      this.currentAudio = audio;
      this.currentIndex = index;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
        this.isPlaying = true;
        
        if (onPlay) onPlay();
        
        // Set up ended event to play next song
        audio.removeEventListener("ended", this.handleSongEnd);
        audio.addEventListener("ended", this.handleSongEnd.bind(this));
        
        // Preload next audio files
        this.preloadNextAudioFiles(this.currentPlaylist, this.currentIndex, 3);
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      if (onError) onError(error);
    }
  }

  getOrCreateAudio(src) {
    const cached = this.audioCache.get(src);
    if (cached && cached.loaded) {
      return cached.audio;
    }
    
    const audio = new Audio(src);
    audio.preload = "auto";
    
    this.audioCache.set(src, {
      audio,
      loaded: true
    });
    
    return audio;
  }

  preloadNextAudioFiles(songsList, currentIdx, count) {
    for (let i = 0; i < count; i++) {
      const index = (currentIdx + i + 1) % songsList.length;
      const song = songsList[index];
      
      if (!this.audioCache.has(song.src)) {
        const audio = new Audio();
        audio.preload = 'metadata';
        audio.src = song.src;
        
        this.audioCache.set(song.src, { 
          audio,
          loaded: false
        });
        
        audio.addEventListener('loadedmetadata', () => {
          const cacheItem = this.audioCache.get(song.src);
          if (cacheItem) cacheItem.loaded = true;
        });
      }
    }
  }

  handleSongEnd() {
    if (this.onSongEnd) {
      this.onSongEnd();
    }
  }

  togglePlayPause() {
    if (!this.currentAudio) return false;

    if (this.currentAudio.paused) {
      this.currentAudio.play();
      this.isPlaying = true;
    } else {
      this.currentAudio.pause();
      this.isPlaying = false;
    }
    
    return this.isPlaying;
  }

  seekTo(percent) {
    if (!this.currentAudio || !this.currentAudio.duration) return;
    
    const seekTime = percent * this.currentAudio.duration;
    this.currentAudio.currentTime = seekTime;
  }

  updateProgress(callback) {
    if (!this.currentAudio) return;
    
    this.currentAudio.addEventListener("timeupdate", () => {
      if (this.currentAudio.duration && callback) {
        const percentage = (this.currentAudio.currentTime / this.currentAudio.duration) * 100;
        callback(percentage);
      }
    });
  }

  setCurrentPlaylist(playlist) {
    this.currentPlaylist = playlist;
  }

  getCurrentPlaylist() {
    return this.currentPlaylist;
  }

  getCurrentIndex() {
    return this.currentIndex;
  }

  getCurrentAudio() {
    return this.currentAudio;
  }

  getIsPlaying() {
    return this.isPlaying;
  }

  setOnSongEnd(callback) {
    this.onSongEnd = callback;
  }

  getNextSong() {
    if (this.currentPlaylist.length === 0) return null;
    
    const nextIndex = (this.currentIndex + 1) % this.currentPlaylist.length;
    return {
      song: this.currentPlaylist[nextIndex],
      index: nextIndex
    };
  }

  getPreviousSong() {
    if (this.currentPlaylist.length === 0) return null;
    
    const prevIndex = (this.currentIndex - 1 + this.currentPlaylist.length) % this.currentPlaylist.length;
    return {
      song: this.currentPlaylist[prevIndex],
      index: prevIndex
    };
  }
}
import { SearchResult, Track } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { mockSearchResults, mockSearchHistory, mockDownloads, mockTracks } from "./mockData";

// Flag to toggle between mock data and real API
const USE_MOCK_DATA = false; // Now using real API with authentic data!

/**
 * Search for tracks by query
 * @param query Search query (title, artist, or lyrics)
 * @param sortBy Sort method
 * @returns Search results
 */
export async function searchTracks(query: string, sortBy: string = 'relevance'): Promise<SearchResult> {
  if (USE_MOCK_DATA) {
    console.log("Using mock search data");
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Check if this looks like a lyrics search (longer query)
    if (query.split(' ').length > 6) {
      return searchByLyrics(query);
    }
    
    return mockSearchResults;
  }
  
  const response = await apiRequest("GET", `/api/search?q=${encodeURIComponent(query)}&sort=${sortBy}`);
  
  if (!response.ok) {
    throw new Error('Failed to search for tracks');
  }
  
  return response.json();
}

/**
 * Search specifically for tracks by lyrics
 * @param lyrics Lyrics snippet to search for
 * @returns Search results matching the lyrics
 */
export async function searchByLyrics(lyrics: string): Promise<SearchResult> {
  if (USE_MOCK_DATA) {
    console.log("Using mock lyrics search");
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, if the lyrics contain specific words, return matching tracks
    const lyricsLower = lyrics.toLowerCase();
    let mainResult = mockTracks[0]; // Default to first track
    
    if (lyricsLower.includes("never gonna give you up") || lyricsLower.includes("strangers to love")) {
      mainResult = mockTracks[0]; // Rick Astley
    } else if (lyricsLower.includes("gangnam") || lyricsLower.includes("style")) {
      mainResult = mockTracks[2]; // Gangnam Style
    } else if (lyricsLower.includes("despacito")) {
      mainResult = mockTracks[3]; // Despacito
    } else if (lyricsLower.includes("shape of you") || lyricsLower.includes("bed of my love")) {
      mainResult = mockTracks[4]; // Shape of You
    }
    
    // Filter out the main result from other results
    const otherResults = mockTracks.filter(track => track.id !== mainResult.id);
    
    return {
      mainResult,
      otherResults: otherResults.slice(0, 4) // Limit to 4 other results
    };
  }
  
  const response = await apiRequest("GET", `/api/search/lyrics?q=${encodeURIComponent(lyrics)}`);
  
  if (!response.ok) {
    throw new Error('Failed to search by lyrics');
  }
  
  return response.json();
}

/**
 * Get search history
 * @returns Array of search history items
 */
export async function getSearchHistory(): Promise<any[]> {
  if (USE_MOCK_DATA) {
    console.log("Using mock search history");
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockSearchHistory;
  }
  
  const response = await apiRequest("GET", "/api/searches/history");
  
  if (!response.ok) {
    throw new Error('Failed to get search history');
  }
  
  return response.json();
}

/**
 * Download a track
 * @param track Track to download
 * @param format Format (mp3, mp4, wav)
 * @returns Download URL
 */
export async function downloadTrack(track: Track, format: string = 'mp3'): Promise<string> {
  const response = await fetch('/api/downloads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      videoId: track.videoId,
      title: track.title,
      artist: track.artist,
      format
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Download failed' }));
    throw new Error(errorData.error || 'Failed to download track');
  }
  
  const data = await response.json();
  return data.downloadUrl;
}

/**
 * Get download history
 * @returns Array of download records
 */
export async function getDownloadHistory(): Promise<any[]> {
  if (USE_MOCK_DATA) {
    console.log("Using mock download history");
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockDownloads;
  }
  
  const response = await apiRequest("GET", "/api/downloads/history");
  
  if (!response.ok) {
    throw new Error('Failed to get download history');
  }
  
  return response.json();
}

/**
 * Get lyrics for a track
 * @param title Track title
 * @param artist Track artist
 * @returns Lyrics text
 */
export async function getLyrics(title: string, artist: string): Promise<string> {
  if (USE_MOCK_DATA) {
    console.log("Using mock lyrics");
    await new Promise(resolve => setTimeout(resolve, 700));
    // Return some mock lyrics based on the title
    if (title.toLowerCase().includes("never gonna give you up")) {
      return "We're no strangers to love\nYou know the rules and so do I\nA full commitment's what I'm thinking of\nYou wouldn't get this from any other guy\nI just wanna tell you how I'm feeling\nGotta make you understand\n\nNever gonna give you up\nNever gonna let you down\nNever gonna run around and desert you\nNever gonna make you cry\nNever gonna say goodbye\nNever gonna tell a lie and hurt you";
    }
    return "Lyrics not found for this track.";
  }
  
  const response = await apiRequest("GET", `/api/lyrics?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`);
  
  if (!response.ok) {
    throw new Error('Failed to get lyrics');
  }
  
  const data = await response.json();
  return data.lyrics;
}
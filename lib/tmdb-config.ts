// TMDB Configuration
// This file allows switching between proxy and direct API calls

export const TMDB_CONFIG = {
  // Set to true to use proxy (recommended for ISPs that block TMDB)
  // Set to false to use direct TMDB API calls
  USE_PROXY: true,
  
  // Environment variable for TMDB API key
  API_KEY: process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY || "",
} as const;

/**
 * Helper function to get the correct TMDB API URL
 * @param endpoint - The TMDB API endpoint (e.g., "search/movie", "movie/123")
 * @returns The complete URL to use for the API call
 */
export function getTMDBUrl(endpoint: string): string {
  // Clean the endpoint - remove leading slash and any existing api_key parameter
  const cleanEndpoint = endpoint.replace(/^\//, '').replace(/[&?]api_key=[^&]*/, '');
  
  if (TMDB_CONFIG.USE_PROXY) {
    // Use the internal proxy API route
    return `/api/tmdb/proxy/${cleanEndpoint}`;
  } else {
    // Use direct TMDB API calls (requires CORS and may be blocked by some ISPs)
    const separator = cleanEndpoint.includes('?') ? '&' : '?';
    return `https://api.themoviedb.org/3/${cleanEndpoint}${separator}api_key=${TMDB_CONFIG.API_KEY}`;
  }
}

/**
 * Get the base URL for TMDB images
 * @param size - Image size (e.g., "w300", "w500", "original")
 * @returns The base URL for TMDB images
 */
export function getTMDBImageUrl(size: string = "w500"): string {
  return `https://image.tmdb.org/t/p/${size}`;
}

/**
 * Check if TMDB is properly configured
 * @returns Object with configuration status
 */
export function checkTMDBConfig(): { isConfigured: boolean; usingProxy: boolean; hasApiKey: boolean } {
  return {
    isConfigured: TMDB_CONFIG.USE_PROXY || !!TMDB_CONFIG.API_KEY,
    usingProxy: TMDB_CONFIG.USE_PROXY,
    hasApiKey: !!TMDB_CONFIG.API_KEY,
  };
}

import { useState, useCallback } from 'react';
import axios from 'axios';
import { 
  SaavnSong, 
  SaavnAlbum, 
  SaavnArtist, 
  SaavnSearchResult 
} from '@/lib/saavn';

interface UseSaavnApiReturn {
  loading: boolean;
  error: string | null;
  searchMusic: (query: string, type?: 'all' | 'songs' | 'albums' | 'artists') => Promise<SaavnSearchResult | null>;
  getSong: (id: string) => Promise<SaavnSong | null>;
  getAlbum: (id: string) => Promise<SaavnAlbum | null>;
  getArtist: (id: string) => Promise<SaavnArtist | null>;
  getLyrics: (id: string) => Promise<any>;
  getTrending: (type?: 'songs' | 'albums') => Promise<any>;
  getPlaylist: (id: string) => Promise<any>;
}

export const useSaavnApi = (): UseSaavnApiReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApiCall = useCallback(async <T>(apiCall: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Saavn API error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchMusic = useCallback(async (
    query: string, 
    type: 'all' | 'songs' | 'albums' | 'artists' = 'all'
  ): Promise<SaavnSearchResult | null> => {
    return handleApiCall(async () => {
      const response = await axios.get('/api/saavn', {
        params: { action: 'search', query, type },
        timeout: 15000
      });
      return response.data;
    });
  }, [handleApiCall]);

  const getSong = useCallback(async (id: string): Promise<SaavnSong | null> => {
    return handleApiCall(async () => {
      const response = await axios.get('/api/saavn', {
        params: { action: 'song', id },
        timeout: 10000
      });
      return response.data;
    });
  }, [handleApiCall]);

  const getAlbum = useCallback(async (id: string): Promise<SaavnAlbum | null> => {
    return handleApiCall(async () => {
      const response = await axios.get('/api/saavn', {
        params: { action: 'album', id },
        timeout: 10000
      });
      return response.data;
    });
  }, [handleApiCall]);

  const getArtist = useCallback(async (id: string): Promise<SaavnArtist | null> => {
    return handleApiCall(async () => {
      const response = await axios.get('/api/saavn', {
        params: { action: 'artist', id },
        timeout: 10000
      });
      return response.data;
    });
  }, [handleApiCall]);

  const getLyrics = useCallback(async (id: string) => {
    return handleApiCall(async () => {
      const response = await axios.get('/api/saavn', {
        params: { action: 'lyrics', id },
        timeout: 10000
      });
      return response.data;
    });
  }, [handleApiCall]);

  const getTrending = useCallback(async (type: 'songs' | 'albums' = 'songs') => {
    return handleApiCall(async () => {
      const response = await axios.get('/api/saavn', {
        params: { action: 'trending', type },
        timeout: 10000
      });
      return response.data;
    });
  }, [handleApiCall]);

  const getPlaylist = useCallback(async (id: string) => {
    return handleApiCall(async () => {
      const response = await axios.get('/api/saavn', {
        params: { action: 'playlist', id },
        timeout: 10000
      });
      return response.data;
    });
  }, [handleApiCall]);

  return {
    loading,
    error,
    searchMusic,
    getSong,
    getAlbum,
    getArtist,
    getLyrics,
    getTrending,
    getPlaylist,
  };
};
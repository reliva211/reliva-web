// lib/saavn.ts
import axios from 'axios'

const SAAVN_API_BASE = 'https://saavn.dev/api'

export interface SaavnSong {
  id: string
  name: string
  album: {
    id: string
    name: string
    url: string
  }
  year: string
  releaseDate: string
  duration: string
  label: string
  primaryArtists: string
  primaryArtistsId: string
  featuredArtists: string
  featuredArtistsId: string
  explicitContent: number
  playCount: string
  language: string
  hasLyrics: boolean
  url: string
  copyright: string
  image: Array<{
    quality: string
    link: string
  }>
  downloadUrl: Array<{
    quality: string
    link: string
  }>
}

export interface SaavnAlbum {
  id: string
  name: string
  year: string
  releaseDate: string
  songCount: string
  url: string
  primaryArtists: string
  primaryArtistsId: string
  featuredArtists: string
  featuredArtistsId: string
  artists: string
  image: Array<{
    quality: string
    link: string
  }>
  songs: SaavnSong[]
}

export interface SaavnArtist {
  id: string
  name: string
  url: string
  image: Array<{
    quality: string
    link: string
  }>
  followerCount: string
  fanCount: string
  isVerified: boolean
  dominantLanguage: string
  dominantType: string
  topSongs: SaavnSong[]
  topAlbums: SaavnAlbum[]
}

export interface SaavnSearchResult {
  songs: {
    data: SaavnSong[]
    total: number
  }
  albums: {
    data: SaavnAlbum[]
    total: number
  }
  artists: {
    data: SaavnArtist[]
    total: number
  }
}

// Search for songs, albums, and artists
export async function searchSaavn(query: string, type: 'all' | 'songs' | 'albums' | 'artists' = 'all') {
  try {
    const response = await axios.get(`${SAAVN_API_BASE}/search/${type}`, {
      params: { query },
      timeout: 10000
    })
    return response.data
  } catch (error) {
    console.error('Saavn search error:', error)
    throw error
  }
}

// Get song details by ID
export async function getSongById(songId: string): Promise<SaavnSong> {
  try {
    const response = await axios.get(`${SAAVN_API_BASE}/songs`, {
      params: { id: songId },
      timeout: 10000
    })
    return response.data.data[0]
  } catch (error) {
    console.error('Saavn song fetch error:', error)
    throw error
  }
}

// Get album details by ID
export async function getAlbumById(albumId: string): Promise<SaavnAlbum> {
  try {
    const response = await axios.get(`${SAAVN_API_BASE}/albums`, {
      params: { id: albumId },
      timeout: 10000
    })
    return response.data.data
  } catch (error) {
    console.error('Saavn album fetch error:', error)
    throw error
  }
}

// Get artist details by ID
export async function getArtistById(artistId: string): Promise<SaavnArtist> {
  try {
    const response = await axios.get(`${SAAVN_API_BASE}/artists`, {
      params: { id: artistId },
      timeout: 10000
    })
    return response.data.data
  } catch (error) {
    console.error('Saavn artist fetch error:', error)
    throw error
  }
}

// Get song lyrics
export async function getSongLyrics(songId: string) {
  try {
    const response = await axios.get(`${SAAVN_API_BASE}/lyrics`, {
      params: { id: songId },
      timeout: 10000
    })
    return response.data.data
  } catch (error) {
    console.error('Saavn lyrics fetch error:', error)
    throw error
  }
}

// Get trending/featured content
export async function getTrendingContent(type: 'songs' | 'albums' = 'songs') {
  try {
    const response = await axios.get(`${SAAVN_API_BASE}/modules`, {
      params: { language: 'english' },
      timeout: 10000
    })
    return response.data.data
  } catch (error) {
    console.error('Saavn trending fetch error:', error)
    throw error
  }
}

// Get playlists
export async function getPlaylistById(playlistId: string) {
  try {
    const response = await axios.get(`${SAAVN_API_BASE}/playlists`, {
      params: { id: playlistId },
      timeout: 10000
    })
    return response.data.data
  } catch (error) {
    console.error('Saavn playlist fetch error:', error)
    throw error
  }
}

// Helper function to get high quality image
export function getHighQualityImage(images: Array<{quality: string, link: string}>) {
  if (!images || images.length === 0) return ''
  
  // Prefer higher quality images
  const qualityOrder = ['500x500', '300x300', '150x150', '50x50']
  
  for (const quality of qualityOrder) {
    const image = images.find(img => img.quality === quality)
    if (image) return image.link
  }
  
  return images[0]?.link || ''
}

// Helper function to get download URL
export function getDownloadUrl(downloadUrls: Array<{quality: string, link: string}>, quality: '320kbps' | '160kbps' | '96kbps' = '320kbps') {
  if (!downloadUrls || downloadUrls.length === 0) return ''
  
  const url = downloadUrls.find(url => url.quality === quality)
  return url?.link || downloadUrls[0]?.link || ''
}
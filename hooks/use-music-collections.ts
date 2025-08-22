import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  setDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCurrentUser } from "./use-current-user";

export interface MusicArtist {
  id: string;
  name: string;
  image: Array<{ quality: string; url: string }>;
  type?: string;
  language?: string;
  description?: string;
  addedAt: string;
}

export interface MusicSong {
  id: string;
  name: string;
  artists: {
    primary: Array<{
      id: string;
      name: string;
    }>;
  };
  image: Array<{ quality: string; url: string }>;
  album: {
    name: string;
  };
  duration: number;
  year: string;
  language: string;
  playCount: number;
  downloadUrl?: Array<{
    quality: string;
    url: string;
  }>;
  addedAt: string;
}

export interface MusicAlbum {
  id: string;
  name: string;
  artists: {
    primary: Array<{
      id: string;
      name: string;
    }>;
  };
  image: Array<{ quality: string; url: string }>;
  year: string;
  language: string;
  songCount: number;
  playCount: number;
  songs?: MusicSong[];
  addedAt: string;
}

export interface MusicRecommendation {
  id: string;
  name: string;
  artists: {
    primary: Array<{
      id: string;
      name: string;
    }>;
  };
  image: Array<{ quality: string; url: string }>;
  year: string;
  language: string;
  songCount: number;
  playCount: number;
  songs?: MusicSong[];
  addedAt: string;
  type: 'album' | 'song' | 'artist';
}

export function useMusicCollections() {
  const { user } = useCurrentUser();
  const [followedArtists, setFollowedArtists] = useState<MusicArtist[]>([]);
  const [likedSongs, setLikedSongs] = useState<MusicSong[]>([]);
  const [likedAlbums, setLikedAlbums] = useState<MusicAlbum[]>([]);
  const [musicRecommendations, setMusicRecommendations] = useState<MusicRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all music collections
  const fetchMusicCollections = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch followed artists
      const artistsCollection = collection(
        db,
        "users",
        user.id,
        "musicArtists"
      );
      const artistsSnapshot = await getDocs(artistsCollection);
      const artists = artistsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        addedAt: doc.data().addedAt?.toDate?.() || new Date().toISOString(),
      })) as MusicArtist[];
      setFollowedArtists(artists);

      // Fetch liked songs
      const songsCollection = collection(db, "users", user.id, "musicSongs");
      const songsSnapshot = await getDocs(songsCollection);
      const songs = songsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        addedAt: doc.data().addedAt?.toDate?.() || new Date().toISOString(),
      })) as MusicSong[];
      setLikedSongs(songs);

      // Fetch liked albums
      const albumsCollection = collection(db, "users", user.id, "musicAlbums");
      const albumsSnapshot = await getDocs(albumsCollection);
      const albums = albumsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        addedAt: doc.data().addedAt?.toDate?.() || new Date().toISOString(),
      })) as MusicAlbum[];
      setLikedAlbums(albums);

      // Fetch music recommendations
      const recommendationsCollection = collection(db, "users", user.id, "musicRecommendations");
      const recommendationsSnapshot = await getDocs(recommendationsCollection);
      const recommendations = recommendationsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        addedAt: doc.data().addedAt?.toDate?.() || new Date().toISOString(),
      })) as MusicRecommendation[];
      setMusicRecommendations(recommendations);
    } catch (err) {
      console.error("Error fetching music collections:", err);
      setError("Failed to fetch music collections");
    } finally {
      setLoading(false);
    }
  };

  // Add artist to followed artists
  const followArtist = async (artist: Omit<MusicArtist, "addedAt">) => {
    if (!user?.id) return;

    try {
      const artistData = {
        ...artist,
        addedAt: new Date().toISOString(),
      };

      const artistRef = doc(db, "users", user.id, "musicArtists", artist.id);
      await setDoc(artistRef, artistData);

      setFollowedArtists((prev) => {
        const existing = prev.find((a) => a.id === artist.id);
        if (existing) {
          return prev.map((a) =>
            a.id === artist.id ? { ...a, ...artistData } : a
          );
        }
        return [...prev, artistData];
      });
    } catch (err) {
      console.error("Error following artist:", err);
      throw err;
    }
  };

  // Remove artist from followed artists
  const unfollowArtist = async (artistId: string) => {
    if (!user?.id) return;

    try {
      const artistRef = doc(db, "users", user.id, "musicArtists", artistId);
      await deleteDoc(artistRef);

      setFollowedArtists((prev) => prev.filter((a) => a.id !== artistId));
    } catch (err) {
      console.error("Error unfollowing artist:", err);
      throw err;
    }
  };

  // Add song to liked songs
  const likeSong = async (song: Omit<MusicSong, "addedAt">) => {
    console.log("likeSong called with user:", user);
    console.log("User ID:", user?.id);
    
    if (!user?.id) {
      console.error("No user ID found, cannot like song");
      return;
    }

    try {
      const songData = {
        ...song,
        addedAt: new Date().toISOString(),
      };

      console.log("Song data to save:", songData);
      const songRef = doc(db, "users", user.id, "musicSongs", song.id);
      console.log("Song reference:", songRef.path);
      
      await setDoc(songRef, songData);
      console.log("Song saved successfully");

      setLikedSongs((prev) => {
        const existing = prev.find((s) => s.id === song.id);
        if (existing) {
          return prev.map((s) =>
            s.id === song.id ? { ...s, ...songData } : s
          );
        }
        return [...prev, songData];
      });
      
      console.log("Local state updated");
    } catch (err) {
      console.error("Error liking song:", err);
      throw err;
    }
  };

  // Remove song from liked songs
  const unlikeSong = async (songId: string) => {
    console.log("unlikeSong called with songId:", songId);
    console.log("User ID:", user?.id);
    
    if (!user?.id) {
      console.error("No user ID found, cannot unlike song");
      return;
    }

    try {
      const songRef = doc(db, "users", user.id, "musicSongs", songId);
      console.log("Song reference to delete:", songRef.path);
      
      await deleteDoc(songRef);
      console.log("Song deleted successfully");

      setLikedSongs((prev) => prev.filter((s) => s.id !== songId));
      console.log("Local state updated");
    } catch (err) {
      console.error("Error unliking song:", err);
      throw err;
    }
  };

  // Add album to liked albums
  const likeAlbum = async (album: Omit<MusicAlbum, "addedAt">) => {
    if (!user?.id) return;

    try {
      const albumData = {
        ...album,
        addedAt: new Date().toISOString(),
      };

      const albumRef = doc(db, "users", user.id, "musicAlbums", album.id);
      await setDoc(albumRef, albumData);

      setLikedAlbums((prev) => {
        const existing = prev.find((a) => a.id === album.id);
        if (existing) {
          return prev.map((a) =>
            a.id === album.id ? { ...a, ...albumData } : a
          );
        }
        return [...prev, albumData];
      });
    } catch (err) {
      console.error("Error liking album:", err);
      throw err;
    }
  };

  // Remove album from liked albums
  const unlikeAlbum = async (albumId: string) => {
    if (!user?.id) return;

    try {
      const albumRef = doc(db, "users", user.id, "musicAlbums", albumId);
      await deleteDoc(albumRef);

      setLikedAlbums((prev) => prev.filter((a) => a.id !== albumId));
    } catch (err) {
      console.error("Error unliking album:", err);
      throw err;
    }
  };

  // Add album to recommendations
  const addAlbumToRecommendations = async (album: Omit<MusicAlbum, "addedAt">) => {
    if (!user?.id) return;

    try {
      const albumData: MusicRecommendation = {
        ...album,
        addedAt: new Date().toISOString(),
        type: 'album',
      };

      const recommendationRef = doc(db, "users", user.id, "musicRecommendations", album.id);
      await setDoc(recommendationRef, albumData);

      setMusicRecommendations((prev) => {
        const existing = prev.find((a) => a.id === album.id);
        if (existing) {
          return prev.map((a) =>
            a.id === album.id ? { ...a, ...albumData } : a
          );
        }
        return [...prev, albumData];
      });
    } catch (err) {
      console.error("Error adding album to recommendations:", err);
      throw err;
    }
  };

  // Remove album from recommendations
  const removeAlbumFromRecommendations = async (albumId: string) => {
    if (!user?.id) return;

    try {
      const recommendationRef = doc(db, "users", user.id, "musicRecommendations", albumId);
      await deleteDoc(recommendationRef);

      setMusicRecommendations((prev) => prev.filter((a) => a.id !== albumId));
    } catch (err) {
      console.error("Error removing album from recommendations:", err);
      throw err;
    }
  };

  // Check if item is in collection
  const isArtistFollowed = (artistId: string) => {
    return followedArtists.some((a) => a.id === artistId);
  };

  const isSongLiked = (songId: string) => {
    return likedSongs.some((s) => s.id === songId);
  };

  const isAlbumLiked = (albumId: string) => {
    return likedAlbums.some((a) => a.id === albumId);
  };

  const isAlbumInRecommendations = (albumId: string) => {
    return musicRecommendations.some((a) => a.id === albumId && a.type === 'album');
  };

  // Initialize on mount
  useEffect(() => {
    fetchMusicCollections();
  }, [user?.id]);

  return {
    followedArtists,
    likedSongs,
    likedAlbums,
    musicRecommendations,
    loading,
    error,
    followArtist,
    unfollowArtist,
    likeSong,
    unlikeSong,
    likeAlbum,
    unlikeAlbum,
    addAlbumToRecommendations,
    removeAlbumFromRecommendations,
    isArtistFollowed,
    isSongLiked,
    isAlbumLiked,
    isAlbumInRecommendations,
    refreshCollections: fetchMusicCollections,
  };
}

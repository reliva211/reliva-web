"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { useMusicCollections } from "@/hooks/use-music-collections";
import { useToast } from "@/hooks/use-toast";
import { useYouTubePlayer } from "@/hooks/use-youtube-player";
import YouTubePlayer from "@/components/youtube-player";

import {
  Music,
  Play,
  Heart,
  Clock,
  Users,
  Disc,
  Plus,
  Check,
} from "lucide-react";

interface Song {
  id: string;
  name: string;
  type: string;
  year: string | null;
  releaseDate: string | null;
  duration: number | null;
  label: string | null;
  explicitContent: boolean;
  playCount: number | null;
  language: string;
  hasLyrics: boolean;
  lyricsId: string | null;
  url: string;
  copyright: string | null;
  album: {
    id: string | null;
    name: string | null;
    url: string | null;
  };
  artists: {
    primary: Array<{
      id: string;
      name: string;
      role: string;
      type: string;
      image: Array<{
        quality: string;
        url: string;
      }>;
      url: string;
    }>;
    featured: Array<{
      id: string;
      name: string;
      role: string;
      type: string;
      image: Array<{
        quality: string;
        url: string;
      }>;
      url: string;
    }>;
    all: Array<{
      id: string;
      name: string;
      role: string;
      type: string;
      image: Array<{
        quality: string;
        url: string;
      }>;
      url: string;
    }>;
  };
  image: Array<{
    quality: string;
    url: string;
  }>;
  downloadUrl: Array<{
    quality: string;
    url: string;
  }>;
}

export default function SongDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    isSongLiked,
    likeSong,
    unlikeSong,
    addAlbumToRecommendations,
    removeAlbumFromRecommendations,
    isAlbumInRecommendations,
  } = useMusicCollections();
  const { toast } = useToast();
  const { showPlayer } = useYouTubePlayer();

  const getImageUrl = (images: any[]) => {
    return (
      images?.[2]?.url ||
      images?.[1]?.url ||
      images?.[0]?.url ||
      "/placeholder.svg"
    );
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const fetchSongDetails = async () => {
      if (!resolvedParams.id) return;

      setLoading(true);
      try {
        // Fetch song details using the song ID directly
        const songResponse = await fetch(
          `/api/saavn/song?id=${resolvedParams.id}`
        );
        const songData = await songResponse.json();

        if (songData.data) {
          setSong(songData.data);
        } else {
          setError("Song not found");
        }
      } catch (err) {
        console.error("Error fetching song details:", err);
        setError("Failed to load song details");
      } finally {
        setLoading(false);
      }
    };

    fetchSongDetails();
  }, [resolvedParams.id]);

  const handleAddToRecommendations = async () => {
    if (!song) return;

    try {
      // For songs, we'll add the album to recommendations if it exists
      if (song.album?.id) {
        if (isAlbumInRecommendations(song.album.id)) {
          await removeAlbumFromRecommendations(song.album.id);
          toast({
            title: "Removed from recommendations",
            description: `${song.album.name} has been removed from your recommendations.`,
          });
        } else {
          // Convert to album format and add to recommendations
          const albumData = {
            id: song.album.id,
            name: song.album.name || "Unknown Album",
            artists: song.artists || { primary: [] },
            image: song.image || [],
            year: song.year || "Unknown",
            language: song.language || "Unknown",
            songCount: 1,
            playCount: song.playCount || 0,
            songs: [
              {
                ...song,
                addedAt: new Date().toISOString(),
              },
            ],
          };

          await addAlbumToRecommendations(albumData);
          toast({
            title: "Added to recommendations",
            description: `${song.album.name} has been added to your recommendations.`,
          });
        }
      } else {
        toast({
          title: "No album information",
          description:
            "This song doesn't have album information to add to recommendations.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update recommendations. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLikeSong = async () => {
    if (!song) return;

    try {
      if (isSongLiked(song.id)) {
        await unlikeSong(song.id);
        toast({
          title: "Song removed from liked songs",
          description: `${song.name} has been removed from your liked songs.`,
        });
      } else {
        // Convert Song to MusicSong format
        const musicSong = {
          id: song.id,
          name: song.name || "Unknown Song",
          artists: song.artists || { primary: [] },
          image: song.image || [],
          album: song.album || { name: "Unknown Album" },
          duration: song.duration || 0,
          year: song.year || "Unknown",
          language: song.language || "Unknown",
          playCount: song.playCount || 0,
          downloadUrl: song.downloadUrl || [],
        };

        await likeSong(musicSong);
        toast({
          title: "Song added to liked songs",
          description: `${song.name} has been added to your liked songs.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update liked songs. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <p className="text-gray-400 text-lg">Loading song details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !song) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              Song Not Found
            </h1>
            <p className="text-gray-400 mb-4">
              {error || "The song you're looking for doesn't exist."}
            </p>
            <Button
              onClick={() => router.push("/music")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Back to Music
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white"
            >
              ← Back
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Song Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="flex-shrink-0">
            <div className="relative">
              <img
                src={getImageUrl(song.image)}
                alt={song.name}
                className="w-48 h-48 md:w-64 md:h-64 rounded-lg object-cover shadow-2xl"
              />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {song.name}
                </h1>
                <div className="flex items-center gap-4 text-gray-400 mb-4">
                  <span>
                    {song.artists?.primary
                      ?.map((artist) => artist.name)
                      .join(", ") || "Unknown Artist"}
                  </span>
                  {song.album?.name && (
                    <>
                      <span>•</span>
                      <span>{song.album.name}</span>
                    </>
                  )}
                  {song.year && (
                    <>
                      <span>•</span>
                      <span>{song.year}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={async () => {
                    // Create song object for YouTube player
                    const songForPlayer = {
                      id: song.id,
                      title: song.name,
                      artist:
                        song.artists?.primary
                          ?.map((artist) => artist.name)
                          .join(", ") || "Unknown Artist",
                    };

                    // Create a single-song queue
                    const queue = [songForPlayer];

                    // Song Detail Page Play Button - Queue created

                    // Start playing the song
                    await showPlayer(songForPlayer, queue, 0);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Play
                </Button>
                <Button
                  onClick={handleLikeSong}
                  className={`${
                    isSongLiked(song.id)
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-gray-700 text-white hover:bg-gray-600 border border-gray-600"
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 mr-2 ${
                      isSongLiked(song.id) ? "fill-current" : ""
                    }`}
                  />
                  {isSongLiked(song.id) ? "Liked" : "Like"}
                </Button>
                {song.album?.id && (
                  <Button
                    onClick={handleAddToRecommendations}
                    variant="outline"
                    className={`${
                      isAlbumInRecommendations(song.album.id)
                        ? "bg-primary/20 text-primary border-primary/30"
                        : "bg-gray-700 text-white hover:bg-gray-600 border border-gray-600"
                    }`}
                  >
                    {isAlbumInRecommendations(song.album.id) ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        In List
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add to List
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(song.duration)}</span>
              </div>
              {song.language && (
                <div className="flex items-center gap-2">
                  <span>•</span>
                  <span>{song.language}</span>
                </div>
              )}
              {song.playCount && (
                <div className="flex items-center gap-2">
                  <span>•</span>
                  <Play className="w-4 h-4" />
                  <span>{song.playCount.toLocaleString()} plays</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* YouTube Player for music playback */}
      <YouTubePlayer />
    </div>
  );
}

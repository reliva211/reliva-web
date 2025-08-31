"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  AlertCircle,
  SkipBack,
  Play,
  SkipForward,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useYouTubePlayer } from "@/hooks/use-youtube-player";

// Extend Window interface for YouTube API
declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: {
      Player: any;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
        BUFFERING: number;
        CUED: number;
        UNSTARTED: number;
      };
    };
  }
}

export default function YouTubePlayer() {
  const {
    isVisible,
    currentSong,
    queue,
    currentIndex,
    hidePlayer,
    isLoading,
    playNext,
    playPrevious,
  } = useYouTubePlayer();
  const [playerLoading, setPlayerLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  // Check if we can navigate
  const hasNext = currentIndex < queue.length - 1;
  const hasPrevious = currentIndex > 0;

  // Load YouTube API and initialize player
  useEffect(() => {
    if (!isVisible || !currentSong?.videoId) return;

    const loadYouTubeAPI = () => {
      if (window.YT) {
        initializePlayer();
        return;
      }

      // Load YouTube IFrame API
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initializePlayer();
      };
    };

    const initializePlayer = () => {
      if (!playerRef.current || !currentSong?.videoId) return;

      setPlayerLoading(true);
      setHasError(false);
      setErrorMessage("");

      // Destroy existing player before creating new one
      if (player) {
        try {
          player.destroy();
        } catch (error) {
          // Error destroying player
        }
      }

      // Loading video

      // Responsive player dimensions - smaller for mobile floating design
      const isMobile = window.innerWidth < 768;
      const playerWidth = isMobile ? "280" : "400";
      const playerHeight = isMobile ? "160" : "200";

      const newPlayer = new window.YT.Player(playerRef.current, {
        height: playerHeight,
        width: playerWidth,
        videoId: currentSong.videoId,
        playerVars: {
          autoplay: 1, // Enable autoplay
          controls: 0, // Hide YouTube's built-in controls for custom overlay
          modestbranding: 1,
          rel: 0, // Don't show related videos
          showinfo: 0, // Hide video info
          iv_load_policy: 3,
          fs: 0, // Disable fullscreen button
          mute: 0, // Start unmuted for autoplay to work
          color: "white", // White progress bar
          theme: "dark", // Dark theme
        },
        events: {
          onReady: (event: any) => {
            setPlayer(event.target);
            setPlayerLoading(false);
            // YouTube player ready

            // Auto-play the video
            try {
              event.target.playVideo();
            } catch (error) {
              // Autoplay blocked, user needs to interact first
            }
          },
          onStateChange: (event: any) => {
            // Player state changed
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              // Auto-play next song when current ends
              if (hasNext) {
                playNext();
              }
            }
          },
          onError: (event: any) => {
            console.error("❌ YouTube player error:", event.data);
            setPlayerLoading(false);
            setHasError(true);

            // Handle different error types
            switch (event.data) {
              case 2:
                setErrorMessage("Invalid video ID");
                break;
              case 5:
                setErrorMessage("HTML5 player error");
                break;
              case 100:
                setErrorMessage("Video not found");
                break;
              case 101:
              case 150:
                setErrorMessage("Video not available for embedding");
                break;
              default:
                setErrorMessage("Video playback error");
            }
          },
        },
      });
    };

    loadYouTubeAPI();

    return () => {
      // Clean up player when component unmounts or song changes
      if (player) {
        try {
          player.destroy();
        } catch (error) {
          // Error destroying player on cleanup
        }
      }
    };
  }, [isVisible, currentSong?.videoId, hasNext, playNext, isExpanded]);

  const togglePlay = () => {
    if (!player) return;

    try {
      if (isPlaying) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
    } catch (error) {
      console.error("Error toggling play:", error);
    }
  };

  const handleNext = async () => {
    // Next button clicked
    if (hasNext) {
      await playNext();
    } else {
      // Cannot go to next song - no more songs in queue
    }
  };

  const handlePrevious = async () => {
    // Previous button clicked
    if (hasPrevious) {
      await playPrevious();
    } else {
      // Cannot go to previous song - at first song
    }
  };

  if (!isVisible || !currentSong) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[280px] sm:w-[320px] bg-black rounded-lg shadow-2xl border border-gray-700 overflow-hidden youtube-player">
      {/* Video Player Container */}
      <div className="relative video-container">
        <div
          ref={playerRef}
          className="w-full h-[140px] sm:h-[180px] bg-black flex items-center justify-center"
        >
          {isLoading && !hasError && (
            <div className="text-white text-sm flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span className="hidden sm:inline">Searching for video...</span>
              <span className="sm:hidden">Searching...</span>
            </div>
          )}

          {playerLoading && !hasError && (
            <div className="text-white text-sm flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span className="hidden sm:inline">Loading video...</span>
              <span className="sm:hidden">Loading...</span>
            </div>
          )}

          {hasError && (
            <div className="text-white text-center p-2 sm:p-4">
              <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-red-400" />
              <p className="text-xs sm:text-sm font-medium mb-1">
                Video Unavailable
              </p>
              <p className="text-xs text-gray-300">{errorMessage}</p>
              <p className="text-xs text-gray-400 mt-2">
                {currentSong.title} - {currentSong.artist}
              </p>
            </div>
          )}
        </div>

        {/* Control Overlay - Positioned over the video */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top Controls */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-auto">
            {/* Settings/Info Button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
            >
              <span className="text-xs">⚙️</span>
            </Button>

            {/* Expand/Close Button */}
            <div className="flex items-center gap-1">
              <Button
                onClick={() => setIsExpanded(!isExpanded)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
              >
                <span className="text-xs">⛶</span>
              </Button>
              <Button
                onClick={hidePlayer}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-auto">
            {/* Previous Button */}
            <Button
              onClick={handlePrevious}
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 bg-black/50 hover:bg-black/70 rounded-full ${
                hasPrevious ? "text-white" : "text-gray-500 cursor-not-allowed"
              }`}
              disabled={!hasPrevious}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            {/* Play/Pause Button */}
            <Button
              onClick={togglePlay}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
              disabled={!player}
            >
              {isPlaying ? (
                <div className="h-4 w-4 flex items-center justify-center">
                  <div className="w-1 h-4 bg-current border-l border-r border-current"></div>
                </div>
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </Button>

            {/* Next Button */}
            <Button
              onClick={handleNext}
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 bg-black/50 hover:bg-black/70 rounded-full ${
                hasNext ? "text-white" : "text-gray-500 cursor-not-allowed"
              }`}
              disabled={!hasNext}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Center Info (when not playing) */}
          {!isPlaying && player && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/70 rounded-lg px-3 py-1">
                <p className="text-white text-xs font-medium truncate max-w-[200px]">
                  {currentSong.title}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Song Info Bar - Only show on mobile when expanded */}
      {isExpanded && (
        <div className="px-3 py-2 bg-gray-900 border-t border-gray-700">
          <p className="text-white text-xs font-medium truncate song-title">
            {currentSong.title}
          </p>
          <p className="text-gray-400 text-xs truncate artist-name">
            {currentSong.artist}
          </p>
          {queue.length > 1 && (
            <p className="text-gray-500 text-xs">
              {currentIndex + 1} of {queue.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

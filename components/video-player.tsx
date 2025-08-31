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
import { useVideoPlayer } from "@/hooks/use-video-player";

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

export default function VideoPlayer() {
  const {
    isVisible,
    currentVideo,
    queue,
    currentIndex,
    hidePlayer,
    isLoading,
    playNext,
    playPrevious,
  } = useVideoPlayer();
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
    if (!isVisible || !currentVideo?.trailerKey) return;

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
      if (!playerRef.current || !currentVideo?.trailerKey) return;

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

      // Loading trailer

      // Responsive player dimensions - smaller for mobile floating design
      const isMobile = window.innerWidth < 768;
      const playerWidth = isMobile ? "280" : "400";
      const playerHeight = isMobile ? "160" : "200";

      const newPlayer = new window.YT.Player(playerRef.current, {
        height: playerHeight,
        width: playerWidth,
        videoId: currentVideo.trailerKey,
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
            // Video player ready

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
              // Auto-play next video when current ends
              if (hasNext) {
                playNext();
              }
            }
          },
          onError: (event: any) => {
            console.error("❌ Video player error:", event.data);
            setHasError(true);
            setErrorMessage("Failed to load trailer");
            setPlayerLoading(false);
          },
        },
      });
    };

    loadYouTubeAPI();

    // Cleanup function
    return () => {
      if (player) {
        try {
          player.destroy();
        } catch (error) {
          // Error destroying player on cleanup
        }
      }
    };
  }, [isVisible, currentVideo, hasNext, playNext]);

  // Handle play/pause
  const togglePlay = () => {
    if (!player) return;

    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  // Handle navigation
  const handleNext = () => {
    if (hasNext) {
      playNext();
    }
  };

  const handlePrevious = () => {
    if (hasPrevious) {
      playPrevious();
    }
  };

  if (!isVisible || !currentVideo) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
        isExpanded ? "h-screen" : "h-48 md:h-56"
      }`}
    >
      {/* Main Player Container */}
      <div className="relative w-full h-full bg-black">
        {/* YouTube Player */}
        <div className="w-full h-full flex items-center justify-center">
          {playerLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
                <p className="text-white text-sm">Loading trailer...</p>
              </div>
            </div>
          )}

          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                <p className="text-white text-sm">{errorMessage}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="mt-2"
                  size="sm"
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          <div ref={playerRef} className="w-full h-full" />
        </div>

        {/* Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            {/* Video Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold truncate">
                {currentVideo.title}
              </h3>
              <p className="text-gray-300 text-sm">
                {currentVideo.type === "movie" ? "Movie" : "Series"} Trailer
                {queue.length > 1 &&
                  ` • ${currentIndex + 1} of ${queue.length}`}
              </p>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevious}
                disabled={!hasPrevious}
                className="text-white hover:bg-white/20"
              >
                <SkipBack className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlay}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? (
                  <div className="w-4 h-4 border-2 border-white border-l-transparent rounded-full animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleNext}
                disabled={!hasNext}
                className="text-white hover:bg-white/20"
              >
                <SkipForward className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-white hover:bg-white/20"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={hidePlayer}
                className="text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { create } from "zustand";

interface Video {
  id: string;
  title: string;
  type: string; // "movie" or "series"
  videoId?: string;
  trailerKey?: string;
}

interface VideoPlayerState {
  isVisible: boolean;
  currentVideo: Video | null;
  queue: Video[];
  currentIndex: number;
  isLoading: boolean;
  showPlayer: (
    video: Video,
    queue?: Video[],
    startIndex?: number
  ) => Promise<void>;
  hidePlayer: () => void;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useVideoPlayer = create<VideoPlayerState>((set, get) => ({
  isVisible: false,
  currentVideo: null,
  queue: [],
  currentIndex: 0,
  isLoading: false,
  showPlayer: async (
    video: Video,
    queue: Video[] = [],
    startIndex: number = 0
  ) => {
    set({ isLoading: true });

    try {
      let finalQueue = queue;
      let finalIndex = startIndex;

      // If no queue provided, create a single-video queue
      if (queue.length === 0) {
        finalQueue = [video];
        finalIndex = 0;
      }

      // If video is not in queue, add it
      const videoIndex = finalQueue.findIndex((v) => v.id === video.id);
      if (videoIndex === -1) {
        finalQueue = [...finalQueue, video];
        finalIndex = finalQueue.length - 1;
      } else {
        finalIndex = videoIndex;
      }

      // Get the current video from queue
      const currentVideo = finalQueue[finalIndex];

      // If no trailerKey, search YouTube for the trailer
      if (!currentVideo.trailerKey) {
        const searchQuery = `${currentVideo.title} ${
          currentVideo.type === "movie" ? "movie" : "series"
        } official trailer 2024`;
        // Searching for trailer

        try {
          const response = await fetch(
            `/api/youtube/search?q=${encodeURIComponent(searchQuery)}`
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          if (data.success && data.data?.videoId) {
            // Update the video with trailerKey
            finalQueue[finalIndex] = {
              ...currentVideo,
              trailerKey: data.data.videoId,
            };
            // Found trailer
          } else {
            // No trailer found, using fallback
            // Use a popular movie trailer as fallback
            finalQueue[finalIndex] = {
              ...currentVideo,
              trailerKey: "dQw4w9WgXcQ", // Rick Roll as fallback
            };
          }
        } catch (error) {
          console.error("❌ Error searching for trailer:", error);
          // Use fallback
          finalQueue[finalIndex] = {
            ...currentVideo,
            trailerKey: "dQw4w9WgXcQ", // Rick Roll as fallback
          };
        }
      }

      set({
        isVisible: true,
        currentVideo: finalQueue[finalIndex],
        queue: finalQueue,
        currentIndex: finalIndex,
        isLoading: false,
      });
    } catch (error) {
      console.error("❌ Error showing video player:", error);
      set({
        isVisible: true,
        currentVideo: video,
        queue: [video],
        currentIndex: 0,
        isLoading: false,
      });
    }
  },
  hidePlayer: () => {
    set({
      isVisible: false,
      currentVideo: null,
      queue: [],
      currentIndex: 0,
      isLoading: false,
    });
  },
  playNext: async () => {
    const { queue, currentIndex } = get();
    const nextIndex = currentIndex + 1;

    if (nextIndex < queue.length) {
      const nextVideo = queue[nextIndex];
      // Playing next video

      // If next video has no trailerKey, search for it
      if (!nextVideo.trailerKey) {
        set({ isLoading: true });
        try {
          const searchQuery = `${nextVideo.title} ${
            nextVideo.type === "movie" ? "movie" : "series"
          } official trailer 2024`;
          // Searching for next trailer

          const response = await fetch(
            `/api/youtube/search?q=${encodeURIComponent(searchQuery)}`
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          if (data.success && data.data?.videoId) {
            // Update the queue with trailerKey
            const updatedQueue = [...queue];
            updatedQueue[nextIndex] = {
              ...nextVideo,
              trailerKey: data.data.videoId,
            };

            // Found trailer for next video
            set({
              currentVideo: updatedQueue[nextIndex],
              queue: updatedQueue,
              currentIndex: nextIndex,
              isLoading: false,
            });
          } else {
            // Use fallback video
            const updatedQueue = [...queue];
            updatedQueue[nextIndex] = {
              ...nextVideo,
              trailerKey: "dQw4w9WgXcQ",
            };

            // Using fallback trailer for next video
            set({
              currentVideo: updatedQueue[nextIndex],
              queue: updatedQueue,
              currentIndex: nextIndex,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error("❌ Error loading next video:", error);
          set({ isLoading: false });
        }
      } else {
        // Next video already has trailerKey
        set({
          currentVideo: nextVideo,
          currentIndex: nextIndex,
        });
      }
    } else {
      // No next video available
    }
  },
  playPrevious: async () => {
    const { queue, currentIndex } = get();
    const prevIndex = currentIndex - 1;

    if (prevIndex >= 0) {
      const prevVideo = queue[prevIndex];
      // Playing previous video

      // If previous video has no trailerKey, search for it
      if (!prevVideo.trailerKey) {
        set({ isLoading: true });
        try {
          const searchQuery = `${prevVideo.title} ${
            prevVideo.type === "movie" ? "movie" : "series"
          } official trailer 2024`;
          // Searching for previous trailer

          const response = await fetch(
            `/api/youtube/search?q=${encodeURIComponent(searchQuery)}`
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          if (data.success && data.data?.videoId) {
            // Update the queue with trailerKey
            const updatedQueue = [...queue];
            updatedQueue[prevIndex] = {
              ...prevVideo,
              trailerKey: data.data.videoId,
            };

            // Found trailer for previous video
            set({
              currentVideo: updatedQueue[prevIndex],
              queue: updatedQueue,
              currentIndex: prevIndex,
              isLoading: false,
            });
          } else {
            // Use fallback video
            const updatedQueue = [...queue];
            updatedQueue[prevIndex] = {
              ...prevVideo,
              trailerKey: "dQw4w9WgXcQ",
            };

            // Using fallback trailer for previous video
            set({
              currentVideo: updatedQueue[prevIndex],
              queue: updatedQueue,
              currentIndex: prevIndex,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error("❌ Error loading previous video:", error);
          set({ isLoading: false });
        }
      } else {
        // Previous video already has trailerKey
        set({
          currentVideo: prevVideo,
          currentIndex: prevIndex,
        });
      }
    } else {
      // No previous video available
    }
  },
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));

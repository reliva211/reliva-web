import { create } from "zustand";

interface Song {
  id: string;
  title: string;
  artist: string;
  videoId?: string;
}

interface YouTubePlayerState {
  isVisible: boolean;
  currentSong: Song | null;
  queue: Song[];
  currentIndex: number;
  isLoading: boolean;
  showPlayer: (
    song: Song,
    queue?: Song[],
    startIndex?: number
  ) => Promise<void>;
  hidePlayer: () => void;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useYouTubePlayer = create<YouTubePlayerState>((set, get) => ({
  isVisible: false,
  currentSong: null,
  queue: [],
  currentIndex: 0,
  isLoading: false,
  showPlayer: async (
    song: Song,
    queue: Song[] = [],
    startIndex: number = 0
  ) => {
    set({ isLoading: true });

    try {
      let finalQueue = queue;
      let finalIndex = startIndex;

      // If no queue provided, create a single-song queue
      if (queue.length === 0) {
        finalQueue = [song];
        finalIndex = 0;
      }

      // If song is not in queue, add it
      const songIndex = finalQueue.findIndex((s) => s.id === song.id);
      if (songIndex === -1) {
        finalQueue = [...finalQueue, song];
        finalIndex = finalQueue.length - 1;
      } else {
        finalIndex = songIndex;
      }

      // Get the current song from queue
      const currentSong = finalQueue[finalIndex];

      // If no videoId, search YouTube for the song
      if (!currentSong.videoId) {
        const searchQuery = `${currentSong.title} ${currentSong.artist} official audio`;
        console.log(`🔍 Searching for: ${searchQuery}`);

        const response = await fetch(
          `/api/youtube/search?q=${encodeURIComponent(searchQuery)}`
        );
        const data = await response.json();

        if (data.success && data.data?.videoId) {
          // Update the song with videoId
          finalQueue[finalIndex] = {
            ...currentSong,
            videoId: data.data.videoId,
          };
          console.log(`✅ Found video ID: ${data.data.videoId}`);
        } else {
          console.log("❌ No video found, using fallback");
          // Use a popular music video as fallback
          finalQueue[finalIndex] = {
            ...currentSong,
            videoId: "9bZkp7q19f0", // PSY - GANGNAM STYLE
          };
        }
      }

      set({
        isVisible: true,
        currentSong: finalQueue[finalIndex],
        queue: finalQueue,
        currentIndex: finalIndex,
        isLoading: false,
      });
    } catch (error) {
      console.error("❌ Error showing player:", error);
      set({
        isVisible: true,
        currentSong: song,
        queue: [song],
        currentIndex: 0,
        isLoading: false,
      });
    }
  },
  playNext: async () => {
    const { queue, currentIndex } = get();
    console.log(
      "🎵 playNext called - currentIndex:",
      currentIndex,
      "queue length:",
      queue.length
    );

    if (currentIndex < queue.length - 1) {
      const nextIndex = currentIndex + 1;
      const nextSong = queue[nextIndex];
      console.log(
        "🎵 Moving to next song:",
        nextSong.title,
        "at index:",
        nextIndex
      );

      // If next song has no videoId, search for it
      if (!nextSong.videoId) {
        set({ isLoading: true });
        try {
          const searchQuery = `${nextSong.title} ${nextSong.artist} official audio`;
          console.log(`🔍 Searching for next song: ${searchQuery}`);

          const response = await fetch(
            `/api/youtube/search?q=${encodeURIComponent(searchQuery)}`
          );
          const data = await response.json();

          if (data.success && data.data?.videoId) {
            // Update the queue with videoId
            const updatedQueue = [...queue];
            updatedQueue[nextIndex] = {
              ...nextSong,
              videoId: data.data.videoId,
            };

            console.log("✅ Found video for next song:", data.data.videoId);
            set({
              currentSong: updatedQueue[nextIndex],
              queue: updatedQueue,
              currentIndex: nextIndex,
              isLoading: false,
            });
          } else {
            // Use fallback video
            const updatedQueue = [...queue];
            updatedQueue[nextIndex] = {
              ...nextSong,
              videoId: "9bZkp7q19f0",
            };

            console.log("⚠️ Using fallback video for next song");
            set({
              currentSong: updatedQueue[nextIndex],
              queue: updatedQueue,
              currentIndex: nextIndex,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error("❌ Error loading next song:", error);
          set({ isLoading: false });
        }
      } else {
        console.log("✅ Next song already has videoId:", nextSong.videoId);
        set({
          currentSong: nextSong,
          currentIndex: nextIndex,
        });
      }
    } else {
      console.log("⚠️ No next song available");
    }
  },
  playPrevious: async () => {
    const { queue, currentIndex } = get();
    console.log(
      "🎵 playPrevious called - currentIndex:",
      currentIndex,
      "queue length:",
      queue.length
    );

    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      const prevSong = queue[prevIndex];
      console.log(
        "🎵 Moving to previous song:",
        prevSong.title,
        "at index:",
        prevIndex
      );

      // If previous song has no videoId, search for it
      if (!prevSong.videoId) {
        set({ isLoading: true });
        try {
          const searchQuery = `${prevSong.title} ${prevSong.artist} official audio`;
          console.log(`🔍 Searching for previous song: ${searchQuery}`);

          const response = await fetch(
            `/api/youtube/search?q=${encodeURIComponent(searchQuery)}`
          );
          const data = await response.json();

          if (data.success && data.data?.videoId) {
            // Update the queue with videoId
            const updatedQueue = [...queue];
            updatedQueue[prevIndex] = {
              ...prevSong,
              videoId: data.data.videoId,
            };

            console.log("✅ Found video for previous song:", data.data.videoId);
            set({
              currentSong: updatedQueue[prevIndex],
              queue: updatedQueue,
              currentIndex: prevIndex,
              isLoading: false,
            });
          } else {
            // Use fallback video
            const updatedQueue = [...queue];
            updatedQueue[prevIndex] = {
              ...prevSong,
              videoId: "9bZkp7q19f0",
            };

            console.log("⚠️ Using fallback video for previous song");
            set({
              currentSong: updatedQueue[prevIndex],
              queue: updatedQueue,
              currentIndex: prevIndex,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error("❌ Error loading previous song:", error);
          set({ isLoading: false });
        }
      } else {
        console.log("✅ Previous song already has videoId:", prevSong.videoId);
        set({
          currentSong: prevSong,
          currentIndex: prevIndex,
        });
      }
    } else {
      console.log("⚠️ No previous song available");
    }
  },
  hidePlayer: () =>
    set({
      isVisible: false,
      currentSong: null,
      queue: [],
      currentIndex: 0,
      isLoading: false,
    }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
}));

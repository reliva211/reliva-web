import { NextRequest, NextResponse } from "next/server";

// Popular music videos as fallbacks
const FALLBACK_VIDEOS = [
  { id: "9bZkp7q19f0", title: "PSY - GANGNAM STYLE", artist: "PSY" },
  { id: "kJQP7kiw5Fk", title: "Luis Fonsi - Despacito", artist: "Luis Fonsi" },
  {
    id: "dQw4w9WgXcQ",
    title: "Rick Astley - Never Gonna Give You Up",
    artist: "Rick Astley",
  },
  {
    id: "ZZ5LpwO-An4",
    title: "Ed Sheeran - Shape of You",
    artist: "Ed Sheeran",
  },
  {
    id: "YykjpeuMNEk",
    title: "Clean Bandit - Rockabye",
    artist: "Clean Bandit",
  },
];

// Popular movie trailers as fallbacks
const FALLBACK_TRAILERS = [
  { id: "uYPbbksJxIg", title: "Parasite Official Trailer", type: "movie" },
  { id: "6aJ-cW1HlB8", title: "Inception Official Trailer", type: "movie" },
  { id: "YoHD9XEInc0", title: "Interstellar Official Trailer", type: "movie" },
  {
    id: "EXeTwQWrcwY",
    title: "The Dark Knight Official Trailer",
    type: "movie",
  },
  { id: "hA2hKAuBZqU", title: "Breaking Bad Official Trailer", type: "series" },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "Search query is required" },
      { status: 400 }
    );
  }

  try {
    console.log(`🔍 Searching YouTube for: ${query}`);

    // Use YouTube Data API v3 to search for videos
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      console.log("⚠️ No YouTube API key found, using fallback");

      // Check if this is a trailer search (contains "trailer")
      const isTrailerSearch = query.toLowerCase().includes("trailer");

      if (isTrailerSearch) {
        // Use trailer fallbacks
        const randomTrailer =
          FALLBACK_TRAILERS[
            Math.floor(Math.random() * FALLBACK_TRAILERS.length)
          ];
        return NextResponse.json({
          success: true,
          data: {
            videoId: randomTrailer.id,
            title: randomTrailer.title,
            thumbnail: "",
            isFallback: true,
          },
        });
      } else {
        // Use music fallbacks
        const randomFallback =
          FALLBACK_VIDEOS[Math.floor(Math.random() * FALLBACK_VIDEOS.length)];
        return NextResponse.json({
          success: true,
          data: {
            videoId: randomFallback.id,
            title: randomFallback.title,
            thumbnail: "",
            isFallback: true,
          },
        });
      }
    }

    // Try multiple search strategies
    const searchStrategies = [
      `${query} official audio`,
      `${query} official music video`,
      `${query} audio`,
      query, // Original query as fallback
    ];

    for (const searchQuery of searchStrategies) {
      try {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          searchQuery
        )}&type=video&videoCategoryId=10&maxResults=3&key=${apiKey}`;

        const response = await fetch(searchUrl);

        if (!response.ok) {
          console.error(
            `❌ YouTube API error for query "${searchQuery}":`,
            response.status
          );
          continue; // Try next strategy
        }

        const data = await response.json();

        if (!data.items || data.items.length === 0) {
          console.log(`❌ No videos found for query: ${searchQuery}`);
          continue; // Try next strategy
        }

        // Find the best video (prefer official audio/music videos)
        let bestVideo = data.items[0];

        for (const video of data.items) {
          const title = video.snippet.title.toLowerCase();
          if (
            title.includes("official audio") ||
            title.includes("official music video")
          ) {
            bestVideo = video;
            break;
          }
        }

        const videoId = bestVideo.id.videoId;
        const title = bestVideo.snippet.title;
        const thumbnail = bestVideo.snippet.thumbnails?.medium?.url || "";

        console.log(
          `✅ Found video: ${title} (${videoId}) using query: ${searchQuery}`
        );

        return NextResponse.json({
          success: true,
          data: {
            videoId,
            title,
            thumbnail,
            isFallback: false,
          },
        });
      } catch (error) {
        console.error(`❌ Error searching with query "${searchQuery}":`, error);
        continue; // Try next strategy
      }
    }

    // If all strategies failed, return a fallback
    console.log("❌ All search strategies failed, using fallback");

    // Check if this is a trailer search (contains "trailer")
    const isTrailerSearch = query.toLowerCase().includes("trailer");

    if (isTrailerSearch) {
      // Use trailer fallbacks
      const randomTrailer =
        FALLBACK_TRAILERS[Math.floor(Math.random() * FALLBACK_TRAILERS.length)];
      return NextResponse.json({
        success: true,
        data: {
          videoId: randomTrailer.id,
          title: randomTrailer.title,
          thumbnail: "",
          isFallback: true,
        },
      });
    } else {
      // Use music fallbacks
      const randomFallback =
        FALLBACK_VIDEOS[Math.floor(Math.random() * FALLBACK_VIDEOS.length)];
      return NextResponse.json({
        success: true,
        data: {
          videoId: randomFallback.id,
          title: randomFallback.title,
          thumbnail: "",
          isFallback: true,
        },
      });
    }
  } catch (error) {
    console.error("❌ Error searching YouTube:", error);

    // Return a fallback even on complete failure
    const isTrailerSearch = query?.toLowerCase().includes("trailer") || false;

    if (isTrailerSearch) {
      // Use trailer fallbacks
      const randomTrailer =
        FALLBACK_TRAILERS[Math.floor(Math.random() * FALLBACK_TRAILERS.length)];
      return NextResponse.json({
        success: true,
        data: {
          videoId: randomTrailer.id,
          title: randomTrailer.title,
          thumbnail: "",
          isFallback: true,
        },
      });
    } else {
      // Use music fallbacks
      const randomFallback =
        FALLBACK_VIDEOS[Math.floor(Math.random() * FALLBACK_VIDEOS.length)];
      return NextResponse.json({
        success: true,
        data: {
          videoId: randomFallback.id,
          title: randomFallback.title,
          thumbnail: "",
          isFallback: true,
        },
      });
    }
  }
}

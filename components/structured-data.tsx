"use client";

interface MovieData {
  id: number;
  title: string;
  overview?: string;
  poster_path?: string;
  release_date?: string;
  vote_average?: number;
  vote_count?: number;
}

interface BookData {
  id: string;
  volumeInfo: {
    title: string;
    description?: string;
    imageLinks?: {
      thumbnail?: string;
    };
    publishedDate?: string;
    averageRating?: number;
    ratingsCount?: number;
    authors?: string[];
  };
}

interface SeriesData {
  id: number;
  name: string;
  overview?: string;
  poster_path?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
}

interface MusicData {
  id: string;
  name: string;
  artists?: {
    primary?: Array<{ name: string }>;
  };
  image?: Array<{ url: string }>;
  year?: string;
  songCount?: number;
}

interface StructuredDataProps {
  type: 'movie' | 'book' | 'series' | 'music';
  data: MovieData | BookData | SeriesData | MusicData;
  baseUrl?: string;
}

export function StructuredData({ type, data, baseUrl = 'https://www.reliva.me' }: StructuredDataProps) {
  const generateStructuredData = () => {
    switch (type) {
      case 'movie':
        const movie = data as MovieData;
        return {
          "@context": "https://schema.org",
          "@type": "Movie",
          "name": movie.title,
          "description": movie.overview || `Watch ${movie.title} and discover more movies on Reliva`,
          "image": movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : `${baseUrl}/placeholder.jpg`,
          "datePublished": movie.release_date,
          "url": `${baseUrl}/movies/${movie.id}`,
          "aggregateRating": movie.vote_average ? {
            "@type": "AggregateRating",
            "ratingValue": movie.vote_average,
            "ratingCount": movie.vote_count || 0,
            "bestRating": 10,
            "worstRating": 0
          } : undefined,
          "publisher": {
            "@type": "Organization",
            "name": "Reliva",
            "url": baseUrl
          }
        };

      case 'book':
        const book = data as BookData;
        return {
          "@context": "https://schema.org",
          "@type": "Book",
          "name": book.volumeInfo.title,
          "description": book.volumeInfo.description || `Read ${book.volumeInfo.title} and discover more books on Reliva`,
          "image": book.volumeInfo.imageLinks?.thumbnail || `${baseUrl}/placeholder-book.jpg`,
          "datePublished": book.volumeInfo.publishedDate,
          "url": `${baseUrl}/books/${book.id}`,
          "author": book.volumeInfo.authors?.map(author => ({
            "@type": "Person",
            "name": author
          })),
          "aggregateRating": book.volumeInfo.averageRating ? {
            "@type": "AggregateRating",
            "ratingValue": book.volumeInfo.averageRating,
            "ratingCount": book.volumeInfo.ratingsCount || 0,
            "bestRating": 5,
            "worstRating": 0
          } : undefined,
          "publisher": {
            "@type": "Organization",
            "name": "Reliva",
            "url": baseUrl
          }
        };

      case 'series':
        const series = data as SeriesData;
        return {
          "@context": "https://schema.org",
          "@type": "TVSeries",
          "name": series.name,
          "description": series.overview || `Watch ${series.name} and discover more TV shows on Reliva`,
          "image": series.poster_path ? `https://image.tmdb.org/t/p/w500${series.poster_path}` : `${baseUrl}/placeholder.jpg`,
          "datePublished": series.first_air_date,
          "url": `${baseUrl}/series/${series.id}`,
          "numberOfSeasons": series.number_of_seasons,
          "numberOfEpisodes": series.number_of_episodes,
          "aggregateRating": series.vote_average ? {
            "@type": "AggregateRating",
            "ratingValue": series.vote_average,
            "ratingCount": series.vote_count || 0,
            "bestRating": 10,
            "worstRating": 0
          } : undefined,
          "publisher": {
            "@type": "Organization",
            "name": "Reliva",
            "url": baseUrl
          }
        };

      case 'music':
        const music = data as MusicData;
        return {
          "@context": "https://schema.org",
          "@type": "MusicAlbum",
          "name": music.name,
          "description": `Listen to ${music.name} and discover more music on Reliva`,
          "image": music.image?.[2]?.url || music.image?.[1]?.url || music.image?.[0]?.url || `${baseUrl}/placeholder.jpg`,
          "datePublished": music.year,
          "url": `${baseUrl}/music/album/${music.id}`,
          "byArtist": music.artists?.primary?.map(artist => ({
            "@type": "MusicGroup",
            "name": artist.name
          })),
          "numTracks": music.songCount,
          "publisher": {
            "@type": "Organization",
            "name": "Reliva",
            "url": baseUrl
          }
        };

      default:
        return null;
    }
  };

  const structuredData = generateStructuredData();
  
  if (!structuredData) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData)
      }}
    />
  );
}

// Helper function to generate user profile structured data
export function UserProfileStructuredData({ 
  username, 
  displayName, 
  bio, 
  userId, 
  baseUrl = 'https://www.reliva.me' 
}: {
  username: string;
  displayName: string;
  bio?: string;
  userId: string;
  baseUrl?: string;
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "name": `${displayName} - Reliva Profile`,
    "description": bio || `View ${displayName}'s profile on Reliva to see their favorite music, movies, books, and TV shows`,
    "url": `${baseUrl}/users/${userId}`,
    "mainEntity": {
      "@type": "Person",
      "name": displayName,
      "alternateName": username,
      "description": bio,
      "url": `${baseUrl}/users/${userId}`
    },
    "publisher": {
      "@type": "Organization",
      "name": "Reliva",
      "url": baseUrl,
      "sameAs": [
        "https://www.instagram.com/relivaofficial",
        "https://x.com/relivaofficial",
        "https://www.reddit.com/r/relivaofficial"
      ],
      "email": "reliva211@gmail.com"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData)
      }}
    />
  );
}

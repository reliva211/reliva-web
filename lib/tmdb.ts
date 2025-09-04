// tmdb.ts
// Using proxy to avoid ISP blocking issues (e.g., Jio users)
import { getTMDBUrl, getTMDBImageUrl } from './tmdb-config';

export async function getTrendingSeries(limit: number = 20) {
  const res = await fetch(
    getTMDBUrl(`trending/tv/week?limit=${limit}`)
  );
  const data = await res.json();

  return data.results.map((series: any) => ({
    id: series.id,
    title: series.name,
    year: parseInt(series.first_air_date?.split("-")[0] || "0000", 10),
    cover: series.poster_path
      ? `https://image.tmdb.org/t/p/w300${series.poster_path}`
      : "/placeholder.svg?height=300&width=200",
    rating: series.vote_average ?? 0,
    overview: series.overview || "",
    first_air_date: series.first_air_date || "",
    number_of_seasons: series.number_of_seasons || 1,
    number_of_episodes: series.number_of_episodes || 1,
    vote_count: series.vote_count || 0,
    genre_ids: series.genre_ids || [],
    popularity: series.popularity || 0,
  }));
}

export async function getTrendingMovies(limit: number = 20) {
  const res = await fetch(
    getTMDBUrl(`trending/movie/week?limit=${limit}`)
  );
  const data = await res.json();

  return data.results.map((movie: any) => ({
    id: movie.id,
    title: movie.title,
    year: parseInt(movie.release_date?.split("-")[0] || "0000", 10),
    cover: movie.poster_path
      ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
      : "/placeholder.svg?height=300&width=200",
    rating: movie.vote_average ?? 0,
    overview: movie.overview || "",
    release_date: movie.release_date || "",
    vote_count: movie.vote_count || 0,
    genre_ids: movie.genre_ids || [],
    popularity: movie.popularity || 0,
  }));
}

export async function searchMovies(
  query: string,
  page: number = 1,
  limit: number = 20
) {
  const res = await fetch(
    getTMDBUrl(`search/movie?query=${encodeURIComponent(query)}&page=${page}&sort_by=popularity.desc&include_adult=false`)
  );
  const data = await res.json();

  return data.results.map((movie: any) => ({
    id: movie.id,
    title: movie.title,
    director: "Unknown", // Placeholder (TMDb needs another call to get director)
    year: parseInt(movie.release_date?.split("-")[0] || "0000", 10),
    cover: movie.poster_path
      ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
      : "/placeholder.svg?height=300&width=200",
    rating: movie.vote_average ?? 0,
    overview: movie.overview || "",
    release_date: movie.release_date || "",
    vote_count: movie.vote_count || 0,
    genre_ids: movie.genre_ids || [],
    popularity: movie.popularity || 0,
  }));
}

export async function searchSeries(
  query: string,
  page: number = 1,
  limit: number = 20
) {
    const res = await fetch(
      getTMDBUrl(`search/tv?query=${encodeURIComponent(query)}&page=${page}&sort_by=popularity.desc&include_adult=false`)
  );
  const data = await res.json();

  return data.results.map((series: any) => ({
    id: series.id,
    title: series.name,
    year: parseInt(series.first_air_date?.split("-")[0] || "0000", 10),
    cover: series.poster_path
      ? `https://image.tmdb.org/t/p/w300${series.poster_path}`
      : "/placeholder.svg?height=300&width=200",
    rating: series.vote_average ?? 0,
    overview: series.overview || "",
    first_air_date: series.first_air_date || "",
    number_of_seasons: series.number_of_seasons || 1,
    number_of_episodes: series.number_of_episodes || 1,
    vote_count: series.vote_count || 0,
    genre_ids: series.genre_ids || [],
    popularity: series.popularity || 0,
  }));
}

// Get movie details by ID with comprehensive data
export async function getMovieDetails(movieId: string | number) {
  const res = await fetch(
    getTMDBUrl(`movie/${movieId}?append_to_response=credits,videos,images,similar,recommendations`)
  );
  const data = await res.json();

  return {
    id: data.id,
    title: data.title,
    overview: data.overview || "",
    release_date: data.release_date || "",
    runtime: data.runtime || 0,
    status: data.status || "",
    tagline: data.tagline || "",
    genres: data.genres || [],
    production_companies: data.production_companies || [],
    vote_average: data.vote_average || 0,
    vote_count: data.vote_count || 0,
    popularity: data.popularity || 0,
    budget: data.budget || 0,
    revenue: data.revenue || 0,
    poster_path: data.poster_path
      ? `https://image.tmdb.org/t/p/original${data.poster_path}`
      : null,
    backdrop_path: data.backdrop_path
      ? `https://image.tmdb.org/t/p/original${data.backdrop_path}`
      : null,
    credits: data.credits || {},
    videos: data.videos || {},
    images: data.images || {},
    similar: data.similar?.results || [],
    recommendations: data.recommendations?.results || [],
  };
}

// Get series details by ID with comprehensive data
export async function getSeriesDetails(seriesId: string | number) {
  const res = await fetch(
    getTMDBUrl(`tv/${seriesId}?append_to_response=credits,videos,images,similar,recommendations`)
  );
  const data = await res.json();

  return {
    id: data.id,
    name: data.name,
    overview: data.overview || "",
    first_air_date: data.first_air_date || "",
    last_air_date: data.last_air_date || "",
    number_of_seasons: data.number_of_seasons || 0,
    number_of_episodes: data.number_of_episodes || 0,
    status: data.status || "",
    type: data.type || "",
    genres: data.genres || [],
    production_companies: data.production_companies || [],
    vote_average: data.vote_average || 0,
    vote_count: data.vote_count || 0,
    popularity: data.popularity || 0,
    poster_path: data.poster_path
      ? `https://image.tmdb.org/t/p/original${data.poster_path}`
      : null,
    backdrop_path: data.backdrop_path
      ? `https://image.tmdb.org/t/p/original${data.backdrop_path}`
      : null,
    credits: data.credits || {},
    videos: data.videos || {},
    images: data.images || {},
    similar: data.similar?.results || [],
    recommendations: data.recommendations?.results || [],
  };
}

// Get popular movies with pagination
export async function getPopularMovies(page: number = 1, limit: number = 20) {
  const res = await fetch(
    getTMDBUrl(`movie/popular?page=${page}&language=en-US`)
  );
  const data = await res.json();

  return data.results.map((movie: any) => ({
    id: movie.id,
    title: movie.title,
    year: parseInt(movie.release_date?.split("-")[0] || "0000", 10),
    cover: movie.poster_path
      ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
      : "/placeholder.svg?height=300&width=200",
    rating: movie.vote_average ?? 0,
    overview: movie.overview || "",
    release_date: movie.release_date || "",
    vote_count: movie.vote_count || 0,
    genre_ids: movie.genre_ids || [],
    popularity: movie.popularity || 0,
  }));
}

// Get popular series with pagination
export async function getPopularSeries(page: number = 1, limit: number = 20) {
  const res = await fetch(
    getTMDBUrl(`tv/popular?page=${page}&language=en-US`)
  );
  const data = await res.json();

  return data.results.map((series: any) => ({
    id: series.id,
    title: series.name,
    year: parseInt(series.first_air_date?.split("-")[0] || "0000", 10),
    cover: series.poster_path
      ? `https://image.tmdb.org/t/p/w300${series.poster_path}`
      : "/placeholder.svg?height=300&width=200",
    rating: series.vote_average ?? 0,
    overview: series.overview || "",
    first_air_date: series.first_air_date || "",
    number_of_seasons: series.number_of_seasons || 1,
    number_of_episodes: series.number_of_episodes || 1,
    vote_count: series.vote_count || 0,
    genre_ids: series.genre_ids || [],
    popularity: series.popularity || 0,
  }));
}

// Get movies by genre with pagination
export async function getMoviesByGenre(genreId: number, page: number = 1) {
  const res = await fetch(
    getTMDBUrl(`discover/movie?with_genres=${genreId}&page=${page}&sort_by=popularity.desc&include_adult=false`)
  );
  const data = await res.json();

  return data.results.map((movie: any) => ({
    id: movie.id,
    title: movie.title,
    year: parseInt(movie.release_date?.split("-")[0] || "0000", 10),
    cover: movie.poster_path
      ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
      : "/placeholder.svg?height=300&width=200",
    rating: movie.vote_average ?? 0,
    overview: movie.overview || "",
    release_date: movie.release_date || "",
    vote_count: movie.vote_count || 0,
    genre_ids: movie.genre_ids || [],
    popularity: movie.popularity || 0,
  }));
}

// Get series by genre with pagination
export async function getSeriesByGenre(genreId: number, page: number = 1) {
  const res = await fetch(
    getTMDBUrl(`discover/tv?with_genres=${genreId}&page=${page}&sort_by=popularity.desc&include_adult=false`)
  );
  const data = await res.json();

  return data.results.map((series: any) => ({
    id: series.id,
    title: series.name,
    year: parseInt(series.first_air_date?.split("-")[0] || "0000", 10),
    cover: series.poster_path
      ? `https://image.tmdb.org/t/p/w300${series.poster_path}`
      : "/placeholder.svg?height=300&width=200",
    rating: series.vote_average ?? 0,
    overview: series.overview || "",
    first_air_date: series.first_air_date || "",
    number_of_seasons: series.number_of_seasons || 1,
    number_of_episodes: series.number_of_episodes || 1,
    vote_count: series.vote_count || 0,
    genre_ids: series.genre_ids || [],
    popularity: series.popularity || 0,
  }));
}

// Get top rated movies
export async function getTopRatedMovies(page: number = 1) {
  const res = await fetch(
    getTMDBUrl(`movie/top_rated?page=${page}&language=en-US`)
  );
  const data = await res.json();

  return data.results.map((movie: any) => ({
    id: movie.id,
    title: movie.title,
    year: parseInt(movie.release_date?.split("-")[0] || "0000", 10),
    cover: movie.poster_path
      ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
      : "/placeholder.svg?height=300&width=200",
    rating: movie.vote_average ?? 0,
    overview: movie.overview || "",
    release_date: movie.release_date || "",
    vote_count: movie.vote_count || 0,
    genre_ids: movie.genre_ids || [],
    popularity: movie.popularity || 0,
  }));
}

// Get top rated series
export async function getTopRatedSeries(page: number = 1) {
  const res = await fetch(
    getTMDBUrl(`tv/top_rated?page=${page}&language=en-US`)
  );
  const data = await res.json();

  return data.results.map((series: any) => ({
    id: series.id,
    title: series.name,
    year: parseInt(series.first_air_date?.split("-")[0] || "0000", 10),
    cover: series.poster_path
      ? `https://image.tmdb.org/t/p/w300${series.poster_path}`
      : "/placeholder.svg?height=300&width=200",
    rating: series.vote_average ?? 0,
    overview: series.overview || "",
    first_air_date: series.first_air_date || "",
    number_of_seasons: series.number_of_seasons || 1,
    number_of_episodes: series.number_of_episodes || 1,
    vote_count: series.vote_count || 0,
    genre_ids: series.genre_ids || [],
    popularity: series.popularity || 0,
  }));
}

// Get upcoming movies
export async function getUpcomingMovies(page: number = 1) {
  const res = await fetch(
    getTMDBUrl(`movie/upcoming?page=${page}&language=en-US`)
  );
  const data = await res.json();

  return data.results.map((movie: any) => ({
    id: movie.id,
    title: movie.title,
    year: parseInt(movie.release_date?.split("-")[0] || "0000", 10),
    cover: movie.poster_path
      ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
      : "/placeholder.svg?height=300&width=200",
    rating: movie.vote_average ?? 0,
    overview: movie.overview || "",
    release_date: movie.release_date || "",
    vote_count: movie.vote_count || 0,
    genre_ids: movie.genre_ids || [],
    popularity: movie.popularity || 0,
  }));
}

// Get now playing movies
export async function getNowPlayingMovies(page: number = 1) {
  const res = await fetch(
    getTMDBUrl(`movie/now_playing?page=${page}&language=en-US`)
    );
    const data = await res.json();

  return data.results.map((movie: any) => ({
    id: movie.id,
    title: movie.title,
    year: parseInt(movie.release_date?.split("-")[0] || "0000", 10),
    cover: movie.poster_path
      ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
      : "/placeholder.svg?height=300&width=200",
    rating: movie.vote_average ?? 0,
    overview: movie.overview || "",
    release_date: movie.release_date || "",
    vote_count: movie.vote_count || 0,
    genre_ids: movie.genre_ids || [],
    popularity: movie.popularity || 0,
  }));
}

// Get airing today series
export async function getAiringTodaySeries(page: number = 1) {
  const res = await fetch(
    getTMDBUrl(`tv/airing_today?page=${page}&language=en-US`)
  );
  const data = await res.json();

  return data.results.map((series: any) => ({
    id: series.id,
    title: series.name,
    year: parseInt(series.first_air_date?.split("-")[0] || "0000", 10),
    cover: series.poster_path
      ? `https://image.tmdb.org/t/p/w300${series.poster_path}`
      : "/placeholder.svg?height=300&width=200",
    rating: series.vote_average ?? 0,
    overview: series.overview || "",
    first_air_date: series.first_air_date || "",
    number_of_seasons: series.number_of_seasons || 1,
    number_of_episodes: series.number_of_episodes || 1,
    vote_count: series.vote_count || 0,
    genre_ids: series.genre_ids || [],
    popularity: series.popularity || 0,
  }));
}

// Get on the air series
export async function getOnTheAirSeries(page: number = 1) {
  const res = await fetch(
    getTMDBUrl(`tv/on_the_air?page=${page}&language=en-US`)
  );
  const data = await res.json();

  return data.results.map((series: any) => ({
    id: series.id,
    title: series.name,
    year: parseInt(series.first_air_date?.split("-")[0] || "0000", 10),
    cover: series.poster_path
      ? `https://image.tmdb.org/t/p/w300${series.poster_path}`
      : "/placeholder.svg?height=300&width=200",
    rating: series.vote_average ?? 0,
    overview: series.overview || "",
    first_air_date: series.first_air_date || "",
    number_of_seasons: series.number_of_seasons || 1,
    number_of_episodes: series.number_of_episodes || 1,
    vote_count: series.vote_count || 0,
    genre_ids: series.genre_ids || [],
    popularity: series.popularity || 0,
  }));
}

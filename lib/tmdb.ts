// tmdb.ts
const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || "";

export async function getTrendingSeries() {
  const res = await fetch(
    `https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_API_KEY}`
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
  }));
}

export async function getTrendingMovies() {
  const res = await fetch(
    `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}`
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
  }));
}

export async function searchMovies(query: string) {
  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
      query
    )}`
  );
  const data = await res.json();

  //   console.log("TMDB search response:", data);

  return data.results.map((movie: any) => ({
    id: movie.id,
    title: movie.title,
    director: "Unknown", // Placeholder (TMDb needs another call to get director)
    year: parseInt(movie.release_date?.split("-")[0] || "0000", 10),
    cover: movie.poster_path
      ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
      : "/placeholder.svg?height=300&width=200",
    rating: movie.vote_average ?? 0,
  }));
}

export async function searchSeries(query: string) {
  const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || "";
  let allResults: any[] = [];
  let totalPages = 1;
  let page = 1;
  // Fetch up to 3 pages for broader results
  while (page <= 3 && page <= totalPages) {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
        query
      )}&page=${page}`
    );
    const data = await res.json();
    if (page === 1 && data.total_pages) {
      totalPages = data.total_pages;
    }
    allResults = allResults.concat(data.results || []);
    page++;
  }
  return allResults.map((series: any) => ({
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
  }));
}

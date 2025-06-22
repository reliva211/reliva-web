// tmdb.ts
const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || "";

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
  const res = await fetch(
    `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
      query
    )}`
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
  }));
}

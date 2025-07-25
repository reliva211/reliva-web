import Image from "next/image";

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

async function fetchMovie(id: string) {
  if (!TMDB_API_KEY) {
    console.error("NEXT_PUBLIC_TMDB_API_KEY is missing");
    return null;
  }
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos`
    );
    if (!res.ok) {
      console.error("TMDB fetch failed", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    // Parse genres
    const genres = (data.genres || []).map((g: any) => g.name);
    // Parse crew
    const crew = (data.credits?.crew || [])
      .filter((c: any) => ["Director", "Writer", "Screenplay"].includes(c.job))
      .map((c: any) => ({ name: c.name, role: c.job }));
    // Parse cast
    const cast = (data.credits?.cast || []).slice(0, 10).map((actor: any) => ({
      id: actor.id,
      name: actor.name,
      character: actor.character,
      profileUrl: actor.profile_path
        ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
        : "/placeholder-user.jpg",
    }));
    // Find trailer
    const trailer = (data.videos?.results || []).find(
      (v: any) => v.type === "Trailer" && v.site === "YouTube"
    );
    return {
      id: data.id,
      title: data.title,
      year: data.release_date ? Number(data.release_date.slice(0, 4)) : "",
      genres,
      duration: data.runtime,
      ageRating: data.adult ? "A" : "U/A 13+",
      releaseDate: data.release_date,
      userScore: data.vote_average
        ? Math.round(data.vote_average * 10) / 10
        : null,
      tagline: data.tagline,
      overview: data.overview,
      posterUrl: data.poster_path
        ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
        : "/placeholder.jpg",
      backdropUrl: data.backdrop_path
        ? `https://image.tmdb.org/t/p/original${data.backdrop_path}`
        : undefined,
      trailerUrl: trailer
        ? `https://www.youtube.com/watch?v=${trailer.key}`
        : undefined,
      crew,
      cast,
      status: data.status,
      language: data.original_language,
      budget: data.budget,
      revenue: data.revenue,
      mainActorBackdrop: data.backdrop_path
        ? `https://image.tmdb.org/t/p/original${data.backdrop_path}`
        : undefined,
    };
  } catch (err) {
    console.error("Error fetching movie:", err);
    return null;
  }
}

export default async function MovieDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  console.log("NEXT_PUBLIC_TMDB_API_KEY:", TMDB_API_KEY);
  let movie = null;
  let error = null;
  try {
    movie = await fetchMovie(id);
  } catch (e) {
    error = e;
  }

  if (!TMDB_API_KEY) {
    return (
      <div className="p-8 text-center text-red-500">
        NEXT_PUBLIC_TMDB_API_KEY is missing.
        <br />
        Set it in your <code>.env.local</code> file as{" "}
        <code>NEXT_PUBLIC_TMDB_API_KEY=your_actual_tmdb_api_key_here</code> and
        restart your dev server.
        <br />
        See{" "}
        <a
          href="https://developer.themoviedb.org/reference/intro/getting-started"
          target="_blank"
          className="underline"
        >
          TMDB docs
        </a>
        .
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Error loading movie: {String(error)}
      </div>
    );
  }
  if (!movie) {
    return (
      <div className="p-8 text-center text-yellow-400">
        Movie not found or TMDB API error.
        <br />
        Movie ID: <b>{id}</b>
        <br />
        Check your NEXT_PUBLIC_TMDB_API_KEY and network.
        <br />
        See{" "}
        <a
          href="https://developer.themoviedb.org/reference/intro/getting-started"
          target="_blank"
          className="underline"
        >
          TMDB docs
        </a>
        .
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#18181b] text-white">
      {/* Top Section with background and overlay */}
      <div className="relative w-full min-h-[420px] flex flex-col md:flex-row items-center md:items-stretch justify-center overflow-hidden">
        {/* Blurred/gradient background with main actor image */}
        <div className="absolute inset-0 -z-10">
          {movie.mainActorBackdrop && (
            <Image
              src={movie.mainActorBackdrop}
              alt="Backdrop"
              fill
              className="object-cover object-right opacity-60 blur-sm"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#18181b] via-[#18181b]/80 to-transparent" />
        </div>
        {/* Poster */}
        <div className="flex-shrink-0 flex justify-center items-center w-full md:w-auto pt-8 md:pt-0 md:pl-12">
          <Image
            src={movie.posterUrl}
            alt={movie.title}
            width={240}
            height={360}
            className="rounded-xl shadow-2xl border-4 border-[#23272f] bg-[#23272f]"
          />
        </div>
        {/* Main Info */}
        <div className="flex-1 flex flex-col justify-center px-6 py-8 md:py-0 md:pl-12 max-w-2xl">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="text-3xl font-bold mr-2">{movie.title}</span>
            <span className="text-xl text-gray-300">{movie.year}</span>
            <span className="bg-gray-700 text-white px-2 py-1 rounded text-xs font-semibold ml-2">
              {movie.ageRating}
            </span>
            <span className="text-gray-400 text-sm ml-2">
              {movie.releaseDate}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {movie.genres.map((genre: string) => (
              <span
                key={genre}
                className="bg-[#333] px-3 py-1 rounded-full text-sm font-semibold"
              >
                {genre}
              </span>
            ))}
            <span className="text-gray-400 text-sm ml-2">
              {movie.duration} min
            </span>
          </div>
          <div className="flex items-center gap-4 mb-4">
            {movie.userScore && (
              <span className="bg-[#1a2e1a] text-emerald-400 font-bold px-4 py-2 rounded-full text-lg flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-emerald-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <polygon points="9.9,1.1 7.6,6.6 1.6,7.6 6,11.9 4.9,17.9 9.9,15.1 14.9,17.9 13.8,11.9 18.2,7.6 12.2,6.6 " />
                </svg>
                {movie.userScore} User Score
              </span>
            )}
            <button className="bg-[#23272f] text-white px-4 py-2 rounded-full font-semibold shadow hover:bg-[#2e3440] transition">
              What's your Vibe?
            </button>
            {movie.trailerUrl && (
              <a
                href={movie.trailerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#23272f] text-white px-4 py-2 rounded-full font-semibold shadow hover:bg-[#2e3440] transition flex items-center gap-2"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <polygon points="5,3 19,10 5,17" />
                </svg>
                Play Trailer
              </a>
            )}
          </div>
          {movie.tagline && (
            <div className="italic text-lg text-gray-300 mb-2">
              {movie.tagline}
            </div>
          )}
        </div>
      </div>
      {/* Overview Section */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="font-bold text-2xl mb-2">Overview</h2>
        <p className="mb-4 text-gray-200 text-lg">{movie.overview}</p>
        <div className="flex flex-wrap gap-8 mb-6">
          {movie.crew.map((person: { name: string; role: string }) => (
            <div key={person.name}>
              <div className="font-bold text-white">{person.name}</div>
              <div className="text-sm text-gray-400">{person.role}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Cast Section */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h3 className="text-2xl font-bold mb-4">Top Billed Cast</h3>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {movie.cast.map(
            (actor: {
              id: number;
              name: string;
              character: string;
              profileUrl: string;
            }) => (
              <div
                key={actor.id}
                className="w-32 flex-shrink-0 bg-[#23272f] rounded-lg p-2 shadow"
              >
                <Image
                  src={actor.profileUrl}
                  alt={actor.name}
                  width={96}
                  height={128}
                  className="rounded mb-2 object-cover"
                />
                <div className="font-bold text-white text-sm truncate">
                  {actor.name}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  {actor.character}
                </div>
              </div>
            )
          )}
        </div>
      </div>
      {/* Info Block */}
      <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div>
          <div className="mb-2">
            <span className="font-bold">Status:</span> {movie.status}
          </div>
          <div className="mb-2">
            <span className="font-bold">Language:</span> {movie.language}
          </div>
          <div className="mb-2">
            <span className="font-bold">Budget:</span> $
            {movie.budget.toLocaleString()}
          </div>
          <div className="mb-2">
            <span className="font-bold">Revenue:</span> $
            {movie.revenue.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

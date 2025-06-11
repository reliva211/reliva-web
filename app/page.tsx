import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Music, BookOpen, Film, MessageCircle } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section with Vector Lines */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-black text-white relative overflow-hidden">
          {/* Vector Lines Background */}
          <div className="absolute inset-0 z-0 opacity-20">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 1000 1000"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="1" />
                </linearGradient>
              </defs>
              {/* Horizontal Lines */}
              {Array.from({ length: 20 }).map((_, i) => (
                <line key={`h-${i}`} x1="0" y1={i * 50} x2="1000" y2={i * 50} stroke="url(#grad1)" strokeWidth="1" />
              ))}
              {/* Vertical Lines */}
              {Array.from({ length: 20 }).map((_, i) => (
                <line key={`v-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="1000" stroke="url(#grad1)" strokeWidth="1" />
              ))}
              {/* Diagonal Lines */}
              {Array.from({ length: 10 }).map((_, i) => (
                <line key={`d1-${i}`} x1="0" y1={i * 100} x2={i * 100} y2="0" stroke="url(#grad1)" strokeWidth="1" />
              ))}
              {Array.from({ length: 10 }).map((_, i) => (
                <line
                  key={`d2-${i}`}
                  x1={i * 100}
                  y1="1000"
                  x2="1000"
                  y2={i * 100}
                  stroke="url(#grad1)"
                  strokeWidth="1"
                />
              ))}
            </svg>
          </div>

          <div className="container px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Tunes and Habits
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
                  Track your music, books, and movies all in one place. Discover new content and keep a record of your
                  favorites.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/login">
                  <Button variant="outline" className="bg-white text-black hover:bg-gray-200">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-emerald-600 hover:bg-emerald-700">Sign Up</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">All Your Media in One Place</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Tunes and Habits helps you organize your entertainment life with powerful modules.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-12 lg:grid-cols-4">
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                <div className="rounded-full bg-emerald-100 p-4">
                  <Music className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold">Music</h3>
                <p className="text-gray-500 text-center">
                  Listen to your favorite tunes with our Spotify-inspired music player. Create playlists and discover
                  new artists.
                </p>
                <Link href="/music" className="inline-flex items-center text-emerald-600 hover:underline">
                  Explore Music <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                <div className="rounded-full bg-emerald-100 p-4">
                  <BookOpen className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold">Books</h3>
                <p className="text-gray-500 text-center">
                  Search for books, save your favorites, and keep track of what you've read and what's on your reading
                  list.
                </p>
                <Link href="/books" className="inline-flex items-center text-emerald-600 hover:underline">
                  Explore Books <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                <div className="rounded-full bg-emerald-100 p-4">
                  <Film className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold">Movies</h3>
                <p className="text-gray-500 text-center">
                  Track the movies you've watched, rate them, and build your watchlist for movie nights.
                </p>
                <Link href="/movies" className="inline-flex items-center text-emerald-600 hover:underline">
                  Explore Movies <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                <div className="rounded-full bg-emerald-100 p-4">
                  <MessageCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold">Community</h3>
                <p className="text-gray-500 text-center">
                  Connect with like-minded people, share recommendations, and discuss your favorite media.
                </p>
                <Link href="/community" className="inline-flex items-center text-emerald-600 hover:underline">
                  Join Community <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-900">
  <div className="container px-4 md:px-6">
    <div className="flex flex-col items-center justify-center space-y-4 text-center">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-black dark:text-white">
          Ready to Get Started?
        </h2>
        <p className="max-w-[600px] text-gray-600 dark:text-gray-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
          Join thousands of users who are already tracking their entertainment habits.
        </p>
      </div>
      <div className="space-x-4">
        <Link href="/signup">
          <Button className="bg-emerald-600 hover:bg-emerald-700">Sign Up Now</Button>
        </Link>
      </div>
    </div>
  </div>
</section>

      </main>
    </div>
  )
}

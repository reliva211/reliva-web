import Link from "next/link"
import { Music, BookOpen, Film } from "lucide-react"

export default function Footer() {
  return (
    <footer className="w-full border-t py-6 md:py-8">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
        <div className="flex flex-col items-center md:items-start gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold">Tunes & Habits</span>
          </Link>
          <p className="text-sm text-muted-foreground text-center md:text-left">
            &copy; {new Date().getFullYear()} Tunes and Habits. All rights reserved.
          </p>
        </div>
        <nav className="flex gap-4 md:gap-6">
          <Link href="/music" className="flex items-center text-sm text-muted-foreground hover:text-primary">
            <Music className="mr-1 h-4 w-4" />
            Music
          </Link>
          <Link href="/books" className="flex items-center text-sm text-muted-foreground hover:text-primary">
            <BookOpen className="mr-1 h-4 w-4" />
            Books
          </Link>
          <Link href="/movies" className="flex items-center text-sm text-muted-foreground hover:text-primary">
            <Film className="mr-1 h-4 w-4" />
            Movies
          </Link>
        </nav>
      </div>
    </footer>
  )
}

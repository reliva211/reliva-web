import Link from "next/link";
import { Music, BookOpen, Film, Tv, Users } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t py-6 md:py-8">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
        <div className="flex flex-col items-center md:items-start gap-2">
          <Link href="/reviews" className="flex items-center space-x-2">
            <span className="font-bold">Reliva</span>
          </Link>
          <p className="text-sm text-muted-foreground text-center md:text-left">
            &copy; {new Date().getFullYear()} Reliva. All rights reserved.
          </p>
        </div>
        <nav className="flex gap-4 md:gap-6 items-center">
          <Link
            href="/music"
            className="flex items-center text-sm text-muted-foreground hover:text-primary"
          >
            <Music className="mr-1 h-4 w-4" />
            Music
          </Link>
          <Link
            href="/books"
            className="flex items-center text-sm text-muted-foreground hover:text-primary"
          >
            <BookOpen className="mr-1 h-4 w-4" />
            Books
          </Link>
          <Link
            href="/movies"
            className="flex items-center text-sm text-muted-foreground hover:text-primary"
          >
            <Film className="mr-1 h-4 w-4" />
            Movies
          </Link>
          <Link
            href="/series"
            className="flex items-center text-sm text-muted-foreground hover:text-primary"
          >
            <Tv className="mr-1 h-4 w-4" />
            Series
          </Link>
          <Link
            href="/community"
            className="flex items-center text-sm text-muted-foreground hover:text-primary"
          >
            <Users className="mr-1 h-4 w-4" />
            Community
          </Link>
          <Link
            href="/contact"
            className="flex items-center text-sm text-muted-foreground hover:text-primary border border-muted-foreground rounded px-2 py-1 ml-2"
          >
            Contact Us
          </Link>
        </nav>
      </div>
    </footer>
  );
}

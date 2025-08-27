import Link from "next/link";

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
      </div>
    </footer>
  );
}

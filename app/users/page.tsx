// app/users/page.tsx

import { Metadata } from "next"
import UserSearch from "@/components/user-search"

export const metadata: Metadata = {
  title: "Find Users | Reliva",
  description: "Discover and connect with other Reliva users who share your interests in movies, books, series, and music.",
}

export default function UsersPage() {
  return (
    <div className="min-h-screen bg-background">
      <UserSearch />
    </div>
  )
}
// app/users/[username]/page.tsx

import { Metadata } from "next"
import { notFound } from "next/navigation"
import PublicUserProfile from "@/components/public-user-profile"
import { UserService } from "@/lib/user-service"

interface UserProfilePageProps {
  params: {
    username: string
  }
}

// Generate metadata dynamically
export async function generateMetadata({ params }: UserProfilePageProps): Promise<Metadata> {
  try {
    // In a real implementation, you'd search for user by username
    // For now, we'll use a placeholder
    const username = decodeURIComponent(params.username)
    
    return {
      title: `@${username} | Reliva`,
      description: `View ${username}'s profile on Reliva - their favorite movies, books, series, and music.`,
    }
  } catch {
    return {
      title: "User Profile | Reliva",
      description: "View user profile on Reliva",
    }
  }
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const username = decodeURIComponent(params.username)
  
  // In a real implementation, you would:
  // 1. Search for user by username in userProfiles collection
  // 2. Get their userId
  // 3. Fetch their public profile
  
  // For now, we'll pass the username to the component
  // and let it handle the user lookup
  
  return (
    <div className="min-h-screen bg-background">
      <PublicUserProfile username={username} />
    </div>
  )
}
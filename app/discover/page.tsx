// app/discover/page.tsx

import { Metadata } from "next"
import UserRecommendations from "@/components/user-recommendations"
import { CompactUserRecommendations } from "@/components/user-recommendations"
import UserSearch from "@/components/user-search"

export const metadata: Metadata = {
  title: "Discover Users | Reliva",
  description: "Discover new users, get personalized recommendations, and expand your network on Reliva.",
}

export default function DiscoverPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Discover</h1>
          <p className="text-muted-foreground">
            Find new users to follow and expand your network based on shared interests
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* User Recommendations */}
            <UserRecommendations 
              userId="current-user" 
              title="Recommended for you"
              maxRecommendations={6}
            />

            {/* Search Section */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Search Users</h2>
              <UserSearch />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Recommendations */}
            <CompactUserRecommendations userId="current-user" />

            {/* Featured Users Card */}
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg p-6">
              <h3 className="font-semibold mb-2">Featured Users</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Discover verified creators and popular community members
              </p>
              <button className="text-primary hover:underline text-sm">
                View featured users →
              </button>
            </div>

            {/* Tips Card */}
            <div className="bg-muted/50 rounded-lg p-6">
              <h3 className="font-semibold mb-2">Discovery Tips</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Follow users with similar interests</li>
                <li>• Check out who your friends follow</li>
                <li>• Use search filters to find specific interests</li>
                <li>• Engage with posts to get better recommendations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
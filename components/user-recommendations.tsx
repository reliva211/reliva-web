// components/user-recommendations.tsx

"use client"

import { useState } from "react"
import { Users, UserPlus, UserCheck, Clock, X, Sparkles, Star, MapPin, Heart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useUserRecommendations, useFollowUser, useFollowStatus } from "@/hooks/use-user"
import { useCurrentUser } from "@/hooks/use-current-user"
import { UserRecommendation } from "@/types/user"

interface RecommendationCardProps {
  recommendation: UserRecommendation
  onDismiss: (id: string) => void
}

function RecommendationCard({ recommendation, onDismiss }: RecommendationCardProps) {
  const { user: currentUser } = useCurrentUser()
  const { followUser, loading: followLoading } = useFollowUser()
  const { isFollowing, isPending, loading: statusLoading } = useFollowStatus(
    currentUser?.uid, 
    recommendation.recommendedUserId
  )

  const handleFollow = async () => {
    if (!currentUser?.uid) return
    
    try {
      await followUser(currentUser.uid, recommendation.recommendedUserId)
    } catch (err) {
      console.error("Follow action failed:", err)
    }
  }

  const getReasonIcon = (reason: UserRecommendation['reason']) => {
    switch (reason) {
      case 'similar_interests':
        return <Heart className="h-4 w-4" />
      case 'mutual_followers':
        return <Users className="h-4 w-4" />
      case 'location':
        return <MapPin className="h-4 w-4" />
      case 'featured':
        return <Star className="h-4 w-4" />
      case 'new_user':
        return <Sparkles className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getReasonText = (reason: UserRecommendation['reason']) => {
    switch (reason) {
      case 'similar_interests':
        return `${recommendation.recommendedUser.commonInterests.length} shared interests`
      case 'mutual_followers':
        return `${recommendation.recommendedUser.mutualFollowers} mutual followers`
      case 'location':
        return 'In your area'
      case 'featured':
        return 'Featured user'
      case 'new_user':
        return 'New to Reliva'
      default:
        return 'Suggested for you'
    }
  }

  const getFollowButtonText = () => {
    if (isPending) return "Pending"
    if (isFollowing) return "Following"
    return "Follow"
  }

  const getFollowButtonIcon = () => {
    if (isPending) return <Clock className="h-4 w-4" />
    if (isFollowing) return <UserCheck className="h-4 w-4" />
    return <UserPlus className="h-4 w-4" />
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Dismiss Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 absolute top-2 right-2 opacity-60 hover:opacity-100"
            onClick={() => onDismiss(recommendation.id)}
          >
            <X className="h-3 w-3" />
          </Button>

          {/* Avatar */}
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage 
              src={recommendation.recommendedUser.avatarUrl} 
              alt={recommendation.recommendedUser.displayName} 
            />
            <AvatarFallback>
              {recommendation.recommendedUser.displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium truncate">
                {recommendation.recommendedUser.displayName}
              </h3>
              {recommendation.recommendedUser.isVerified && (
                <Badge variant="secondary" className="text-xs">
                  Verified
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">
              @{recommendation.recommendedUser.username}
            </p>
            
            {recommendation.recommendedUser.bio && (
              <p className="text-sm mb-3 line-clamp-2">
                {recommendation.recommendedUser.bio}
              </p>
            )}

            {/* Recommendation Reason */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
              {getReasonIcon(recommendation.reason)}
              <span>{getReasonText(recommendation.reason)}</span>
            </div>

            {/* Common Interests */}
            {recommendation.recommendedUser.commonInterests.length > 0 && (
              <div className="flex gap-1 mb-3 flex-wrap">
                {recommendation.recommendedUser.commonInterests.slice(0, 3).map((interest) => (
                  <Badge key={interest} variant="outline" className="text-xs">
                    {interest}
                  </Badge>
                ))}
                {recommendation.recommendedUser.commonInterests.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{recommendation.recommendedUser.commonInterests.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Follower Count */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
              <Users className="h-3 w-3" />
              <span>{recommendation.recommendedUser.followersCount} followers</span>
            </div>

            {/* Follow Button */}
            <Button
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              onClick={handleFollow}
              disabled={followLoading || statusLoading || isFollowing}
              className="w-full flex items-center gap-1"
            >
              {getFollowButtonIcon()}
              {getFollowButtonText()}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface UserRecommendationsProps {
  userId: string
  title?: string
  showTitle?: boolean
  maxRecommendations?: number
}

export default function UserRecommendations({ 
  userId, 
  title = "Suggested for you",
  showTitle = true,
  maxRecommendations = 6
}: UserRecommendationsProps) {
  const { recommendations, loading, error } = useUserRecommendations(userId)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const handleDismiss = (recommendationId: string) => {
    setDismissedIds(prev => new Set([...prev, recommendationId]))
    // In a real implementation, you would also update the backend
    // to mark this recommendation as dismissed
  }

  const visibleRecommendations = recommendations
    .filter(rec => !dismissedIds.has(rec.id))
    .slice(0, maxRecommendations)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          {showTitle && <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {title}
          </CardTitle>}
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          {showTitle && <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {title}
          </CardTitle>}
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            Failed to load recommendations: {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (visibleRecommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          {showTitle && <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {title}
          </CardTitle>}
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No new recommendations at the moment.</p>
            <p className="text-sm">Check back later for new suggestions!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleRecommendations.map((recommendation) => (
          <RecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </div>
  )
}

// Compact version for sidebars
export function CompactUserRecommendations({ userId }: { userId: string }) {
  const { recommendations, loading, error } = useUserRecommendations(userId)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const handleDismiss = (recommendationId: string) => {
    setDismissedIds(prev => new Set([...prev, recommendationId]))
  }

  const visibleRecommendations = recommendations
    .filter(rec => !dismissedIds.has(rec.id))
    .slice(0, 3)

  if (loading || error || visibleRecommendations.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Who to follow
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleRecommendations.map((recommendation) => (
          <div key={recommendation.id} className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={recommendation.recommendedUser.avatarUrl} 
                alt={recommendation.recommendedUser.displayName} 
              />
              <AvatarFallback className="text-xs">
                {recommendation.recommendedUser.displayName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {recommendation.recommendedUser.displayName}
              </p>
              <p className="text-xs text-muted-foreground">
                @{recommendation.recommendedUser.username}
              </p>
            </div>
            
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
              Follow
            </Button>
          </div>
        ))}
        
        <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
          <a href="/users">Show more</a>
        </Button>
      </CardContent>
    </Card>
  )
}
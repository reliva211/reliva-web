// components/followers-dialog.tsx

"use client"

import { useState, useEffect } from "react"
import { Users, UserCheck, UserPlus, Clock } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { useUserConnections, useFollowUser, useFollowStatus } from "@/hooks/use-user"
import { useCurrentUser } from "@/hooks/use-current-user"
import { UserFollow } from "@/types/user"

interface FollowersDialogProps {
  userId: string
  children: React.ReactNode
  className?: string
}

function FollowerCard({ follow, currentUserId }: { follow: UserFollow; currentUserId?: string }) {
  const { followUser, unfollowUser, loading: followLoading } = useFollowUser()
  const { isFollowing, isPending, loading: statusLoading } = useFollowStatus(currentUserId, follow.followerId)

  const handleFollow = async () => {
    if (!currentUserId) return
    
    try {
      if (isFollowing) {
        await unfollowUser(currentUserId, follow.followerId)
      } else {
        await followUser(currentUserId, follow.followerId)
      }
    } catch (err) {
      console.error("Follow action failed:", err)
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

  const isOwnProfile = currentUserId === follow.followerId

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
      <Avatar className="h-12 w-12">
        <AvatarImage src={follow.followerInfo.avatarUrl} alt={follow.followerInfo.displayName} />
        <AvatarFallback>{follow.followerInfo.displayName.charAt(0)}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{follow.followerInfo.displayName}</p>
          {follow.followerInfo.isVerified && (
            <Badge variant="secondary" className="text-xs">
              Verified
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">@{follow.followerInfo.username}</p>
      </div>
      
      {currentUserId && !isOwnProfile && (
        <Button
          variant={isFollowing ? "outline" : "default"}
          size="sm"
          onClick={handleFollow}
          disabled={followLoading || statusLoading}
          className="flex items-center gap-1"
        >
          {getFollowButtonIcon()}
          {getFollowButtonText()}
        </Button>
      )}
    </div>
  )
}

export default function FollowersDialog({ userId, children, className }: FollowersDialogProps) {
  const { user: currentUser } = useCurrentUser()
  const { followers, loading, error } = useUserConnections(userId)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredFollowers, setFilteredFollowers] = useState<UserFollow[]>([])

  useEffect(() => {
    if (followers) {
      const filtered = followers.filter(follow =>
        follow.followerInfo.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        follow.followerInfo.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredFollowers(filtered)
    }
  }, [followers, searchQuery])

  return (
    <Dialog>
      <DialogTrigger asChild className={className}>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Followers ({followers.length})
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <Input
            placeholder="Search followers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          {/* Followers List */}
          <ScrollArea className="h-96">
            {loading && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            )}
            
            {error && (
              <div className="text-center py-8 text-red-500">
                Failed to load followers: {error}
              </div>
            )}
            
            {!loading && !error && filteredFollowers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No followers found matching your search." : "No followers yet."}
              </div>
            )}
            
            {!loading && !error && filteredFollowers.length > 0 && (
              <div className="space-y-1">
                {filteredFollowers.map((follow) => (
                  <FollowerCard
                    key={follow.id}
                    follow={follow}
                    currentUserId={currentUser?.uid}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
// components/following-dialog.tsx

"use client"

import { useState, useEffect } from "react"
import { UserCheck, UserPlus, Clock, UserMinus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { useUserConnections, useFollowUser, useFollowStatus } from "@/hooks/use-user"
import { useCurrentUser } from "@/hooks/use-current-user"
import { UserFollow } from "@/types/user"

interface FollowingDialogProps {
  userId: string
  children: React.ReactNode
  className?: string
}

function FollowingCard({ follow, currentUserId, isOwnProfile }: { 
  follow: UserFollow; 
  currentUserId?: string;
  isOwnProfile: boolean;
}) {
  const { followUser, unfollowUser, loading: followLoading } = useFollowUser()
  const { isFollowing, isPending, loading: statusLoading } = useFollowStatus(currentUserId, follow.followingId)

  const handleFollow = async () => {
    if (!currentUserId) return
    
    try {
      if (isFollowing) {
        await unfollowUser(currentUserId, follow.followingId)
      } else {
        await followUser(currentUserId, follow.followingId)
      }
    } catch (err) {
      console.error("Follow action failed:", err)
    }
  }

  const getFollowButtonText = () => {
    if (isOwnProfile) {
      return "Unfollow"
    }
    if (isPending) return "Pending"
    if (isFollowing) return "Following"
    return "Follow"
  }

  const getFollowButtonIcon = () => {
    if (isOwnProfile) {
      return <UserMinus className="h-4 w-4" />
    }
    if (isPending) return <Clock className="h-4 w-4" />
    if (isFollowing) return <UserCheck className="h-4 w-4" />
    return <UserPlus className="h-4 w-4" />
  }

  const isViewingOwnFollowing = currentUserId === follow.followingId

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
      <Avatar className="h-12 w-12">
        <AvatarImage src={follow.followingInfo.avatarUrl} alt={follow.followingInfo.displayName} />
        <AvatarFallback>{follow.followingInfo.displayName.charAt(0)}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{follow.followingInfo.displayName}</p>
          {follow.followingInfo.isVerified && (
            <Badge variant="secondary" className="text-xs">
              Verified
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">@{follow.followingInfo.username}</p>
      </div>
      
      {currentUserId && !isViewingOwnFollowing && (
        <Button
          variant={isOwnProfile ? "outline" : (isFollowing ? "outline" : "default")}
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

export default function FollowingDialog({ userId, children, className }: FollowingDialogProps) {
  const { user: currentUser } = useCurrentUser()
  const { following, loading, error } = useUserConnections(userId)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredFollowing, setFilteredFollowing] = useState<UserFollow[]>([])

  const isOwnProfile = currentUser?.uid === userId

  useEffect(() => {
    if (following) {
      const filtered = following.filter(follow =>
        follow.followingInfo.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        follow.followingInfo.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredFollowing(filtered)
    }
  }, [following, searchQuery])

  return (
    <Dialog>
      <DialogTrigger asChild className={className}>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Following ({following.length})
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <Input
            placeholder="Search following..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          {/* Following List */}
          <ScrollArea className="h-96">
            {loading && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            )}
            
            {error && (
              <div className="text-center py-8 text-red-500">
                Failed to load following: {error}
              </div>
            )}
            
            {!loading && !error && filteredFollowing.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No users found matching your search." : "Not following anyone yet."}
              </div>
            )}
            
            {!loading && !error && filteredFollowing.length > 0 && (
              <div className="space-y-1">
                {filteredFollowing.map((follow) => (
                  <FollowingCard
                    key={follow.id}
                    follow={follow}
                    currentUserId={currentUser?.uid}
                    isOwnProfile={isOwnProfile}
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
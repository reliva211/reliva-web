// components/public-user-profile.tsx

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { 
  ArrowLeft, 
  MapPin, 
  LinkIcon, 
  Calendar, 
  Shield, 
  Star,
  Users,
  UserPlus,
  UserCheck,
  UserMinus,
  Clock,
  MessageCircle,
  MoreHorizontal,
  Flag,
  UserX,
  ExternalLink,
  Film,
  BookOpen,
  Music,
  Twitter,
  Instagram,
  Linkedin,
  Github
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { usePublicUserProfile, useFollowUser, useFollowStatus, useUserConnections } from "@/hooks/use-user"
import { useCurrentUser } from "@/hooks/use-current-user"
import { UserService } from "@/lib/user-service"
import FollowersDialog from "@/components/followers-dialog"
import FollowingDialog from "@/components/following-dialog"

interface PublicUserProfileProps {
  username: string
}

export default function PublicUserProfile({ username }: PublicUserProfileProps) {
  const router = useRouter()
  const { user: currentUser } = useCurrentUser()
  const [userId, setUserId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Get user profile data
  const { profile, loading: profileLoading, error: profileError } = usePublicUserProfile(userId, currentUser?.uid)
  
  // Follow functionality
  const { followUser, unfollowUser, loading: followLoading } = useFollowUser()
  const { isFollowing, isPending, loading: statusLoading } = useFollowStatus(currentUser?.uid, userId)
  
  // User connections
  const { followers, following } = useUserConnections(userId)

  // Find user by username
  useEffect(() => {
    const findUserByUsername = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // In a real implementation, you would search for the user by username
        // For now, we'll simulate this by searching the userSearchIndex
        const searchResult = await UserService.searchUsers({ query: username })
        const user = searchResult.users.find(u => u.username.toLowerCase() === username.toLowerCase())
        
        if (user) {
          setUserId(user.uid)
        } else {
          setError("User not found")
        }
      } catch (err) {
        setError("Failed to find user")
        console.error("Error finding user:", err)
      } finally {
        setLoading(false)
      }
    }

    if (username) {
      findUserByUsername()
    }
  }, [username])

  const handleFollow = async () => {
    if (!currentUser?.uid || !userId) return
    
    try {
      if (isFollowing) {
        await unfollowUser(currentUser.uid, userId)
      } else {
        await followUser(currentUser.uid, userId)
      }
    } catch (err) {
      console.error("Follow action failed:", err)
    }
  }

  const handleBlock = async () => {
    if (!currentUser?.uid || !userId) return
    
    try {
      await UserService.blockUser(currentUser.uid, userId, "Blocked by user")
      router.push("/users")
    } catch (err) {
      console.error("Block action failed:", err)
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

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case "twitter":
        return <Twitter className="h-4 w-4" />
      case "instagram":
        return <Instagram className="h-4 w-4" />
      case "linkedin":
        return <Linkedin className="h-4 w-4" />
      case "github":
        return <Github className="h-4 w-4" />
      default:
        return <ExternalLink className="h-4 w-4" />
    }
  }

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || profileError || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
          <p className="text-muted-foreground mb-4">
            {error || profileError || "The user you're looking for doesn't exist or has been removed."}
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const isOwnProfile = currentUser?.uid === userId

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="font-semibold">{profile.displayName}</h1>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            </div>
            {!isOwnProfile && currentUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Flag className="h-4 w-4 mr-2" />
                    Report User
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleBlock} className="text-red-600">
                    <UserX className="h-4 w-4 mr-2" />
                    Block User
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Cover Image */}
        <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg mb-6 overflow-hidden">
          {profile.coverImageUrl && (
            <Image
              src={profile.coverImageUrl}
              alt="Cover"
              fill
              className="object-cover"
            />
          )}
        </div>

        {/* Profile Info */}
        <div className="relative -mt-20 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
                <AvatarImage src={profile.avatarUrl} alt={profile.displayName} />
                <AvatarFallback className="text-2xl">
                  {profile.displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Profile Details */}
            <div className="flex-1 pt-16 md:pt-0">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-3xl font-bold">{profile.displayName}</h1>
                    {profile.isVerified && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                    {profile.featured && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-muted-foreground text-lg mb-2">@{profile.username}</p>
                  
                  {profile.tagline && (
                    <p className="text-sm font-medium text-primary mb-3">{profile.tagline}</p>
                  )}
                  
                  {profile.bio && (
                    <p className="mb-4 max-w-2xl">{profile.bio}</p>
                  )}

                  {/* Meta Information */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                    {profile.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {profile.location}
                      </div>
                    )}
                    {profile.website && (
                      <div className="flex items-center gap-1">
                        <LinkIcon className="h-4 w-4" />
                        <a
                          href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors"
                        >
                          {profile.website}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Joined {new Date(profile.joinDate).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                  </div>

                  {/* Social Links */}
                  {Object.keys(profile.socialLinks).length > 0 && (
                    <div className="flex gap-2 mb-4">
                      {Object.entries(profile.socialLinks).map(([platform, url]) => (
                        <Button
                          key={platform}
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                        >
                          <a
                            href={url.startsWith("http") ? url : `https://${url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {getSocialIcon(platform)}
                          </a>
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Follow Stats */}
                  <div className="flex gap-6 mb-4">
                    <FollowersDialog userId={userId} className="hover:underline cursor-pointer">
                      <div className="text-center">
                        <div className="font-bold text-lg">{profile.stats.followersCount}</div>
                        <div className="text-sm text-muted-foreground">Followers</div>
                      </div>
                    </FollowersDialog>
                    
                    <FollowingDialog userId={userId} className="hover:underline cursor-pointer">
                      <div className="text-center">
                        <div className="font-bold text-lg">{profile.stats.followingCount}</div>
                        <div className="text-sm text-muted-foreground">Following</div>
                      </div>
                    </FollowingDialog>
                    
                    <div className="text-center">
                      <div className="font-bold text-lg">{profile.stats.reviewsCount}</div>
                      <div className="text-sm text-muted-foreground">Reviews</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="font-bold text-lg">{profile.stats.listsCount}</div>
                      <div className="text-sm text-muted-foreground">Lists</div>
                    </div>
                  </div>

                  {/* Interest Tags */}
                  {profile.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {profile.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {!isOwnProfile && currentUser && (
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                    <Button
                      variant={isFollowing ? "outline" : "default"}
                      onClick={handleFollow}
                      disabled={followLoading || statusLoading}
                      className="flex items-center gap-2"
                    >
                      {getFollowButtonIcon()}
                      {getFollowButtonText()}
                    </Button>
                  </div>
                )}

                {isOwnProfile && (
                  <div className="flex gap-2">
                    <Button asChild>
                      <Link href="/profile/edit">Edit Profile</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Collection Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Film className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="font-bold text-lg">{profile.stats.totalItems.movies}</div>
              <div className="text-sm text-muted-foreground">Movies</div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="font-bold text-lg">{profile.stats.totalItems.books}</div>
              <div className="text-sm text-muted-foreground">Books</div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Film className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="font-bold text-lg">{profile.stats.totalItems.series}</div>
              <div className="text-sm text-muted-foreground">Series</div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Music className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="font-bold text-lg">{profile.stats.totalItems.music}</div>
              <div className="text-sm text-muted-foreground">Music</div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="movies">Movies</TabsTrigger>
            <TabsTrigger value="books">Books</TabsTrigger>
            <TabsTrigger value="series">Series</TabsTrigger>
            <TabsTrigger value="music">Music</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Recent activity will appear here</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Popular Lists</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Popular lists will appear here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="movies" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Movie Collection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Film className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Movie collection will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="books" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Book Collection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Book collection will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="series" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Series Collection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Film className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Series collection will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="music" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Music Collection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Music collection will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
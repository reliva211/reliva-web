// components/user-search.tsx

"use client"

import { useState, useRef } from "react"
import { Search, Filter, Users, MapPin, Star, Calendar, UserPlus, UserCheck, Clock, Shield } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useUserSearch, useFollowUser, useFollowStatus, usePublicUserProfile } from "@/hooks/use-user"
import { useCurrentUser } from "@/hooks/use-current-user"
import { UserSearchFilters, UserSearchIndex } from "@/types/user"

// User Card Component
function UserCard({ user, currentUserId }: { user: UserSearchIndex; currentUserId?: string }) {
  const { followUser, unfollowUser, loading: followLoading } = useFollowUser()
  const { isFollowing, isPending, loading: statusLoading } = useFollowStatus(currentUserId, user.uid)

  const handleFollow = async () => {
    if (!currentUserId) return
    
    if (isFollowing) {
      await unfollowUser(currentUserId, user.uid)
    } else {
      await followUser(currentUserId, user.uid)
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
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatarUrl} alt={user.displayName} />
            <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">{user.displayName}</h3>
              {user.isVerified && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Verified
                </Badge>
              )}
              {user.featured && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Featured
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">@{user.username}</p>
            
            {user.bio && (
              <p className="text-sm mb-3 line-clamp-2">{user.bio}</p>
            )}
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
              {user.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {user.location}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {user.followersCount} followers
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Joined {user.joinDate.toDate().getFullYear()}
              </div>
            </div>
            
            {user.tags.length > 0 && (
              <div className="flex gap-1 mb-3 flex-wrap">
                {user.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {user.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{user.tags.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2">
            <UserProfileDialog userId={user.uid} />
            {currentUserId && currentUserId !== user.uid && (
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
        </div>
      </CardContent>
    </Card>
  )
}

// User Profile Dialog Component
function UserProfileDialog({ userId }: { userId: string }) {
  const { user: currentUser } = useCurrentUser()
  const { profile, loading, error } = usePublicUserProfile(userId, currentUser?.uid)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          View Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>
        
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        
        {error && (
          <div className="text-center py-8 text-red-500">
            Failed to load profile: {error}
          </div>
        )}
        
        {profile && (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatarUrl} alt={profile.displayName} />
                <AvatarFallback>{profile.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold">{profile.displayName}</h2>
                  {profile.isVerified && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">@{profile.username}</p>
                {profile.tagline && (
                  <p className="text-sm text-primary mt-1">{profile.tagline}</p>
                )}
              </div>
            </div>
            
            {/* Bio */}
            {profile.bio && (
              <div>
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-sm">{profile.bio}</p>
              </div>
            )}
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="font-bold text-lg">{profile.stats.followersCount}</div>
                <div className="text-xs text-muted-foreground">Followers</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{profile.stats.followingCount}</div>
                <div className="text-xs text-muted-foreground">Following</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{profile.stats.reviewsCount}</div>
                <div className="text-xs text-muted-foreground">Reviews</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{profile.stats.listsCount}</div>
                <div className="text-xs text-muted-foreground">Lists</div>
              </div>
            </div>
            
            {/* Collection Stats */}
            <div>
              <h3 className="font-semibold mb-3">Collections</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-bold">{profile.stats.totalItems.movies}</div>
                  <div className="text-xs text-muted-foreground">Movies</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-bold">{profile.stats.totalItems.books}</div>
                  <div className="text-xs text-muted-foreground">Books</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-bold">{profile.stats.totalItems.series}</div>
                  <div className="text-xs text-muted-foreground">Series</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-bold">{profile.stats.totalItems.music}</div>
                  <div className="text-xs text-muted-foreground">Music</div>
                </div>
              </div>
            </div>
            
            {/* Tags and Interests */}
            {profile.tags.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Interests</h3>
                <div className="flex gap-2 flex-wrap">
                  {profile.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {profile.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {new Date(profile.joinDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Search Filters Component
function SearchFilters({ 
  filters, 
  onFiltersChange 
}: { 
  filters: UserSearchFilters
  onFiltersChange: (filters: UserSearchFilters) => void 
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="Enter location"
            value={filters.location || ""}
            onChange={(e) => onFiltersChange({ ...filters, location: e.target.value })}
          />
        </div>
        
        <div>
          <Label htmlFor="tags">Interests</Label>
          <Input
            id="tags"
            placeholder="music, movies, books..."
            value={filters.tags?.join(", ") || ""}
            onChange={(e) => onFiltersChange({ 
              ...filters, 
              tags: e.target.value.split(",").map(tag => tag.trim()).filter(Boolean)
            })}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="verified"
            checked={filters.isVerified || false}
            onCheckedChange={(checked) => onFiltersChange({ ...filters, isVerified: checked as boolean })}
          />
          <Label htmlFor="verified">Verified users only</Label>
        </div>
        
        <div>
          <Label htmlFor="minFollowers">Minimum followers</Label>
          <Select
            value={filters.minFollowers?.toString() || ""}
            onValueChange={(value) => onFiltersChange({ 
              ...filters, 
              minFollowers: value ? parseInt(value) : undefined 
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any</SelectItem>
              <SelectItem value="10">10+</SelectItem>
              <SelectItem value="50">50+</SelectItem>
              <SelectItem value="100">100+</SelectItem>
              <SelectItem value="500">500+</SelectItem>
              <SelectItem value="1000">1000+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}

// Main User Search Component
export default function UserSearch() {
  const { user: currentUser } = useCurrentUser()
  const { searchResult, loading, error, searchUsers, clearSearch } = useUserSearch()
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<UserSearchFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  const handleSearch = (query: string, currentFilters: UserSearchFilters = filters) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (query.trim() || Object.keys(currentFilters).length > 0) {
        searchUsers({ ...currentFilters, query: query.trim() })
      } else {
        clearSearch()
      }
    }, 300)
  }

  const handleQueryChange = (query: string) => {
    setSearchQuery(query)
    handleSearch(query)
  }

  const handleFiltersChange = (newFilters: UserSearchFilters) => {
    setFilters(newFilters)
    handleSearch(searchQuery, newFilters)
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Find Users</h1>
        <p className="text-muted-foreground">
          Discover and connect with other Reliva users who share your interests
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name, username, or bio..."
            value={searchQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="lg:col-span-1">
            <SearchFilters filters={filters} onFiltersChange={handleFiltersChange} />
          </div>
        )}

        {/* Search Results */}
        <div className={`${showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          {loading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {error && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-red-500">Error: {error}</p>
              </CardContent>
            </Card>
          )}

          {!loading && !error && !searchResult && (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Start searching</h3>
                <p className="text-muted-foreground">
                  Enter a search term or apply filters to find users
                </p>
              </CardContent>
            </Card>
          )}

          {searchResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Found {searchResult.total} users
                </p>
                {(searchQuery || Object.keys(filters).length > 0) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("")
                      setFilters({})
                      clearSearch()
                    }}
                  >
                    Clear search
                  </Button>
                )}
              </div>

              {searchResult.users.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No users found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search terms or filters
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {searchResult.users.map((user) => (
                    <UserCard
                      key={user.uid}
                      user={user}
                      currentUserId={currentUser?.uid}
                    />
                  ))}
                  
                  {searchResult.hasMore && (
                    <div className="text-center">
                      <Button variant="outline">Load more</Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
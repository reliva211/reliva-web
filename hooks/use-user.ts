// hooks/use-user.ts

"use client"

import { useState, useEffect } from "react"
import { UserService } from "@/lib/user-service"
import {
  UserProfile,
  UserFollow,
  UserSearchFilters,
  UserSearchResult,
  UserProfilePublic,
  UserRecommendation
} from "@/types/user"

// Hook for user search functionality
export function useUserSearch() {
  const [searchResult, setSearchResult] = useState<UserSearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchUsers = async (filters: UserSearchFilters) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await UserService.searchUsers(filters)
      setSearchResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search users")
    } finally {
      setLoading(false)
    }
  }

  const clearSearch = () => {
    setSearchResult(null)
    setError(null)
  }

  return {
    searchResult,
    loading,
    error,
    searchUsers,
    clearSearch
  }
}

// Hook for follow/unfollow operations
export function useFollowUser() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const followUser = async (followerId: string, followingId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      await UserService.followUser(followerId, followingId)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to follow user")
      return false
    } finally {
      setLoading(false)
    }
  }

  const unfollowUser = async (followerId: string, followingId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      await UserService.unfollowUser(followerId, followingId)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unfollow user")
      return false
    } finally {
      setLoading(false)
    }
  }

  const acceptFollowRequest = async (followingId: string, followerId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      await UserService.acceptFollowRequest(followingId, followerId)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept follow request")
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    followUser,
    unfollowUser,
    acceptFollowRequest
  }
}

// Hook for getting user followers/following
export function useUserConnections(userId: string) {
  const [followers, setFollowers] = useState<UserFollow[]>([])
  const [following, setFollowing] = useState<UserFollow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchConnections = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const [followersData, followingData] = await Promise.all([
          UserService.getUserFollowers(userId),
          UserService.getUserFollowing(userId)
        ])
        
        setFollowers(followersData)
        setFollowing(followingData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch user connections")
      } finally {
        setLoading(false)
      }
    }

    fetchConnections()
  }, [userId])

  return {
    followers,
    following,
    loading,
    error,
    refetch: () => {
      if (userId) {
        setLoading(true)
        // Re-fetch logic would go here
      }
    }
  }
}

// Hook for getting follow relationship status
export function useFollowStatus(viewerId: string | undefined, targetUserId: string) {
  const [followStatus, setFollowStatus] = useState<UserFollow | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowedBy, setIsFollowedBy] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!viewerId || !targetUserId || viewerId === targetUserId) {
      setLoading(false)
      return
    }

    const checkFollowStatus = async () => {
      setLoading(true)
      
      try {
        const [followingRelation, followerRelation] = await Promise.all([
          UserService.getFollowRelationship(viewerId, targetUserId),
          UserService.getFollowRelationship(targetUserId, viewerId)
        ])
        
        setFollowStatus(followingRelation)
        setIsFollowing(followingRelation?.status === 'accepted')
        setIsFollowedBy(followerRelation?.status === 'accepted')
      } catch (err) {
        console.error("Error checking follow status:", err)
      } finally {
        setLoading(false)
      }
    }

    checkFollowStatus()
  }, [viewerId, targetUserId])

  return {
    followStatus,
    isFollowing,
    isFollowedBy,
    loading,
    isPending: followStatus?.status === 'pending'
  }
}

// Hook for user recommendations
export function useUserRecommendations(userId: string) {
  const [recommendations, setRecommendations] = useState<UserRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchRecommendations = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const recs = await UserService.getUserRecommendations(userId)
        setRecommendations(recs)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch recommendations")
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [userId])

  return {
    recommendations,
    loading,
    error
  }
}

// Hook for getting public user profile
export function usePublicUserProfile(userId: string, viewerId?: string) {
  const [profile, setProfile] = useState<UserProfilePublic | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchProfile = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const profileData = await UserService.getPublicUserProfile(userId, viewerId)
        setProfile(profileData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch user profile")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId, viewerId])

  return {
    profile,
    loading,
    error
  }
}
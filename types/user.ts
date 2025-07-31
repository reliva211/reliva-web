// types/user.ts

import { Timestamp } from "firebase/firestore"

// Enhanced User Profile Schema
export interface UserProfile {
  uid: string
  displayName: string
  username: string
  email?: string
  bio: string
  location: string
  website: string
  tagline: string
  avatarUrl: string
  coverImageUrl: string
  joinDate: string
  isPublic: boolean
  isVerified?: boolean
  lastActive?: string
  
  // Social Links
  socialLinks: {
    twitter?: string
    instagram?: string
    linkedin?: string
    github?: string
    spotify?: string
    letterboxd?: string
    goodreads?: string
  }
  
  // Privacy Settings
  privacy: {
    showEmail: boolean
    showLocation: boolean
    showActivity: boolean
    allowMessages: boolean
    allowFollowRequests: boolean
    showCollections: boolean
  }
  
  // Search and Discovery
  searchable: boolean
  featured: boolean
  tags: string[] // User interests/categories for discovery
  
  // Statistics (computed/cached values)
  stats: {
    followersCount: number
    followingCount: number
    postsCount: number
    reviewsCount: number
    listsCount: number
    totalItems: {
      movies: number
      books: number
      series: number
      music: number
    }
  }
  
  // Verification and moderation
  reportCount?: number
  isBanned?: boolean
  banReason?: string
  banExpiry?: string
}

// Follow Relationship Schema
export interface UserFollow {
  id: string // auto-generated document ID
  followerId: string // User who is following
  followingId: string // User being followed
  createdAt: Timestamp
  status: 'pending' | 'accepted' | 'blocked'
  
  // Follower info (denormalized for performance)
  followerInfo: {
    username: string
    displayName: string
    avatarUrl: string
    isVerified: boolean
  }
  
  // Following info (denormalized for performance)
  followingInfo: {
    username: string
    displayName: string
    avatarUrl: string
    isVerified: boolean
  }
}

// User Search Index Schema (for efficient searching)
export interface UserSearchIndex {
  uid: string
  username: string
  displayName: string
  bio: string
  tags: string[]
  location: string
  isPublic: boolean
  isVerified: boolean
  searchable: boolean
  featured: boolean
  lastActive: Timestamp
  followersCount: number
  joinDate: Timestamp
  
  // Search optimization fields
  searchTerms: string[] // Tokenized searchable text
  searchScore: number // Relevance/popularity score
}

// User Activity Schema (for activity feeds)
export interface UserActivity {
  id: string
  userId: string
  type: 'follow' | 'review' | 'list_create' | 'list_update' | 'item_add' | 'achievement'
  timestamp: Timestamp
  isPublic: boolean
  
  // Activity-specific data
  data: {
    targetUserId?: string // For follow activities
    targetUsername?: string
    itemId?: string // For item-related activities
    itemType?: 'movie' | 'book' | 'series' | 'music'
    itemTitle?: string
    listId?: string // For list activities
    listName?: string
    reviewId?: string // For review activities
    rating?: number
  }
}

// User Recommendation Schema
export interface UserRecommendation {
  id: string
  userId: string // User receiving the recommendation
  recommendedUserId: string // User being recommended
  reason: 'similar_interests' | 'mutual_followers' | 'location' | 'featured' | 'new_user'
  score: number // Recommendation strength
  createdAt: Timestamp
  dismissed?: boolean
  followed?: boolean
  
  // Recommended user info (denormalized)
  recommendedUser: {
    username: string
    displayName: string
    avatarUrl: string
    bio: string
    isVerified: boolean
    followersCount: number
    commonInterests: string[]
    mutualFollowers?: number
  }
}

// User Notification Schema
export interface UserNotification {
  id: string
  userId: string // User receiving the notification
  type: 'follow_request' | 'follow_accepted' | 'new_follower' | 'mention' | 'like' | 'comment'
  fromUserId: string
  fromUsername: string
  fromDisplayName: string
  fromAvatarUrl: string
  isRead: boolean
  createdAt: Timestamp
  
  // Notification-specific data
  data?: {
    targetId?: string // ID of the target (post, review, etc.)
    targetType?: string
    message?: string
  }
}

// User Block/Report Schema
export interface UserBlock {
  id: string
  blockerId: string // User who blocked
  blockedId: string // User who was blocked
  reason?: string
  createdAt: Timestamp
}

export interface UserReport {
  id: string
  reporterId: string
  reportedUserId: string
  reason: 'spam' | 'harassment' | 'inappropriate_content' | 'fake_account' | 'other'
  description: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  createdAt: Timestamp
  reviewedAt?: Timestamp
  reviewedBy?: string
}

// User Settings Schema
export interface UserSettings {
  userId: string
  notifications: {
    email: {
      followers: boolean
      reviews: boolean
      recommendations: boolean
      newsletter: boolean
    }
    push: {
      followers: boolean
      mentions: boolean
      likes: boolean
      comments: boolean
    }
  }
  privacy: {
    profileVisibility: 'public' | 'followers' | 'private'
    activityVisibility: 'public' | 'followers' | 'private'
    allowMessages: 'everyone' | 'followers' | 'none'
    allowTags: boolean
    showOnlineStatus: boolean
  }
  discovery: {
    showInSearch: boolean
    showInRecommendations: boolean
    allowLocationBasedSuggestions: boolean
  }
}

// Type guards and utility types
export type UserProfilePublic = Omit<UserProfile, 'email' | 'reportCount' | 'isBanned' | 'banReason' | 'banExpiry'>

export interface UserSearchFilters {
  query?: string
  location?: string
  tags?: string[]
  isVerified?: boolean
  minFollowers?: number
  maxFollowers?: number
  joinedAfter?: Date
  joinedBefore?: Date
  isOnline?: boolean
}

export interface UserSearchResult {
  users: UserSearchIndex[]
  total: number
  hasMore: boolean
  nextCursor?: string
}

// Firebase Collection Names (constants)
export const USER_COLLECTIONS = {
  PROFILES: 'userProfiles',
  FOLLOWS: 'userFollows', 
  SEARCH_INDEX: 'userSearchIndex',
  ACTIVITIES: 'userActivities',
  RECOMMENDATIONS: 'userRecommendations',
  NOTIFICATIONS: 'userNotifications',
  BLOCKS: 'userBlocks',
  REPORTS: 'userReports',
  SETTINGS: 'userSettings'
} as const
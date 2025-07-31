# Reliva User Schema Documentation

This document outlines the comprehensive user schema for Reliva, designed to support user search, viewing, and following functionality.

## Overview

The Reliva user schema provides:
- **User Profiles**: Enhanced profile management with privacy controls
- **Search & Discovery**: Efficient user search with filtering and indexing
- **Follow System**: Complete follower/following relationships with notifications
- **Privacy Controls**: Granular privacy settings for user visibility
- **Social Features**: Activity feeds, recommendations, and notifications

## Database Collections

### Firebase Firestore Structure

```
users/
├── userProfiles/           # Main user profile data
├── userFollows/           # Follow relationships
├── userSearchIndex/       # Optimized search data
├── userActivities/        # User activity feed
├── userRecommendations/   # User recommendations
├── userNotifications/     # User notifications
├── userBlocks/            # Blocked users
├── userReports/           # User reports
└── userSettings/          # User preferences
```

## Core Schemas

### 1. UserProfile (`userProfiles` collection)

```typescript
interface UserProfile {
  uid: string                    // Firebase Auth UID
  displayName: string           // Public display name
  username: string              // Unique username (@handle)
  email?: string               // Private email (hidden from public)
  bio: string                  // User biography
  location: string             // User location
  website: string              // Personal website
  tagline: string              // Short tagline/motto
  avatarUrl: string            // Profile picture URL
  coverImageUrl: string        // Cover image URL
  joinDate: string             // ISO date string
  isPublic: boolean            // Profile visibility
  isVerified?: boolean         // Verification status
  lastActive?: string          // Last activity timestamp

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
  searchable: boolean          // Appear in search results
  featured: boolean            // Featured user status
  tags: string[]              // Interest tags for discovery

  // Statistics (cached/computed)
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

  // Moderation
  reportCount?: number
  isBanned?: boolean
  banReason?: string
  banExpiry?: string
}
```

### 2. UserFollow (`userFollows` collection)

```typescript
interface UserFollow {
  id: string                   // Format: "{followerId}_{followingId}"
  followerId: string           // User who is following
  followingId: string          // User being followed
  createdAt: Timestamp
  status: 'pending' | 'accepted' | 'blocked'

  // Denormalized data for performance
  followerInfo: {
    username: string
    displayName: string
    avatarUrl: string
    isVerified: boolean
  }

  followingInfo: {
    username: string
    displayName: string
    avatarUrl: string
    isVerified: boolean
  }
}
```

### 3. UserSearchIndex (`userSearchIndex` collection)

Optimized collection for search operations:

```typescript
interface UserSearchIndex {
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
  searchTerms: string[]        // Tokenized searchable text
  searchScore: number          // Relevance/popularity score
}
```

## Key Features

### 1. User Search

**Search Filters:**
- Text query (name, username, bio)
- Location filtering
- Interest tags
- Verification status
- Follower count ranges
- Join date ranges

**Search Implementation:**
```typescript
// Example search usage
const searchFilters: UserSearchFilters = {
  query: "photography",
  location: "New York",
  tags: ["photography", "art"],
  isVerified: true,
  minFollowers: 100
}

const results = await UserService.searchUsers(searchFilters)
```

### 2. Follow System

**Follow States:**
- `accepted`: Normal follow relationship
- `pending`: Waiting for approval (private accounts)
- `blocked`: User has been blocked

**Follow Operations:**
```typescript
// Follow a user
await UserService.followUser(followerId, followingId)

// Unfollow a user
await UserService.unfollowUser(followerId, followingId)

// Accept follow request
await UserService.acceptFollowRequest(followingId, followerId)

// Check follow status
const relationship = await UserService.getFollowRelationship(followerId, followingId)
```

### 3. Privacy Controls

**Profile Visibility:**
- `public`: Visible to everyone
- `followers`: Visible to followers only
- `private`: Visible to approved followers only

**Privacy Settings:**
```typescript
privacy: {
  showEmail: boolean           // Show email in profile
  showLocation: boolean        // Show location
  showActivity: boolean        // Show last active time
  allowMessages: boolean       // Allow direct messages
  allowFollowRequests: boolean // Require approval for follows
  showCollections: boolean     // Show media collections
}
```

### 4. User Discovery

**Recommendation Types:**
- `similar_interests`: Based on shared tags/interests
- `mutual_followers`: Users followed by mutual connections
- `location`: Users in same location
- `featured`: Platform-featured users
- `new_user`: Recently joined users

## Usage Examples

### React Hooks

```typescript
// Search users
const { searchResult, loading, searchUsers } = useUserSearch()

// Follow operations
const { followUser, unfollowUser, loading } = useFollowUser()

// Check follow status
const { isFollowing, isPending } = useFollowStatus(viewerId, targetUserId)

// Get user connections
const { followers, following } = useUserConnections(userId)

// Get recommendations
const { recommendations } = useUserRecommendations(userId)
```

### Components

```typescript
// User search page
import UserSearch from '@/components/user-search'

// Individual user card
<UserCard user={userSearchResult} currentUserId={currentUser?.uid} />

// User profile dialog
<UserProfileDialog userId={user.uid} />
```

## Implementation Steps

### 1. Database Setup

1. **Create Firestore Collections:**
   ```javascript
   // Initialize collections with proper security rules
   userProfiles/         // Main user data
   userFollows/         // Follow relationships
   userSearchIndex/     // Search optimization
   userActivities/      // Activity feeds
   userNotifications/   // Notifications
   ```

2. **Security Rules Example:**
   ```javascript
   // Allow users to read public profiles
   match /userProfiles/{userId} {
     allow read: if resource.data.isPublic == true 
                || request.auth != null && request.auth.uid == userId;
     allow write: if request.auth != null && request.auth.uid == userId;
   }

   // Follow relationships
   match /userFollows/{followId} {
     allow read, write: if request.auth != null && 
       (request.auth.uid == resource.data.followerId || 
        request.auth.uid == resource.data.followingId);
   }
   ```

### 2. Search Index Maintenance

**Auto-update search index when profile changes:**
```typescript
// Update search index when profile is modified
const updateProfile = async (userId: string, updates: Partial<UserProfile>) => {
  await updateDoc(doc(db, 'userProfiles', userId), updates)
  
  // Update search index if searchable fields changed
  if (updates.displayName || updates.username || updates.bio || updates.tags) {
    await UserService.updateSearchIndex(userId)
  }
}
```

### 3. Follow Count Maintenance

**Use Firestore transactions for consistency:**
```typescript
// Follow counts are updated atomically with follow relationships
const followUser = async (followerId: string, followingId: string) => {
  const batch = writeBatch(db)
  
  // Create follow relationship
  batch.set(followRef, followData)
  
  // Update counts
  batch.update(followerProfileRef, { 
    "stats.followingCount": increment(1) 
  })
  batch.update(followingProfileRef, { 
    "stats.followersCount": increment(1) 
  })
  
  await batch.commit()
}
```

### 4. Privacy Implementation

**Filter data based on privacy settings:**
```typescript
const getPublicProfile = async (userId: string, viewerId?: string) => {
  const profile = await getUserProfile(userId)
  
  // Check privacy settings and viewer relationship
  if (!profile.privacy.showLocation) {
    profile.location = ""
  }
  
  if (!profile.privacy.showActivity) {
    delete profile.lastActive
  }
  
  return profile
}
```

## Performance Considerations

### 1. Search Optimization

- **Denormalized Search Index**: Separate collection for optimized queries
- **Search Score**: Pre-calculated relevance score for ranking
- **Search Terms**: Tokenized text for efficient full-text search
- **Pagination**: Limit results and use cursor-based pagination

### 2. Follow Relationships

- **Denormalized Data**: Store follower/following info in follow documents
- **Batch Operations**: Use Firestore batches for atomic updates
- **Count Caching**: Cache follower/following counts in user profiles

### 3. Real-time Updates

- **Firestore Listeners**: Real-time updates for follow status changes
- **Optimistic Updates**: Update UI immediately, handle errors gracefully
- **Debounced Search**: Prevent excessive API calls during typing

## Security & Privacy

### 1. Data Protection

- **Email Privacy**: Email addresses are never exposed publicly
- **Blocked Users**: Blocked users cannot view profiles or send messages
- **Report System**: Users can report inappropriate behavior

### 2. Privacy Controls

- **Granular Settings**: Fine-grained control over what information is visible
- **Follow Approval**: Private accounts require approval for follows
- **Search Visibility**: Users can opt out of search results

### 3. Moderation

- **Report System**: Built-in reporting for inappropriate content/behavior
- **Ban System**: Temporary or permanent user bans
- **Verification**: Optional verification system for authentic users

## Migration from Existing Schema

If upgrading from the existing `UserProfile` interface:

1. **Add new fields with defaults:**
   ```typescript
   const migrateUserProfile = async (userId: string) => {
     const updates = {
       privacy: {
         showEmail: false,
         showLocation: true,
         showActivity: true,
         allowMessages: true,
         allowFollowRequests: false,
         showCollections: true
       },
       searchable: true,
       featured: false,
       tags: [],
       stats: {
         followersCount: 0,
         followingCount: 0,
         postsCount: 0,
         reviewsCount: 0,
         listsCount: 0,
         totalItems: { movies: 0, books: 0, series: 0, music: 0 }
       }
     }
     
     await updateDoc(doc(db, 'userProfiles', userId), updates)
     await UserService.updateSearchIndex(userId)
   }
   ```

2. **Create search index for existing users:**
   ```typescript
   const createSearchIndexForAllUsers = async () => {
     const snapshot = await getDocs(collection(db, 'userProfiles'))
     
     for (const doc of snapshot.docs) {
       await UserService.updateSearchIndex(doc.id)
     }
   }
   ```

This schema provides a solid foundation for user management, search, and social features in Reliva while maintaining performance, security, and scalability.
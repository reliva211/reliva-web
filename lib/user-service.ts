// lib/user-service.ts

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  writeBatch,
  increment,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentReference
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import {
  UserProfile,
  UserFollow,
  UserSearchIndex,
  UserActivity,
  UserRecommendation,
  UserNotification,
  UserBlock,
  UserReport,
  UserSettings,
  UserSearchFilters,
  UserSearchResult,
  UserProfilePublic,
  USER_COLLECTIONS
} from "@/types/user"

// User Profile Management
export class UserService {
  
  // Get user profile by ID
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, USER_COLLECTIONS.PROFILES, userId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile
      }
      return null
    } catch (error) {
      console.error("Error fetching user profile:", error)
      throw error
    }
  }

  // Get public user profile (filtered for privacy)
  static async getPublicUserProfile(userId: string, viewerId?: string): Promise<UserProfilePublic | null> {
    try {
      const profile = await this.getUserProfile(userId)
      if (!profile) return null

      // Check if viewer is blocked
      if (viewerId && await this.isUserBlocked(userId, viewerId)) {
        return null
      }

      // Filter based on privacy settings
      const publicProfile: UserProfilePublic = {
        uid: profile.uid,
        displayName: profile.displayName,
        username: profile.username,
        bio: profile.bio,
        location: profile.privacy.showLocation ? profile.location : "",
        website: profile.website,
        tagline: profile.tagline,
        avatarUrl: profile.avatarUrl,
        coverImageUrl: profile.coverImageUrl,
        joinDate: profile.joinDate,
        isPublic: profile.isPublic,
        isVerified: profile.isVerified,
        lastActive: profile.privacy.showActivity ? profile.lastActive : undefined,
        socialLinks: profile.socialLinks,
        privacy: profile.privacy,
        searchable: profile.searchable,
        featured: profile.featured,
        tags: profile.tags,
        stats: profile.stats
      }

      return publicProfile
    } catch (error) {
      console.error("Error fetching public user profile:", error)
      throw error
    }
  }

  // Update user profile
  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const docRef = doc(db, USER_COLLECTIONS.PROFILES, userId)
      await updateDoc(docRef, updates)

      // Update search index if searchable fields were changed
      if (updates.displayName || updates.username || updates.bio || updates.tags || updates.location) {
        await this.updateSearchIndex(userId)
      }
    } catch (error) {
      console.error("Error updating user profile:", error)
      throw error
    }
  }

  // Search users
  static async searchUsers(filters: UserSearchFilters, lastDoc?: QueryDocumentSnapshot): Promise<UserSearchResult> {
    try {
      let baseQuery = query(
        collection(db, USER_COLLECTIONS.SEARCH_INDEX),
        where("searchable", "==", true),
        where("isPublic", "==", true)
      )

      // Apply filters
      if (filters.query) {
        // For full-text search, you might want to use Algolia or build a more sophisticated solution
        // This is a simple approach using array-contains for search terms
        const searchTerms = filters.query.toLowerCase().split(" ")
        baseQuery = query(baseQuery, where("searchTerms", "array-contains-any", searchTerms))
      }

      if (filters.location) {
        baseQuery = query(baseQuery, where("location", "==", filters.location))
      }

      if (filters.tags && filters.tags.length > 0) {
        baseQuery = query(baseQuery, where("tags", "array-contains-any", filters.tags))
      }

      if (filters.isVerified !== undefined) {
        baseQuery = query(baseQuery, where("isVerified", "==", filters.isVerified))
      }

      if (filters.minFollowers) {
        baseQuery = query(baseQuery, where("followersCount", ">=", filters.minFollowers))
      }

      // Order and pagination
      baseQuery = query(baseQuery, orderBy("searchScore", "desc"), limit(20))

      if (lastDoc) {
        baseQuery = query(baseQuery, startAfter(lastDoc))
      }

      const querySnapshot = await getDocs(baseQuery)
      const users = querySnapshot.docs.map(doc => doc.data() as UserSearchIndex)

      return {
        users,
        total: users.length,
        hasMore: querySnapshot.docs.length === 20,
        nextCursor: querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1].id : undefined
      }
    } catch (error) {
      console.error("Error searching users:", error)
      throw error
    }
  }

  // Follow/Unfollow Operations
  static async followUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new Error("Cannot follow yourself")
    }

    try {
      const batch = writeBatch(db)
      
      // Check if already following
      const existingFollow = await this.getFollowRelationship(followerId, followingId)
      if (existingFollow) {
        throw new Error("Already following this user")
      }

      // Get user profiles for denormalized data
      const [followerProfile, followingProfile] = await Promise.all([
        this.getUserProfile(followerId),
        this.getUserProfile(followingId)
      ])

      if (!followerProfile || !followingProfile) {
        throw new Error("User profiles not found")
      }

      // Create follow relationship
      const followId = `${followerId}_${followingId}`
      const followData: UserFollow = {
        id: followId,
        followerId,
        followingId,
        createdAt: Timestamp.now(),
        status: followingProfile.privacy.allowFollowRequests ? 'pending' : 'accepted',
        followerInfo: {
          username: followerProfile.username,
          displayName: followerProfile.displayName,
          avatarUrl: followerProfile.avatarUrl,
          isVerified: followerProfile.isVerified || false
        },
        followingInfo: {
          username: followingProfile.username,
          displayName: followingProfile.displayName,
          avatarUrl: followingProfile.avatarUrl,
          isVerified: followingProfile.isVerified || false
        }
      }

      const followRef = doc(db, USER_COLLECTIONS.FOLLOWS, followId)
      batch.set(followRef, followData)

      // Update follower counts (only if accepted immediately)
      if (followData.status === 'accepted') {
        const followerRef = doc(db, USER_COLLECTIONS.PROFILES, followerId)
        const followingRef = doc(db, USER_COLLECTIONS.PROFILES, followingId)
        
        batch.update(followerRef, {
          "stats.followingCount": increment(1)
        })
        batch.update(followingRef, {
          "stats.followersCount": increment(1)
        })

        // Create notification for new follower
        await this.createNotification({
          userId: followingId,
          type: 'new_follower',
          fromUserId: followerId,
          fromUsername: followerProfile.username,
          fromDisplayName: followerProfile.displayName,
          fromAvatarUrl: followerProfile.avatarUrl
        })

        // Create activity
        await this.createActivity({
          userId: followerId,
          type: 'follow',
          data: {
            targetUserId: followingId,
            targetUsername: followingProfile.username
          }
        })
      } else {
        // Create notification for follow request
        await this.createNotification({
          userId: followingId,
          type: 'follow_request',
          fromUserId: followerId,
          fromUsername: followerProfile.username,
          fromDisplayName: followerProfile.displayName,
          fromAvatarUrl: followerProfile.avatarUrl
        })
      }

      await batch.commit()
    } catch (error) {
      console.error("Error following user:", error)
      throw error
    }
  }

  static async unfollowUser(followerId: string, followingId: string): Promise<void> {
    try {
      const batch = writeBatch(db)
      const followId = `${followerId}_${followingId}`
      
      // Get the follow relationship
      const followRef = doc(db, USER_COLLECTIONS.FOLLOWS, followId)
      const followDoc = await getDoc(followRef)
      
      if (!followDoc.exists()) {
        throw new Error("Follow relationship not found")
      }

      const followData = followDoc.data() as UserFollow

      // Delete follow relationship
      batch.delete(followRef)

      // Update follower counts (only if was accepted)
      if (followData.status === 'accepted') {
        const followerRef = doc(db, USER_COLLECTIONS.PROFILES, followerId)
        const followingRef = doc(db, USER_COLLECTIONS.PROFILES, followingId)
        
        batch.update(followerRef, {
          "stats.followingCount": increment(-1)
        })
        batch.update(followingRef, {
          "stats.followersCount": increment(-1)
        })
      }

      await batch.commit()
    } catch (error) {
      console.error("Error unfollowing user:", error)
      throw error
    }
  }

  static async acceptFollowRequest(followingId: string, followerId: string): Promise<void> {
    try {
      const batch = writeBatch(db)
      const followId = `${followerId}_${followingId}`
      
      // Update follow status
      const followRef = doc(db, USER_COLLECTIONS.FOLLOWS, followId)
      batch.update(followRef, { status: 'accepted' })

      // Update follower counts
      const followerRef = doc(db, USER_COLLECTIONS.PROFILES, followerId)
      const followingRef = doc(db, USER_COLLECTIONS.PROFILES, followingId)
      
      batch.update(followerRef, {
        "stats.followingCount": increment(1)
      })
      batch.update(followingRef, {
        "stats.followersCount": increment(1)
      })

      await batch.commit()

      // Create notification
      const followerProfile = await this.getUserProfile(followerId)
      if (followerProfile) {
        await this.createNotification({
          userId: followerId,
          type: 'follow_accepted',
          fromUserId: followingId,
          fromUsername: (await this.getUserProfile(followingId))?.username || '',
          fromDisplayName: (await this.getUserProfile(followingId))?.displayName || '',
          fromAvatarUrl: (await this.getUserProfile(followingId))?.avatarUrl || ''
        })
      }
    } catch (error) {
      console.error("Error accepting follow request:", error)
      throw error
    }
  }

  // Get follow relationship
  static async getFollowRelationship(followerId: string, followingId: string): Promise<UserFollow | null> {
    try {
      const followId = `${followerId}_${followingId}`
      const docRef = doc(db, USER_COLLECTIONS.FOLLOWS, followId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return docSnap.data() as UserFollow
      }
      return null
    } catch (error) {
      console.error("Error getting follow relationship:", error)
      throw error
    }
  }

  // Get user's followers
  static async getUserFollowers(userId: string, lastDoc?: QueryDocumentSnapshot): Promise<UserFollow[]> {
    try {
      let followersQuery = query(
        collection(db, USER_COLLECTIONS.FOLLOWS),
        where("followingId", "==", userId),
        where("status", "==", "accepted"),
        orderBy("createdAt", "desc"),
        limit(20)
      )

      if (lastDoc) {
        followersQuery = query(followersQuery, startAfter(lastDoc))
      }

      const querySnapshot = await getDocs(followersQuery)
      return querySnapshot.docs.map(doc => doc.data() as UserFollow)
    } catch (error) {
      console.error("Error getting user followers:", error)
      throw error
    }
  }

  // Get user's following
  static async getUserFollowing(userId: string, lastDoc?: QueryDocumentSnapshot): Promise<UserFollow[]> {
    try {
      let followingQuery = query(
        collection(db, USER_COLLECTIONS.FOLLOWS),
        where("followerId", "==", userId),
        where("status", "==", "accepted"),
        orderBy("createdAt", "desc"),
        limit(20)
      )

      if (lastDoc) {
        followingQuery = query(followingQuery, startAfter(lastDoc))
      }

      const querySnapshot = await getDocs(followingQuery)
      return querySnapshot.docs.map(doc => doc.data() as UserFollow)
    } catch (error) {
      console.error("Error getting user following:", error)
      throw error
    }
  }

  // Block/Report functionality
  static async blockUser(blockerId: string, blockedId: string, reason?: string): Promise<void> {
    try {
      const batch = writeBatch(db)
      const blockId = `${blockerId}_${blockedId}`
      
      const blockData: UserBlock = {
        id: blockId,
        blockerId,
        blockedId,
        reason,
        createdAt: Timestamp.now()
      }

      const blockRef = doc(db, USER_COLLECTIONS.BLOCKS, blockId)
      batch.set(blockRef, blockData)

      // Remove any existing follow relationships
      const followRef1 = doc(db, USER_COLLECTIONS.FOLLOWS, `${blockerId}_${blockedId}`)
      const followRef2 = doc(db, USER_COLLECTIONS.FOLLOWS, `${blockedId}_${blockerId}`)
      batch.delete(followRef1)
      batch.delete(followRef2)

      await batch.commit()
    } catch (error) {
      console.error("Error blocking user:", error)
      throw error
    }
  }

  static async isUserBlocked(userId: string, potentialBlockerId: string): Promise<boolean> {
    try {
      const blockId = `${potentialBlockerId}_${userId}`
      const docRef = doc(db, USER_COLLECTIONS.BLOCKS, blockId)
      const docSnap = await getDoc(docRef)
      return docSnap.exists()
    } catch (error) {
      console.error("Error checking if user is blocked:", error)
      return false
    }
  }

  // Search index management
  static async updateSearchIndex(userId: string): Promise<void> {
    try {
      const profile = await this.getUserProfile(userId)
      if (!profile) return

      const searchTerms = [
        ...profile.username.toLowerCase().split(""),
        ...profile.displayName.toLowerCase().split(" "),
        ...profile.bio.toLowerCase().split(" "),
        ...profile.tags.map(tag => tag.toLowerCase()),
        profile.location.toLowerCase()
      ].filter(term => term.length > 0)

      const searchIndex: UserSearchIndex = {
        uid: profile.uid,
        username: profile.username,
        displayName: profile.displayName,
        bio: profile.bio,
        tags: profile.tags,
        location: profile.location,
        isPublic: profile.isPublic,
        isVerified: profile.isVerified || false,
        searchable: profile.searchable,
        featured: profile.featured,
        lastActive: profile.lastActive ? Timestamp.fromDate(new Date(profile.lastActive)) : Timestamp.now(),
        followersCount: profile.stats.followersCount,
        joinDate: Timestamp.fromDate(new Date(profile.joinDate)),
        searchTerms,
        searchScore: this.calculateSearchScore(profile)
      }

      const docRef = doc(db, USER_COLLECTIONS.SEARCH_INDEX, userId)
      await setDoc(docRef, searchIndex)
    } catch (error) {
      console.error("Error updating search index:", error)
      throw error
    }
  }

  private static calculateSearchScore(profile: UserProfile): number {
    let score = 0
    
    // Base score
    score += 10
    
    // Verified users get boost
    if (profile.isVerified) score += 50
    
    // Featured users get boost  
    if (profile.featured) score += 30
    
    // Follower count boost (logarithmic)
    score += Math.log10(profile.stats.followersCount + 1) * 10
    
    // Activity boost
    score += profile.stats.postsCount * 0.1
    score += profile.stats.reviewsCount * 0.5
    
    // Complete profile boost
    if (profile.bio.length > 50) score += 5
    if (profile.avatarUrl) score += 5
    if (profile.coverImageUrl) score += 3
    if (Object.keys(profile.socialLinks).length > 0) score += 3
    
    return Math.round(score)
  }

  // Activity management
  static async createActivity(activityData: Omit<UserActivity, 'id' | 'timestamp'>): Promise<void> {
    try {
      const activity: UserActivity = {
        ...activityData,
        id: doc(collection(db, USER_COLLECTIONS.ACTIVITIES)).id,
        timestamp: Timestamp.now()
      }

      const docRef = doc(db, USER_COLLECTIONS.ACTIVITIES, activity.id)
      await setDoc(docRef, activity)
    } catch (error) {
      console.error("Error creating activity:", error)
      throw error
    }
  }

  // Notification management
  static async createNotification(notificationData: Omit<UserNotification, 'id' | 'isRead' | 'createdAt'>): Promise<void> {
    try {
      const notification: UserNotification = {
        ...notificationData,
        id: doc(collection(db, USER_COLLECTIONS.NOTIFICATIONS)).id,
        isRead: false,
        createdAt: Timestamp.now()
      }

      const docRef = doc(db, USER_COLLECTIONS.NOTIFICATIONS, notification.id)
      await setDoc(docRef, notification)
    } catch (error) {
      console.error("Error creating notification:", error)
      throw error
    }
  }

  // Get user recommendations
  static async getUserRecommendations(userId: string): Promise<UserRecommendation[]> {
    try {
      const recsQuery = query(
        collection(db, USER_COLLECTIONS.RECOMMENDATIONS),
        where("userId", "==", userId),
        where("dismissed", "!=", true),
        where("followed", "!=", true),
        orderBy("score", "desc"),
        limit(10)
      )

      const querySnapshot = await getDocs(recsQuery)
      return querySnapshot.docs.map(doc => doc.data() as UserRecommendation)
    } catch (error) {
      console.error("Error getting user recommendations:", error)
      throw error
    }
  }
}
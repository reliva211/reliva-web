# Avatar Profile Mapping Solution

## Problem

Users were experiencing "Profile Unavailable" errors when clicking on avatars in posts and comments. This was happening because:

1. **Firebase UID** is used for Firestore user profiles in the `userProfiles` collection
2. **MongoDB authorId** is used for posts and comments, stored in MongoDB
3. Avatar links were using `authorId` (MongoDB ID) but the profile page expected Firebase UID

## Solution

### 1. Created User Mapping Utility (`lib/user-mapping.ts`)

- `mapAuthorIdToFirebaseUID()`: Maps MongoDB authorId to Firebase UID
- `mapFirebaseUIDToAuthorId()`: Maps Firebase UID to MongoDB authorId
- `identifyIdType()`: Determines if an ID is Firebase UID or MongoDB authorId

### 2. Updated Profile Page (`app/users/[id]/page.tsx`)

- Added logic to detect ID type (Firebase UID vs MongoDB authorId)
- Automatically maps MongoDB authorId to Firebase UID when needed
- Uses the correct Firebase UID for profile lookups and section components

### 3. Fixed Posts Profile Fetching (`app/reviews/page.tsx`)

- Updated `fetchUserProfile` function to properly map authorId to Firebase UID
- Now correctly fetches user profile pictures from the `userProfiles` collection
- Posts and comments now display the correct user avatars

### 4. Fixed API Route (`app/api/users/[id]/route.ts`)

- Updated API route to handle both Firebase UID and MongoDB authorId
- Ensures consistent user profile data regardless of ID type used

### 5. Avatar Components

- `OtherUserAvatar`: Links to `/users/${authorId}` (MongoDB ID)
- `UserAvatar`: Links to `/users/${userId}` (Firebase UID)
- Both now work correctly with the updated profile page

## How It Works

1. User clicks on avatar in post/comment
2. Link navigates to `/users/${authorId}` (MongoDB ID)
3. Profile page detects ID type using `identifyIdType()`
4. If MongoDB ID, maps to Firebase UID using `mapAuthorIdToFirebaseUID()`
5. Profile page loads using Firebase UID from `userProfiles` collection
6. Profile sections use the correct Firebase UID

## Testing

The solution includes:

- Unit tests for ID type identification
- Proper error handling for missing mappings
- Fallback behavior for invalid IDs

## Files Modified

- `lib/user-mapping.ts` (new)
- `app/users/[id]/page.tsx` (updated)
- `app/reviews/page.tsx` (updated - fixed fetchUserProfile function)
- `app/api/users/[id]/route.ts` (updated - fixed API route)
- `lib/__tests__/user-mapping.test.ts` (new)
- `docs/avatar-profile-mapping.md` (new)

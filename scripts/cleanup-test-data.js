const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, updateDoc, collection, getDocs } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanupTestData() {
  try {
    console.log('Starting cleanup of test data...');
    
    // Get all users
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);
    
    let cleanedCount = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      // Check if this is a test user (has hardcoded test IDs)
      const isTestUser = userId.startsWith('test_user_') || 
                        userId === 'user1' || 
                        userId === 'user2' || 
                        userId === 'user3' ||
                        userId === 'current_user_id';
      
      if (isTestUser) {
        console.log(`Removing test user: ${userId}`);
        // Delete the test user document
        await updateDoc(doc(db, "users", userId), {
          followers: [],
          following: []
        });
        cleanedCount++;
        continue;
      }
      
      // Clean up following list - remove any non-existent user IDs
      if (userData.following && Array.isArray(userData.following)) {
        const validFollowing = [];
        for (const followingId of userData.following) {
          // Check if the followed user actually exists
          const followedUserDoc = await getDoc(doc(db, "users", followingId));
          if (followedUserDoc.exists() && !followedUserDoc.id.startsWith('test_user_')) {
            validFollowing.push(followingId);
          } else {
            console.log(`Removing invalid following relationship: ${userId} -> ${followingId}`);
          }
        }
        
        // Update user with cleaned following list
        if (validFollowing.length !== userData.following.length) {
          await updateDoc(doc(db, "users", userId), {
            following: validFollowing
          });
          cleanedCount++;
        }
      }
      
      // Clean up followers list - remove any non-existent user IDs
      if (userData.followers && Array.isArray(userData.followers)) {
        const validFollowers = [];
        for (const followerId of userData.followers) {
          // Check if the follower user actually exists
          const followerUserDoc = await getDoc(doc(db, "users", followerId));
          if (followerUserDoc.exists() && !followerUserDoc.id.startsWith('test_user_')) {
            validFollowers.push(followerId);
          } else {
            console.log(`Removing invalid follower relationship: ${followerId} -> ${userId}`);
          }
        }
        
        // Update user with cleaned followers list
        if (validFollowers.length !== userData.followers.length) {
          await updateDoc(doc(db, "users", userId), {
            followers: validFollowers
          });
          cleanedCount++;
        }
      }
    }
    
    console.log(`Cleanup completed! Cleaned ${cleanedCount} user documents.`);
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Run the cleanup
cleanupTestData();

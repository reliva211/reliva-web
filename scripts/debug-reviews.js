const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, doc, getDoc } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
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

async function debugReviews() {
  try {
    console.log('🔍 Debugging reviews collection...\n');

    // Get all reviews
    const reviewsRef = collection(db, "reviews");
    const reviewsSnapshot = await getDocs(reviewsRef);
    
    console.log(`📊 Total reviews in collection: ${reviewsSnapshot.size}\n`);

    if (reviewsSnapshot.size === 0) {
      console.log('❌ No reviews found in the collection!');
      return;
    }

    // Check first few reviews
    let count = 0;
    reviewsSnapshot.forEach((doc) => {
      if (count < 3) {
        const data = doc.data();
        console.log(`📝 Review ${count + 1}:`);
        console.log(`   ID: ${doc.id}`);
        console.log(`   User ID: ${data.userId || 'MISSING'}`);
        console.log(`   User Display Name: ${data.userDisplayName || 'MISSING'}`);
        console.log(`   Media Title: ${data.mediaTitle || 'MISSING'}`);
        console.log(`   Media Type: ${data.mediaType || 'MISSING'}`);
        console.log(`   Timestamp: ${data.timestamp ? JSON.stringify(data.timestamp) : 'MISSING'}`);
        console.log(`   Rating: ${data.rating || 'MISSING'}`);
        console.log(`   Review Text: ${data.reviewText ? data.reviewText.substring(0, 50) + '...' : 'MISSING'}`);
        console.log('');
        count++;
      }
    });

    // Check users collection
    console.log('👥 Checking users collection...\n');
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);
    
    console.log(`📊 Total users in collection: ${usersSnapshot.size}\n`);

    if (usersSnapshot.size === 0) {
      console.log('❌ No users found in the collection!');
      return;
    }

    // Check first few users
    count = 0;
    usersSnapshot.forEach((doc) => {
      if (count < 3) {
        const data = doc.data();
        console.log(`👤 User ${count + 1}:`);
        console.log(`   ID: ${doc.id}`);
        console.log(`   Email: ${data.email || 'MISSING'}`);
        console.log(`   Username: ${data.username || 'MISSING'}`);
        console.log(`   Full Name: ${data.fullName || 'MISSING'}`);
        console.log(`   Followers: ${data.followers ? data.followers.length : 0}`);
        console.log(`   Following: ${data.following ? data.following.length : 0}`);
        if (data.following && data.following.length > 0) {
          console.log(`   Following IDs: ${data.following.join(', ')}`);
        }
        console.log('');
        count++;
      }
    });

    // Test a specific user query
    console.log('🔍 Testing specific user query...\n');
    
    // Get the first user with reviews
    const firstReview = reviewsSnapshot.docs[0];
    const firstReviewData = firstReview.data();
    const firstUserId = firstReviewData.userId;
    
    if (firstUserId) {
      console.log(`Testing query for user: ${firstUserId}`);
      
      const userQuery = query(
        collection(db, "reviews"),
        where("userId", "==", firstUserId)
      );
      
      const userReviewsSnapshot = await getDocs(userQuery);
      console.log(`Found ${userReviewsSnapshot.size} reviews for user ${firstUserId}`);
      
      if (userReviewsSnapshot.size > 0) {
        const userReview = userReviewsSnapshot.docs[0].data();
        console.log('Sample review data:');
        console.log(JSON.stringify(userReview, null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Error during debugging:', error);
  }
}

// Run the debug script
debugReviews(); 
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, setDoc, doc } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
  // Add your Firebase config here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testRecommendations() {
  try {
    console.log('Testing recommendations functionality...');

    // Test 1: Check if users exist
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);
    console.log(`Found ${usersSnapshot.docs.length} users in database`);

    // Test 2: Check each user's collections
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      console.log(`\nUser: ${userData.displayName || userData.name || userData.email || userId}`);

      // Check movies
      const moviesRef = collection(db, "users", userId, "movies");
      const moviesSnapshot = await getDocs(moviesRef);
      console.log(`  Movies: ${moviesSnapshot.docs.length}`);

      // Check books
      const booksRef = collection(db, "users", userId, "books");
      const booksSnapshot = await getDocs(booksRef);
      console.log(`  Books: ${booksSnapshot.docs.length}`);

      // Check series
      const seriesRef = collection(db, "users", userId, "series");
      const seriesSnapshot = await getDocs(seriesRef);
      console.log(`  Series: ${seriesSnapshot.docs.length}`);

      // Show sample items
      if (moviesSnapshot.docs.length > 0) {
        const sampleMovie = moviesSnapshot.docs[0].data();
        console.log(`    Sample movie: ${sampleMovie.title}`);
      }
      if (booksSnapshot.docs.length > 0) {
        const sampleBook = booksSnapshot.docs[0].data();
        console.log(`    Sample book: ${sampleBook.title} by ${sampleBook.author}`);
      }
      if (seriesSnapshot.docs.length > 0) {
        const sampleSeries = seriesSnapshot.docs[0].data();
        console.log(`    Sample series: ${sampleSeries.title}`);
      }
    }

    console.log('\nRecommendations test completed!');
  } catch (error) {
    console.error('Error testing recommendations:', error);
  }
}

// Run the test
testRecommendations(); 
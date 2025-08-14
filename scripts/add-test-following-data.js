const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, collection, addDoc, serverTimestamp } = require('firebase/firestore');

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

// Test users data
const testUsers = [
  {
    uid: "test_user_1",
    email: "sarah.chen@test.com",
    username: "sarahreads",
    fullName: "Sarah Chen",
    followers: ["current_user_id"], // This user follows the current user
    following: ["test_user_2", "test_user_3"],
    createdAt: new Date()
  },
  {
    uid: "test_user_2", 
    email: "marcus.johnson@test.com",
    username: "musicmarc",
    fullName: "Marcus Johnson",
    followers: ["test_user_1", "current_user_id"],
    following: ["test_user_1"],
    createdAt: new Date()
  },
  {
    uid: "test_user_3",
    email: "emma.rodriguez@test.com", 
    username: "cinemaemma",
    fullName: "Emma Rodriguez",
    followers: ["test_user_1", "current_user_id"],
    following: ["test_user_1"],
    createdAt: new Date()
  }
];

// Test reviews data
const testReviews = [
  {
    userId: "test_user_1",
    userDisplayName: "Sarah Chen",
    userEmail: "sarah.chen@test.com",
    mediaId: "123",
    mediaTitle: "The Seven Husbands of Evelyn Hugo",
    mediaCover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=450&fit=crop",
    mediaType: "book",
    mediaYear: 2017,
    mediaAuthor: "Taylor Jenkins Reid",
    rating: 5,
    reviewText: "Just finished 'The Seven Husbands of Evelyn Hugo' and I'm absolutely speechless! The storytelling is phenomenal and the characters feel so real. The way the author weaves together the past and present is masterful. This book completely captivated me from start to finish.",
    timestamp: serverTimestamp(),
    likes: [],
    comments: []
  },
  {
    userId: "test_user_2",
    userDisplayName: "Marcus Johnson", 
    userEmail: "marcus.johnson@test.com",
    mediaId: "456",
    mediaTitle: "Midnight Reverie",
    mediaCover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
    mediaType: "music",
    mediaYear: 2023,
    mediaAuthor: "Lunar Echoes",
    rating: 4,
    reviewText: "Discovered this incredible indie band called 'Lunar Echoes' today. Their album 'Midnight Reverie' is pure magic - perfect blend of dreamy synths and haunting vocals. The production quality is outstanding and the lyrics are deeply poetic.",
    timestamp: serverTimestamp(),
    likes: [],
    comments: []
  },
  {
    userId: "test_user_3",
    userDisplayName: "Emma Rodriguez",
    userEmail: "emma.rodriguez@test.com", 
    mediaId: "789",
    mediaTitle: "Parasite",
    mediaCover: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=450&fit=crop",
    mediaType: "movie",
    mediaYear: 2019,
    mediaAuthor: null,
    rating: 5,
    reviewText: "Rewatched 'Parasite' last night and noticed so many details I missed the first time. Bong Joon-ho's direction is masterful - every frame tells a story. The social commentary is sharp and the performances are incredible. A true masterpiece.",
    timestamp: serverTimestamp(),
    likes: [],
    comments: []
  },
  {
    userId: "test_user_1",
    userDisplayName: "Sarah Chen",
    userEmail: "sarah.chen@test.com",
    mediaId: "101",
    mediaTitle: "Normal People",
    mediaCover: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=450&fit=crop", 
    mediaType: "book",
    mediaYear: 2018,
    mediaAuthor: "Sally Rooney",
    rating: 4,
    reviewText: "Sally Rooney's 'Normal People' is a beautifully written exploration of young love and class dynamics. The characters are so well-developed and the prose is stunning. It's a book that stays with you long after you finish it.",
    timestamp: serverTimestamp(),
    likes: [],
    comments: []
  },
  {
    userId: "test_user_2",
    userDisplayName: "Marcus Johnson",
    userEmail: "marcus.johnson@test.com", 
    mediaId: "202",
    mediaTitle: "Blonde",
    mediaCover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop",
    mediaType: "music",
    mediaYear: 2022,
    mediaAuthor: "Frank Ocean",
    rating: 5,
    reviewText: "Frank Ocean's 'Blonde' is a masterpiece of modern R&B. The production is innovative, the lyrics are deeply personal, and the overall atmosphere is hauntingly beautiful. This album changed the way I think about music.",
    timestamp: serverTimestamp(),
    likes: [],
    comments: []
  }
];

async function addTestData() {
  try {
    console.log('Adding test users...');
    
    // Add test users
    for (const user of testUsers) {
      await setDoc(doc(db, 'users', user.uid), user);
      console.log(`Added user: ${user.fullName}`);
    }

    console.log('Adding test reviews...');
    
    // Add test reviews
    for (const review of testReviews) {
      await addDoc(collection(db, 'reviews'), review);
      console.log(`Added review: ${review.mediaTitle} by ${review.userDisplayName}`);
    }

    console.log('Test data added successfully!');
    console.log('\nTo test the following system:');
    console.log('1. Sign up with a new account');
    console.log('2. Go to /users to find and follow the test users');
    console.log('3. Check your home page to see reviews from people you follow');
    
  } catch (error) {
    console.error('Error adding test data:', error);
  }
}

// Run the script
addTestData(); 
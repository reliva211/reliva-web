const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, collection, addDoc } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBvOkR3lXh8UzqKJqJqJqJqJqJqJqJqJq",
  authDomain: "reliva-web.firebaseapp.com",
  projectId: "reliva-web",
  storageBucket: "reliva-web.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Test user ID - replace with actual user ID
const TEST_USER_ID = "test-user-123";

// Sample movies data
const sampleMovies = [
  {
    id: "603",
    title: "The Matrix",
    year: 1999,
    cover: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    rating: 4.8,
    status: "watched",
    notes: "Mind-bending sci-fi classic",
    collections: ["watched", "top5", "sci-fi"],
    overview: "A computer programmer discovers a mysterious world.",
    release_date: "1999-03-31"
  },
  {
    id: "27205",
    title: "Inception",
    year: 2010,
    cover: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    rating: 4.5,
    status: "watched",
    notes: "Dreams within dreams",
    collections: ["watched", "top5", "sci-fi"],
    overview: "A thief who steals corporate secrets through dream-sharing technology.",
    release_date: "2010-07-16"
  },
  {
    id: "157336",
    title: "Interstellar",
    year: 2014,
    cover: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    rating: 4.7,
    status: "watched",
    notes: "Space exploration epic",
    collections: ["watched", "top5", "sci-fi"],
    overview: "A team of explorers travel through a wormhole in space.",
    release_date: "2014-11-07"
  },
  {
    id: "155",
    title: "The Dark Knight",
    year: 2008,
    cover: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    rating: 4.9,
    status: "watched",
    notes: "Heath Ledger's iconic performance",
    collections: ["watched", "top5", "action"],
    overview: "Batman faces his greatest challenge yet.",
    release_date: "2008-07-18"
  },
  {
    id: "680",
    title: "Pulp Fiction",
    year: 1994,
    cover: "https://image.tmdb.org/t/p/w500/fIE3lAGcZDV1G6XM5KmuWnNsPp1.jpg",
    rating: 4.6,
    status: "watched",
    notes: "Tarantino masterpiece",
    collections: ["watched", "top5", "crime"],
    overview: "Various interconnected stories of criminals in Los Angeles.",
    release_date: "1994-10-14"
  }
];

// Sample series data
const sampleSeries = [
  {
    id: "1396",
    title: "Breaking Bad",
    year: 2008,
    cover: "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
    rating: 4.9,
    status: "watched",
    notes: "Walter White's transformation",
    collections: ["watched", "top5", "drama"],
    overview: "A high school chemistry teacher turned methamphetamine manufacturer.",
    first_air_date: "2008-01-20",
    number_of_seasons: 5,
    number_of_episodes: 62
  },
  {
    id: "1399",
    title: "Game of Thrones",
    year: 2011,
    cover: "https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
    rating: 4.8,
    status: "watched",
    notes: "Epic fantasy series",
    collections: ["watched", "top5", "fantasy"],
    overview: "Nine noble families fight for control over the lands of Westeros.",
    first_air_date: "2011-04-17",
    number_of_seasons: 8,
    number_of_episodes: 73
  },
  {
    id: "1398",
    title: "Stranger Things",
    year: 2016,
    cover: "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
    rating: 4.6,
    status: "watching",
    notes: "Currently watching season 4",
    collections: ["watching", "sci-fi"],
    overview: "When a young boy disappears, his mother must confront terrifying forces.",
    first_air_date: "2016-07-15",
    number_of_seasons: 4,
    number_of_episodes: 34
  },
  {
    id: "1397",
    title: "The Office",
    year: 2005,
    cover: "https://image.tmdb.org/t/p/w500/qWnJzyZhyy74gjpSjIXWmuk0ifX.jpg",
    rating: 4.7,
    status: "watched",
    notes: "Hilarious workplace comedy",
    collections: ["watched", "comedy"],
    overview: "A mockumentary on a group of typical office workers.",
    first_air_date: "2005-03-24",
    number_of_seasons: 9,
    number_of_episodes: 201
  },
  {
    id: "1395",
    title: "Friends",
    year: 1994,
    cover: "https://image.tmdb.org/t/p/w500/f496cm9enuEsZkSPzCwnTESEK5s.jpg",
    rating: 4.5,
    status: "watched",
    notes: "Classic sitcom",
    collections: ["watched", "comedy"],
    overview: "Follows the personal and professional lives of six friends.",
    first_air_date: "1994-09-22",
    number_of_seasons: 10,
    number_of_episodes: 236
  }
];

// Sample books data
const sampleBooks = [
  {
    id: "book1",
    title: "The Seven Husbands of Evelyn Hugo",
    author: "Taylor Jenkins Reid",
    year: 2017,
    cover: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1674739970i/32620332.jpg",
    rating: 4.5,
    status: "reading",
    notes: "Currently reading",
    collections: ["reading", "fiction"],
    overview: "Aging and reclusive Hollywood movie icon Evelyn Hugo.",
    publishedDate: "2017-06-13",
    pageCount: 400
  },
  {
    id: "book2",
    title: "The Midnight Library",
    author: "Matt Haig",
    year: 2020,
    cover: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1602190253i/52578297.jpg",
    rating: 4.3,
    status: "read",
    notes: "Thought-provoking read",
    collections: ["read", "fiction"],
    overview: "Between life and death there is a library.",
    publishedDate: "2020-08-13",
    pageCount: 288
  },
  {
    id: "book3",
    title: "Atomic Habits",
    author: "James Clear",
    year: 2018,
    cover: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1655988385i/40121378.jpg",
    rating: 4.8,
    status: "read",
    notes: "Life-changing book",
    collections: ["read", "self-help"],
    overview: "An easy and proven way to build good habits and break bad ones.",
    publishedDate: "2018-10-16",
    pageCount: 320
  },
  {
    id: "book4",
    title: "The Lincoln Highway",
    author: "Amor Towles",
    year: 2021,
    cover: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1634158558i/58819501.jpg",
    rating: 4.4,
    status: "to-read",
    notes: "On my reading list",
    collections: ["to-read", "fiction"],
    overview: "A journey across 1950s America.",
    publishedDate: "2021-10-05",
    pageCount: 592
  },
  {
    id: "book5",
    title: "Cloud Cuckoo Land",
    author: "Anthony Doerr",
    year: 2021,
    cover: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1634158558i/56707975.jpg",
    rating: 4.2,
    status: "read",
    notes: "Beautiful storytelling",
    collections: ["read", "fiction"],
    overview: "A story about children on the cusp of adulthood.",
    publishedDate: "2021-09-28",
    pageCount: 640
  }
];

// Sample collections data
const sampleCollections = {
  movies: [
    { name: "Watched", isPublic: true, isDefault: true, color: "bg-green-500" },
    { name: "Top 5", isPublic: true, isDefault: true, color: "bg-blue-500" },
    { name: "Watchlist", isPublic: true, isDefault: true, color: "bg-purple-500" },
    { name: "Sci-Fi", isPublic: true, isDefault: false, color: "bg-indigo-500" },
    { name: "Action", isPublic: true, isDefault: false, color: "bg-red-500" },
    { name: "Crime", isPublic: true, isDefault: false, color: "bg-gray-500" }
  ],
  series: [
    { name: "Watched", isPublic: true, isDefault: true, color: "bg-green-500" },
    { name: "Top 5", isPublic: true, isDefault: true, color: "bg-blue-500" },
    { name: "Watching", isPublic: true, isDefault: true, color: "bg-yellow-500" },
    { name: "Drama", isPublic: true, isDefault: false, color: "bg-indigo-500" },
    { name: "Fantasy", isPublic: true, isDefault: false, color: "bg-purple-500" },
    { name: "Comedy", isPublic: true, isDefault: false, color: "bg-pink-500" }
  ],
  books: [
    { name: "All Books", isPublic: true, isDefault: true, color: "bg-blue-500" },
    { name: "Read", isPublic: true, isDefault: true, color: "bg-green-500" },
    { name: "Reading", isPublic: true, isDefault: true, color: "bg-yellow-500" },
    { name: "To Read", isPublic: true, isDefault: true, color: "bg-purple-500" },
    { name: "Fiction", isPublic: true, isDefault: false, color: "bg-indigo-500" },
    { name: "Self-Help", isPublic: true, isDefault: false, color: "bg-orange-500" }
  ]
};

async function addTestData() {
  try {
    console.log('Adding test data for user:', TEST_USER_ID);

    // Add movie collections
    console.log('Adding movie collections...');
    const movieCollectionsRef = collection(db, "users", TEST_USER_ID, "movieCollections");
    const movieCollectionIds = {};
    
    for (const collectionData of sampleCollections.movies) {
      const docRef = await addDoc(movieCollectionsRef, collectionData);
      movieCollectionIds[collectionData.name] = docRef.id;
      console.log(`Added movie collection: ${collectionData.name} (${docRef.id})`);
    }

    // Add series collections
    console.log('Adding series collections...');
    const seriesCollectionsRef = collection(db, "users", TEST_USER_ID, "seriesCollections");
    const seriesCollectionIds = {};
    
    for (const collectionData of sampleCollections.series) {
      const docRef = await addDoc(seriesCollectionsRef, collectionData);
      seriesCollectionIds[collectionData.name] = docRef.id;
      console.log(`Added series collection: ${collectionData.name} (${docRef.id})`);
    }

    // Add book collections
    console.log('Adding book collections...');
    const bookCollectionsRef = collection(db, "users", TEST_USER_ID, "collections");
    const bookCollectionIds = {};
    
    for (const collectionData of sampleCollections.books) {
      const docRef = await addDoc(bookCollectionsRef, collectionData);
      bookCollectionIds[collectionData.name] = docRef.id;
      console.log(`Added book collection: ${collectionData.name} (${docRef.id})`);
    }

    // Add movies
    console.log('Adding movies...');
    for (const movie of sampleMovies) {
      // Convert collection names to IDs
      const collectionIds = movie.collections.map(name => movieCollectionIds[name]).filter(Boolean);
      const movieData = { ...movie, collections: collectionIds };
      
      await setDoc(doc(db, "users", TEST_USER_ID, "movies", movie.id), movieData);
      console.log(`Added movie: ${movie.title}`);
    }

    // Add series
    console.log('Adding series...');
    for (const series of sampleSeries) {
      // Convert collection names to IDs
      const collectionIds = series.collections.map(name => seriesCollectionIds[name]).filter(Boolean);
      const seriesData = { ...series, collections: collectionIds };
      
      await setDoc(doc(db, "users", TEST_USER_ID, "series", series.id), seriesData);
      console.log(`Added series: ${series.title}`);
    }

    // Add books
    console.log('Adding books...');
    for (const book of sampleBooks) {
      // Convert collection names to IDs
      const collectionIds = book.collections.map(name => bookCollectionIds[name]).filter(Boolean);
      const bookData = { ...book, collections: collectionIds };
      
      await setDoc(doc(db, "users", TEST_USER_ID, "books", book.id), bookData);
      console.log(`Added book: ${book.title}`);
    }

    console.log('Test data added successfully!');
    console.log('\nCollection IDs for reference:');
    console.log('Movie Collections:', movieCollectionIds);
    console.log('Series Collections:', seriesCollectionIds);
    console.log('Book Collections:', bookCollectionIds);

  } catch (error) {
    console.error('Error adding test data:', error);
  }
}

// Run the script
addTestData(); 
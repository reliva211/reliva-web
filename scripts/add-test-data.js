const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, setDoc, doc } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
  // Add your Firebase config here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample users
const sampleUsers = [
  {
    uid: 'user1',
    displayName: 'John Doe',
    email: 'john@example.com',
    photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  },
  {
    uid: 'user2',
    displayName: 'Jane Smith',
    email: 'jane@example.com',
    photoURL: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
  },
  {
    uid: 'user3',
    displayName: 'Mike Johnson',
    email: 'mike@example.com',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  }
];

// Sample movies
const sampleMovies = [
  {
    id: 1,
    title: 'Inception',
    year: 2010,
    cover: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
    status: 'Watched',
    rating: 8.8,
    notes: 'Amazing concept and execution'
  },
  {
    id: 2,
    title: 'The Dark Knight',
    year: 2008,
    cover: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    status: 'Watched',
    rating: 9.0,
    notes: 'Masterpiece'
  },
  {
    id: 3,
    title: 'Interstellar',
    year: 2014,
    cover: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    status: 'Watchlist',
    rating: 8.6,
    notes: 'Need to watch this'
  }
];

// Sample books
const sampleBooks = [
  {
    id: 'book1',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    year: 1925,
    cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1490528560i/4671.jpg',
    status: 'Completed',
    notes: 'Classic American literature'
  },
  {
    id: 'book2',
    title: '1984',
    author: 'George Orwell',
    year: 1949,
    cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1532714506i/40961427.jpg',
    status: 'Reading',
    notes: 'Disturbing but important'
  },
  {
    id: 'book3',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    year: 1960,
    cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1553383690i/2657.jpg',
    status: 'To Read',
    notes: 'Recommended by many'
  }
];

// Sample series
const sampleSeries = [
  {
    id: 1,
    title: 'Breaking Bad',
    year: 2008,
    cover: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    status: 'Completed',
    rating: 9.5,
    notes: 'One of the best series ever'
  },
  {
    id: 2,
    title: 'Game of Thrones',
    year: 2011,
    cover: 'https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg',
    status: 'Watching',
    rating: 9.3,
    notes: 'Epic fantasy'
  },
  {
    id: 3,
    title: 'Stranger Things',
    year: 2016,
    cover: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    status: 'Watchlist',
    rating: 8.7,
    notes: 'Heard great things about this'
  }
];

async function addTestData() {
  try {
    console.log('Adding test data...');

    // Add users
    for (const user of sampleUsers) {
      await setDoc(doc(db, 'users', user.uid), user);
      console.log(`Added user: ${user.displayName}`);
    }

    // Add movies for each user
    for (const user of sampleUsers) {
      for (const movie of sampleMovies) {
        await setDoc(doc(db, 'users', user.uid, 'movies', movie.id.toString()), movie);
      }
      console.log(`Added movies for ${user.displayName}`);
    }

    // Add books for each user
    for (const user of sampleUsers) {
      for (const book of sampleBooks) {
        await setDoc(doc(db, 'users', user.uid, 'books', book.id), book);
      }
      console.log(`Added books for ${user.displayName}`);
    }

    // Add series for each user
    for (const user of sampleUsers) {
      for (const series of sampleSeries) {
        await setDoc(doc(db, 'users', user.uid, 'series', series.id.toString()), series);
      }
      console.log(`Added series for ${user.displayName}`);
    }

    console.log('Test data added successfully!');
  } catch (error) {
    console.error('Error adding test data:', error);
  }
}

// Run the script
addTestData(); 
import { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  addDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "@/lib/firebase";
import { searchService, GoogleBook } from "@/lib/search-service";

export interface GoogleBookItem {
  id: string;
  title: string;
  authors?: string[];
  publishedDate?: string;
  cover?: string;
  rating?: number;
  description?: string;
  pageCount?: number;
  categories?: string[];
  language?: string;
  publisher?: string;
  isbn?: string;
}

export interface BooksProfile {
  recentlyRead: GoogleBookItem[];
  favoriteBooks: GoogleBookItem[];
  readingList: GoogleBookItem[];
  recommendations: GoogleBookItem[];
  ratings: Array<{ book: GoogleBookItem; rating: number }>;
  favoriteAuthors: string[];
}

export const useBooksProfile = (userId: string) => {
  const [booksProfile, setBooksProfile] = useState<BooksProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooksProfile = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const booksRef = collection(db, "users", userId, "books");
      const booksSnapshot = await getDocs(booksRef);
      const booksData = booksSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[]; // Cast to any[] for dynamic properties

      const collectionsRef = collection(db, "users", userId, "bookCollections");
      const collectionsSnapshot = await getDocs(collectionsRef);
      const collectionsData = collectionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[]; // Cast to any[] for dynamic properties

      // Organize books by collection names
      const readBooks = booksData.filter((book) =>
        book.collections?.some((collectionId: string) => {
          const collection = collectionsData.find(
            (col) => col.id === collectionId
          );
          return collection?.name === "Read";
        })
      );

      const readingBooks = booksData.filter((book) =>
        book.collections?.some((collectionId: string) => {
          const collection = collectionsData.find(
            (col) => col.id === collectionId
          );
          return collection?.name === "Reading";
        })
      );

      const toReadBooks = booksData.filter((book) =>
        book.collections?.some((collectionId: string) => {
          const collection = collectionsData.find(
            (col) => col.id === collectionId
          );
          return collection?.name === "To Read";
        })
      );

      const recommendationsBooks = booksData.filter((book) =>
        book.collections?.some((collectionId: string) => {
          const collection = collectionsData.find(
            (col) => col.id === collectionId
          );
          return collection?.name === "Recommendations";
        })
      );

      // Convert book data to GoogleBookItem format
      const convertToGoogleBookItem = (book: any): GoogleBookItem => ({
        id: book.id,
        title: book.title,
        authors: book.author ? [book.author] : [],
        publishedDate: book.publishedDate || "",
        cover: book.cover || "",
        rating: book.rating || 0,
        description: book.overview || "",
        pageCount: book.pageCount || 0,
        categories: [],
        language: "",
        publisher: "",
        isbn: "",
      });

      // Create books profile from the fetched data
      const profile: BooksProfile = {
        recentlyRead: readingBooks.slice(0, 10).map(convertToGoogleBookItem), // Use reading for currently reading
        favoriteBooks: [], // Manual addition - not fetched from collections
        readingList: toReadBooks.map(convertToGoogleBookItem),
        recommendations: recommendationsBooks.map(convertToGoogleBookItem),
        ratings: readBooks
          .filter((book) => book.rating && book.rating > 0)
          .map((book) => ({
            book: convertToGoogleBookItem(book),
            rating: book.rating,
          })),
        favoriteAuthors: [],
      };

      // Also fetch book reviews to get ratings
      try {
        const reviewsRef = collection(db, "reviews");
        const reviewsSnapshot = await getDocs(
          query(
            reviewsRef,
            where("userId", "==", userId),
            where("mediaType", "==", "book")
          )
        );

        const bookReviews = reviewsSnapshot.docs.map((reviewDoc) => {
          const reviewData = reviewDoc.data() as any;
          return {
            book: {
              id: reviewData.mediaId || reviewDoc.id,
              title: reviewData.mediaTitle || "",
              authors: reviewData.mediaAuthor ? [reviewData.mediaAuthor] : [],
              publishedDate: reviewData.mediaYear
                ? reviewData.mediaYear.toString()
                : "",
              cover: reviewData.mediaCover || "",
              rating: reviewData.rating || 0,
              description: reviewData.reviewText || "",
              pageCount: 0,
              categories: [],
              language: "",
              publisher: "",
              isbn: "",
            },
            rating: reviewData.rating || 0,
          };
        });

        // Merge with existing ratings and deduplicate by book ID
        const allRatings = [...profile.ratings, ...bookReviews];
        const seenBookIds = new Set();
        profile.ratings = allRatings.filter((rating) => {
          if (seenBookIds.has(rating.book.id)) {
            return false;
          }
          seenBookIds.add(rating.book.id);
          return true;
        });
      } catch (reviewError) {
        console.log("Could not fetch book reviews:", reviewError);
      }

      setBooksProfile(profile);
    } catch (err) {
      console.error("Error fetching books profile:", err);
      setError("Failed to load books profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooksProfile();
  }, [userId]);

  const updateRecentlyRead = async (book: GoogleBookItem) => {
    if (!userId) return;

    try {
      // Find the "Reading" collection (for currently reading)
      const collectionsRef = collection(db, "users", userId, "bookCollections");
      const collectionsSnapshot = await getDocs(collectionsRef);
      const readingCollection = collectionsSnapshot.docs.find(
        (doc) => doc.data().name === "Reading"
      );

      if (!readingCollection) {
        throw new Error("Reading collection not found");
      }

      // Check if book already exists
      const bookRef = doc(db, "users", userId, "books", book.id);
      const bookDoc = await getDoc(bookRef);

      if (bookDoc.exists()) {
        // Update existing book with Reading collection
        const existingData = bookDoc.data();
        const updatedCollections = existingData.collections?.includes(
          readingCollection.id
        )
          ? existingData.collections
          : [...(existingData.collections || []), readingCollection.id];

        await updateDoc(bookRef, {
          collections: updatedCollections,
        });
      } else {
        // Create new book with Reading collection
        const bookData = {
          id: book.id,
          title: book.title,
          author: book.authors?.join(", ") || "Unknown Author",
          year: book.publishedDate
            ? new Date(book.publishedDate).getFullYear()
            : new Date().getFullYear(),
          cover: book.cover || "",
          rating: book.rating || 0,
          notes: "",
          status: "Reading",
          collections: [readingCollection.id],
          overview: book.description || "",
          publishedDate: book.publishedDate || "",
          pageCount: book.pageCount || 0,
        };

        await setDoc(bookRef, bookData);
      }

      // Refresh the profile data
      await fetchBooksProfile();
    } catch (err) {
      console.error("Error updating recently read:", err);
      throw err;
    }
  };

  const addToReadingList = async (book: GoogleBookItem) => {
    if (!userId) return;

    try {
      // Find the "To Read" collection
      const collectionsRef = collection(db, "users", userId, "bookCollections");
      const collectionsSnapshot = await getDocs(collectionsRef);
      const toReadCollection = collectionsSnapshot.docs.find(
        (doc) => doc.data().name === "To Read"
      );

      if (!toReadCollection) {
        throw new Error("To Read collection not found");
      }

      // Check if book already exists
      const bookRef = doc(db, "users", userId, "books", book.id);
      const bookDoc = await getDoc(bookRef);

      if (bookDoc.exists()) {
        // Update existing book with To Read collection
        const existingData = bookDoc.data();
        const updatedCollections = existingData.collections?.includes(
          toReadCollection.id
        )
          ? existingData.collections
          : [...(existingData.collections || []), toReadCollection.id];

        await updateDoc(bookRef, {
          collections: updatedCollections,
        });
      } else {
        // Create new book with To Read collection
        const bookData = {
          id: book.id,
          title: book.title,
          author: book.authors?.join(", ") || "Unknown Author",
          year: book.publishedDate
            ? new Date(book.publishedDate).getFullYear()
            : new Date().getFullYear(),
          cover: book.cover || "",
          rating: book.rating || 0,
          notes: "",
          status: "To Read",
          collections: [toReadCollection.id],
          overview: book.description || "",
          publishedDate: book.publishedDate || "",
          pageCount: book.pageCount || 0,
        };

        await setDoc(bookRef, bookData);
      }

      // Refresh the profile data
      await fetchBooksProfile();
    } catch (err) {
      console.error("Error adding to reading list:", err);
      throw err;
    }
  };

  const removeFromReadingList = async (bookId: string) => {
    if (!userId) return;

    try {
      // Find the "To Read" collection
      const collectionsRef = collection(db, "users", userId, "bookCollections");
      const collectionsSnapshot = await getDocs(collectionsRef);
      const toReadCollection = collectionsSnapshot.docs.find(
        (doc) => doc.data().name === "To Read"
      );

      if (!toReadCollection) {
        throw new Error("To Read collection not found");
      }

      // Remove book from To Read collection
      const bookRef = doc(db, "users", userId, "books", bookId);
      const bookDoc = await getDoc(bookRef);

      if (bookDoc.exists()) {
        const existingData = bookDoc.data();
        const updatedCollections =
          existingData.collections?.filter(
            (collectionId: string) => collectionId !== toReadCollection.id
          ) || [];

        await updateDoc(bookRef, {
          collections: updatedCollections,
        });
      }

      // Refresh the profile data
      await fetchBooksProfile();
    } catch (err) {
      console.error("Error removing from reading list:", err);
      throw err;
    }
  };

  const addRecommendation = async (book: GoogleBookItem) => {
    if (!userId) return;

    try {
      // Find the "Recommendations" collection
      const collectionsRef = collection(db, "users", userId, "bookCollections");
      const collectionsSnapshot = await getDocs(collectionsRef);
      const recommendationsCollection = collectionsSnapshot.docs.find(
        (doc) => doc.data().name === "Recommendations"
      );

      if (!recommendationsCollection) {
        throw new Error("Recommendations collection not found");
      }

      // Check if book already exists
      const bookRef = doc(db, "users", userId, "books", book.id);
      const bookDoc = await getDoc(bookRef);

      if (bookDoc.exists()) {
        // Update existing book with Recommendations collection
        const existingData = bookDoc.data();
        const updatedCollections = existingData.collections?.includes(
          recommendationsCollection.id
        )
          ? existingData.collections
          : [...(existingData.collections || []), recommendationsCollection.id];

        await updateDoc(bookRef, {
          collections: updatedCollections,
        });
      } else {
        // Create new book with Recommendations collection
        const bookData = {
          id: book.id,
          title: book.title,
          author: book.authors?.join(", ") || "Unknown Author",
          year: book.publishedDate
            ? new Date(book.publishedDate).getFullYear()
            : new Date().getFullYear(),
          cover: book.cover || "",
          rating: book.rating || 0,
          notes: "",
          status: "Recommendations",
          collections: [recommendationsCollection.id],
          overview: book.description || "",
          publishedDate: book.publishedDate || "",
          pageCount: book.pageCount || 0,
        };

        await setDoc(bookRef, bookData);
      }

      // Refresh the profile data
      await fetchBooksProfile();
    } catch (err) {
      console.error("Error adding recommendation:", err);
      throw err;
    }
  };

  const removeRecommendation = async (bookId: string) => {
    if (!userId) return;

    try {
      // Find the "Recommendations" collection
      const collectionsRef = collection(db, "users", userId, "bookCollections");
      const collectionsSnapshot = await getDocs(collectionsRef);
      const recommendationsCollection = collectionsSnapshot.docs.find(
        (doc) => doc.data().name === "Recommendations"
      );

      if (!recommendationsCollection) {
        throw new Error("Recommendations collection not found");
      }

      // Remove book from Recommendations collection
      const bookRef = doc(db, "users", userId, "books", bookId);
      const bookDoc = await getDoc(bookRef);

      if (bookDoc.exists()) {
        const existingData = bookDoc.data();
        const updatedCollections =
          existingData.collections?.filter(
            (collectionId: string) =>
              collectionId !== recommendationsCollection.id
          ) || [];

        await updateDoc(bookRef, {
          collections: updatedCollections,
        });
      }

      // Refresh the profile data
      await fetchBooksProfile();
    } catch (err) {
      console.error("Error removing recommendation:", err);
      throw err;
    }
  };

  const addRating = async (bookId: string, rating: number) => {
    if (!userId) return;

    try {
      // Update the book's rating in the books collection
      const bookRef = doc(db, "users", userId, "books", bookId);
      const bookDoc = await getDoc(bookRef);

      if (bookDoc.exists()) {
        await updateDoc(bookRef, {
          rating: rating,
        });
      }

      // Refresh the profile data
      await fetchBooksProfile();
    } catch (err) {
      console.error("Error adding rating:", err);
      throw err;
    }
  };

  const addRatingWithBook = async (book: GoogleBookItem, rating: number) => {
    if (!userId) return;

    try {
      // First add the book to Read collection (favorite books)
      await addFavoriteBook(book);

      // Then add the rating
      await addRating(book.id, rating);
    } catch (err) {
      console.error("Error adding rating with book:", err);
      throw err;
    }
  };

  const removeRating = async (bookId: string) => {
    if (!userId) return;

    try {
      // Set the book's rating to 0 in the books collection
      const bookRef = doc(db, "users", userId, "books", bookId);
      const bookDoc = await getDoc(bookRef);

      if (bookDoc.exists()) {
        await updateDoc(bookRef, {
          rating: 0,
        });
      }

      // Refresh the profile data
      await fetchBooksProfile();
    } catch (err) {
      console.error("Error removing rating:", err);
      throw err;
    }
  };

  const replaceReadingListBook = async (
    oldBookId: string,
    newBook: GoogleBookItem
  ) => {
    if (!userId) return;

    try {
      // Remove old book from To Read collection
      await removeFromReadingList(oldBookId);

      // Add new book to To Read collection
      await addToReadingList(newBook);
    } catch (err) {
      console.error("Error replacing reading list book:", err);
      throw err;
    }
  };

  const replaceRecommendation = async (
    oldBookId: string,
    newBook: GoogleBookItem
  ) => {
    if (!userId) return;

    try {
      // Remove old book from Recommendations collection
      await removeRecommendation(oldBookId);

      // Add new book to Recommendations collection
      await addRecommendation(newBook);
    } catch (err) {
      console.error("Error replacing recommendation:", err);
      throw err;
    }
  };

  const searchBooks = async (query: string): Promise<GoogleBookItem[]> => {
    try {
      // First try detailed search for better results
      let results = await searchService.searchBooksDetailed(query);

      // If no results or poor results, try regular search
      if (!results || results.length === 0) {
        results = await searchService.searchBooks(query);
      }

      // Transform Google Books API response to our format
      const formattedResults = results.map((book: GoogleBook) => {
        // Clean HTML from description if present - keep full text
        const cleanDescription = book.volumeInfo.description
          ? book.volumeInfo.description
              .replace(/<[^>]*>/g, "") // Remove HTML tags
              .replace(/&amp;/g, "&") // Decode HTML entities
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/&nbsp;/g, " ") // Replace non-breaking spaces
              .replace(/\s+/g, " ") // Normalize whitespace
              .trim()
          : "";

        return {
          id: book.id,
          title: book.volumeInfo.title || "",
          authors: book.volumeInfo.authors || [],
          publishedDate: book.volumeInfo.publishedDate || "",
          cover:
            book.volumeInfo.imageLinks?.thumbnail ||
            book.volumeInfo.imageLinks?.smallThumbnail ||
            "",
          rating: book.volumeInfo.averageRating || 0,
          description: cleanDescription, // Keep full description
          pageCount: book.volumeInfo.pageCount || 0,
          categories: book.volumeInfo.categories || [],
          language: book.volumeInfo.language || "",
          publisher: book.volumeInfo.publisher || "",
          isbn: book.volumeInfo.industryIdentifiers?.[0]?.identifier || "",
        };
      });

      return formattedResults;
    } catch (err) {
      console.error("Error searching books:", err);
      return [];
    }
  };

  const searchBooksByTitleAndAuthor = async (
    title: string,
    author?: string
  ): Promise<GoogleBookItem[]> => {
    try {
      const results = await searchService.searchBooksByTitleAndAuthor(
        title,
        author
      );

      // Transform Google Books API response to our format
      const formattedResults = results.map((book: GoogleBook) => {
        // Clean HTML from description if present - keep full text
        const cleanDescription = book.volumeInfo.description
          ? book.volumeInfo.description
              .replace(/<[^>]*>/g, "") // Remove HTML tags
              .replace(/&amp;/g, "&") // Decode HTML entities
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/&nbsp;/g, " ") // Replace non-breaking spaces
              .replace(/\s+/g, " ") // Normalize whitespace
              .trim()
          : "";

        return {
          id: book.id,
          title: book.volumeInfo.title || "",
          authors: book.volumeInfo.authors || [],
          publishedDate: book.volumeInfo.publishedDate || "",
          cover:
            book.volumeInfo.imageLinks?.thumbnail ||
            book.volumeInfo.imageLinks?.smallThumbnail ||
            "",
          rating: book.volumeInfo.averageRating || 0,
          description: cleanDescription, // Keep full description
          pageCount: book.volumeInfo.pageCount || 0,
          categories: book.volumeInfo.categories || [],
          language: book.volumeInfo.language || "",
          publisher: book.volumeInfo.publisher || "",
          isbn: book.volumeInfo.industryIdentifiers?.[0]?.identifier || "",
        };
      });

      return formattedResults;
    } catch (err) {
      console.error("Error searching books by title and author:", err);
      return [];
    }
  };

  const getBookById = async (
    volumeId: string
  ): Promise<GoogleBookItem | null> => {
    try {
      const book = await searchService.getBookById(volumeId);
      if (!book) return null;

      // Clean HTML from description if present - keep full text
      const cleanDescription = book.volumeInfo.description
        ? book.volumeInfo.description
            .replace(/<[^>]*>/g, "") // Remove HTML tags
            .replace(/&amp;/g, "&") // Decode HTML entities
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, " ") // Replace non-breaking spaces
            .replace(/\s+/g, " ") // Normalize whitespace
            .trim()
        : "";

      return {
        id: book.id,
        title: book.volumeInfo.title || "",
        authors: book.volumeInfo.authors || [],
        publishedDate: book.volumeInfo.publishedDate || "",
        cover:
          book.volumeInfo.imageLinks?.thumbnail ||
          book.volumeInfo.imageLinks?.smallThumbnail ||
          "",
        rating: book.volumeInfo.averageRating || 0,
        description: cleanDescription, // Keep full description
        pageCount: book.volumeInfo.pageCount || 0,
        categories: book.volumeInfo.categories || [],
        language: book.volumeInfo.language || "",
        publisher: book.volumeInfo.publisher || "",
        isbn: book.volumeInfo.industryIdentifiers?.[0]?.identifier || "",
      };
    } catch (err) {
      console.error("Error fetching book by ID:", err);
      return null;
    }
  };

  // Favorite books management functions
  const addFavoriteBook = async (book: GoogleBookItem) => {
    if (!userId || !booksProfile) return;

    try {
      const updatedProfile = { ...booksProfile };
      if (!updatedProfile.favoriteBooks.find((b) => b.id === book.id)) {
        updatedProfile.favoriteBooks.push(book);
        // Keep only 5 favorite books
        updatedProfile.favoriteBooks = updatedProfile.favoriteBooks.slice(0, 5);
        await saveBooksProfile(updatedProfile);
        setBooksProfile(updatedProfile);
      }
    } catch (error) {
      console.error("Error adding favorite book:", error);
      throw error;
    }
  };

  const removeFavoriteBook = async (bookId: string) => {
    if (!userId || !booksProfile) return;

    try {
      const updatedProfile = { ...booksProfile };
      updatedProfile.favoriteBooks = updatedProfile.favoriteBooks.filter(
        (b) => b.id !== bookId
      );
      await saveBooksProfile(updatedProfile);
      setBooksProfile(updatedProfile);
    } catch (error) {
      console.error("Error removing favorite book:", error);
      throw error;
    }
  };

  const replaceFavoriteBook = async (
    oldBookId: string,
    newBook: GoogleBookItem
  ) => {
    if (!userId || !booksProfile) return;

    try {
      const updatedProfile = { ...booksProfile };
      const bookIndex = updatedProfile.favoriteBooks.findIndex(
        (b) => b.id === oldBookId
      );

      if (bookIndex !== -1) {
        updatedProfile.favoriteBooks[bookIndex] = newBook;
        await saveBooksProfile(updatedProfile);
        setBooksProfile(updatedProfile);
      }
    } catch (error) {
      console.error("Error replacing favorite book:", error);
      throw error;
    }
  };

  const saveBooksProfile = async (profile: BooksProfile) => {
    if (!userId) return;

    try {
      const booksCollection = collection(db, "users", userId, "books");
      const booksSnapshot = await getDocs(booksCollection);

      if (booksSnapshot.empty) {
        // Create new document
        await addDoc(booksCollection, profile);
      } else {
        // Update existing document
        const docRef = doc(
          db,
          "users",
          userId,
          "books",
          booksSnapshot.docs[0].id
        );
        await setDoc(docRef, profile, { merge: true });
      }
    } catch (error) {
      console.error("Error saving books profile:", error);
      throw error;
    }
  };

  return {
    booksProfile,
    loading,
    error,
    fetchBooksProfile,
    updateRecentlyRead,
    addFavoriteBook,
    removeFavoriteBook,
    replaceFavoriteBook,
    addToReadingList,
    removeFromReadingList,
    replaceReadingListBook,
    addRecommendation,
    removeRecommendation,
    replaceRecommendation,
    addRating,
    addRatingWithBook,
    removeRating,
    searchBooks,
    searchBooksByTitleAndAuthor,
    getBookById,
  };
};

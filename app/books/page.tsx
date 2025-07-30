"use client";

import type React from "react";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  BookOpen,
  Star,
  Plus,
  X,
  Check,
  Globe,
  Lock,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
} from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useRef } from "react";
import Link from "next/link";

// Dummy data for books
const myBooks = [
  {
    id: "1",
    title: "The Midnight Library",
    author: "Matt Haig",
    cover: "/placeholder.svg?height=200&width=140",
    status: "Reading",
    progress: 42,
  },
  {
    id: "2",
    title: "Atomic Habits",
    author: "James Clear",
    cover: "/placeholder.svg?height=200&width=140",
    status: "Completed",
    progress: 100,
  },
  {
    id: "3",
    title: "Project Hail Mary",
    author: "Andy Weir",
    cover: "/placeholder.svg?height=200&width=140",
    status: "Want to Read",
    progress: 0,
  },
  {
    id: "4",
    title: "The Psychology of Money",
    author: "Morgan Housel",
    cover: "/placeholder.svg?height=200&width=140",
    status: "Reading",
    progress: 67,
  },
  {
    id: "5",
    title: "Educated",
    author: "Tara Westover",
    cover: "/placeholder.svg?height=200&width=140",
    status: "Completed",
    progress: 100,
  },
];

type Book = {
  progress: any;
  status: string;
  id: string;
  title: string;
  author: string;
  cover: string;
  rating: number | string;
  collections?: string[];
};

interface Collection {
  id: string;
  name: string;
  isPublic?: boolean;
  isDefault?: boolean;
}

// Dummy search results
// const searchResults = [
//   {
//     id: 1,
//     title: "The Great Gatsby",
//     author: "F. Scott Fitzgerald",
//     cover: "/placeholder.svg?height=200&width=140",
//     rating: 4.2,
//   },
//   {
//     id: 2,
//     title: "To Kill a Mockingbird",
//     author: "Harper Lee",
//     cover: "/placeholder.svg?height=200&width=140",
//     rating: 4.8,
//   },
//   { id: 3, title: "1984", author: "George Orwell", cover: "/placeholder.svg?height=200&width=140", rating: 4.6 },
//   {
//     id: 4,
//     title: "Pride and Prejudice",
//     author: "Jane Austen",
//     cover: "/placeholder.svg?height=200&width=140",
//     rating: 4.5,
//   },
// ]

export default function BooksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [savedBooks, setSavedBooks] = useState<Book[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>("all");
  const [isCreateCollectionOpen, setCreateCollectionOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionIsPublic, setNewCollectionIsPublic] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [isBatchModalOpen, setBatchModalOpen] = useState(false);
  const [batchCollectionId, setBatchCollectionId] = useState<string>("");
  const [batchNewCollection, setBatchNewCollection] = useState("");
  const [batchLoading, setBatchLoading] = useState(false);
  const [addToListDropdownOpen, setAddToListDropdownOpen] = useState<
    string | null
  >(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addToListBook, setAddToListBook] = useState<any>(null);
  const [addToListOpen, setAddToListOpen] = useState(false);
  const [newModalCollectionName, setNewModalCollectionName] = useState("");
  const [creatingModalCollection, setCreatingModalCollection] = useState(false);
  const [selectedModalCollectionId, setSelectedModalCollectionId] =
    useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [isGenreSearching, setIsGenreSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSelectedGenre(""); // Clear genre selection when doing text search

    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
          searchQuery
        )}`
      );
      const data = await res.json();

      if (data.items && Array.isArray(data.items)) {
        const books: Book[] = data.items.map(
          (item: any, index: number): Book => {
            const info = item.volumeInfo;

            return {
              id: item.id,
              title: info.title ?? "No title",
              author: info.authors?.join(", ") ?? "Unknown author",
              cover:
                info.imageLinks?.thumbnail ??
                "/placeholder.svg?height=200&width=140",
              rating: info.averageRating ?? "N/A",
              progress: undefined,
              status: "",
            };
          }
        );

        setSearchResults(books);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Search failed:", err);
      setSearchResults([]);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    setSelectedGenre("");
    setSearchResults([]);
    setIsGenreSearching(false);
  };

  const handleGenreSearch = async (genre: string) => {
    if (selectedGenre === genre) {
      // If clicking the same genre, deselect it
      setSelectedGenre("");
      setSearchResults([]);
      setIsGenreSearching(false);
      return;
    }

    setSelectedGenre(genre);
    setIsGenreSearching(true);
    setSearchQuery(""); // Clear text search when doing genre search

    try {
      // Create a better search query for different genres
      let searchQuery = "";

      switch (genre.toLowerCase()) {
        case "non-fiction":
          searchQuery =
            "subject:nonfiction OR subject:non-fiction OR subject:reference OR subject:business OR subject:economics OR subject:philosophy OR subject:psychology";
          break;
        case "fiction":
          searchQuery = "subject:fiction OR subject:literature";
          break;
        case "science":
          searchQuery = "subject:science OR subject:scientific";
          break;
        case "history":
          searchQuery = "subject:history OR subject:historical";
          break;
        case "biography":
          searchQuery = "subject:biography OR subject:autobiography";
          break;
        case "self-help":
          searchQuery =
            "subject:self-help OR subject:self_help OR subject:personal_development";
          break;
        default:
          searchQuery = `subject:${encodeURIComponent(genre)}`;
      }

      // Use Google Books API to search by genre
      const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${searchQuery}&maxResults=20`;
      console.log(`API URL for "${genre}":`, apiUrl); // Debug log

      const res = await fetch(apiUrl);
      const data = await res.json();

      console.log(`Genre search for "${genre}":`, data); // Debug log
      console.log(`Total items found:`, data.totalItems || 0); // Debug log

      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        const books: Book[] = data.items.map(
          (item: any, index: number): Book => {
            const info = item.volumeInfo;

            return {
              id: item.id,
              title: info.title ?? "No title",
              author: info.authors?.join(", ") ?? "Unknown author",
              cover:
                info.imageLinks?.thumbnail ??
                "/placeholder.svg?height=200&width=140",
              rating: info.averageRating ?? "N/A",
              progress: undefined,
              status: "",
            };
          }
        );

        setSearchResults(books);
        console.log(`Successfully found ${books.length} books for "${genre}"`);
      } else {
        console.log(
          `No results found for "${genre}". Trying fallback search...`
        );

        // Fallback: try a broader search
        const fallbackQuery = `"${genre}"`;
        const fallbackRes = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${fallbackQuery}&maxResults=20`
        );
        const fallbackData = await fallbackRes.json();

        if (
          fallbackData.items &&
          Array.isArray(fallbackData.items) &&
          fallbackData.items.length > 0
        ) {
          const fallbackBooks: Book[] = fallbackData.items.map(
            (item: any, index: number): Book => {
              const info = item.volumeInfo;

              return {
                id: item.id,
                title: info.title ?? "No title",
                author: info.authors?.join(", ") ?? "Unknown author",
                cover:
                  info.imageLinks?.thumbnail ??
                  "/placeholder.svg?height=200&width=140",
                rating: info.averageRating ?? "N/A",
                progress: undefined,
                status: "",
              };
            }
          );

          setSearchResults(fallbackBooks);
          console.log(
            `Fallback search found ${fallbackBooks.length} books for "${genre}"`
          );
        } else {
          setSearchResults([]);
          console.log(
            `No results found even with fallback search for "${genre}"`
          );
        }
      }
    } catch (err) {
      console.error("Genre search failed:", err);
      setSearchResults([]);
    } finally {
      setIsGenreSearching(false);
    }
  };

  const { user } = useCurrentUser();
  const userId = user?.uid;

  useEffect(() => {
    if (!userId) return;

    const fetchSavedBooks = async () => {
      try {
        const booksCollection = collection(db, "users", userId, "books");
        const snapshot = await getDocs(booksCollection);
        const booksData: Book[] = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Book)
        );
        setSavedBooks(booksData);
        setSavedIds(booksData.map((book) => book.id));
        // Also fetch collections for the user here from firestore if they exist
        // and set them with setCollections
      } catch (err) {
        console.error("Failed to fetch saved books:", err);
      }
    };

    fetchSavedBooks();
  }, [userId]);

  // Fetch collections from Firestore on mount and when userId changes
  useEffect(() => {
    if (!userId) return;
    const fetchCollections = async () => {
      try {
        const colRef = collection(db, "users", userId, "collections");
        const snapshot = await getDocs(colRef);
        const fetchedCollections: Collection[] = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Collection)
        );

        // Define default collections
        const defaultCollections = [
          { name: "Reading", isPublic: false, isDefault: true },
          { name: "Completed", isPublic: false, isDefault: true },
          { name: "To Read", isPublic: false, isDefault: true },
          { name: "Dropped", isPublic: false, isDefault: true },
        ];

        // Check which default collections are missing
        const existingNames = fetchedCollections.map(
          (collection) => collection.name
        );
        const missingDefaults = defaultCollections.filter(
          (collection) => !existingNames.includes(collection.name)
        );

        // Create missing default collections
        if (missingDefaults.length > 0) {
          try {
            for (const collection of missingDefaults) {
              await addDoc(colRef, collection);
            }

            // Fetch all collections again (including newly created defaults)
            const newSnapshot = await getDocs(colRef);
            const allCollections: Collection[] = newSnapshot.docs.map(
              (doc) => ({ id: doc.id, ...doc.data() } as Collection)
            );
            setCollections(allCollections);
          } catch (error) {
            console.error("Error creating default collections:", error);
            setCollections(fetchedCollections);
          }
        } else {
          setCollections(fetchedCollections);
        }
      } catch (err) {
        console.error("Failed to fetch collections:", err);
      }
    };
    fetchCollections();
  }, [userId]);

  const saveBook = async (book: any) => {
    if (!savedIds.includes(book.id)) {
      const newBook = {
        ...book,
        status: "Want to Read",
        progress: 0,
        collections: [],
      };
      setSavedBooks([...savedBooks, newBook]);
      setSavedIds([...savedIds, book.id]);

      if (userId) {
        const bookRef = doc(db, "users", userId, "books", book.id.toString());
        await setDoc(bookRef, newBook);
      }
    }
  };

  const removeBook = async (id: string) => {
    setSavedBooks(savedBooks.filter((book) => book.id !== id));
    setSavedIds(savedIds.filter((bookId) => bookId !== id));

    if (userId) {
      const bookRef = doc(db, "users", userId, "books", id.toString());
      await deleteDoc(bookRef);
    }
  };

  // Create a new collection in Firestore
  const handleCreateCollection = async () => {
    if (newCollectionName.trim() === "" || !userId) return;
    try {
      const colRef = await addDoc(
        collection(db, "users", userId, "collections"),
        {
          name: newCollectionName.trim(),
          isPublic: newCollectionIsPublic,
          isDefault: false,
        }
      );
      const newCollection = {
        id: colRef.id,
        name: newCollectionName.trim(),
        isPublic: newCollectionIsPublic,
        isDefault: false,
      };
      setCollections([...collections, newCollection]);
      setNewCollectionName("");
      setNewCollectionIsPublic(false);
      setCreateCollectionOpen(false);
    } catch (err) {
      console.error("Failed to create collection:", err);
    }
  };

  const addBookToCollection = async (bookId: string, collectionId: string) => {
    const book =
      searchResults.find((b) => b.id === bookId) ||
      savedBooks.find((b) => b.id === bookId);
    if (!book) return;

    // Check if book is already in savedBooks
    const existingBook = savedBooks.find((b) => b.id === bookId);
    let updatedCollections: string[] = [];
    if (existingBook) {
      // Add collectionId if not already present
      updatedCollections = existingBook.collections
        ? Array.from(new Set([...existingBook.collections, collectionId]))
        : [collectionId];
      setSavedBooks(
        savedBooks.map((b) =>
          b.id === bookId ? { ...b, collections: updatedCollections } : b
        )
      );
      if (userId) {
        await updateDoc(doc(db, "users", userId, "books", bookId), {
          collections: updatedCollections,
        });
      }
    } else {
      // Book not in library, add it with the collection
      const newBook = {
        ...book,
        status: "Want to Read",
        progress: 0,
        collections: [collectionId],
      };
      setSavedBooks([...savedBooks, newBook]);
      setSavedIds([...savedIds, bookId]);
      if (userId) {
        await setDoc(doc(db, "users", userId, "books", bookId), newBook);
      }
    }
  };

  const updateBookStatus = async (id: string, status: string) => {
    const updated = savedBooks.map((book) =>
      book.id === id
        ? {
            ...book,
            status,
            progress: status === "Completed" ? 100 : book.progress,
          }
        : book
    );

    setSavedBooks(updated);

    if (userId) {
      const bookToUpdate = updated.find((book) => book.id === id);
      if (bookToUpdate) {
        const bookRef = doc(db, "users", userId, "books", id.toString());
        await updateDoc(bookRef, {
          status: bookToUpdate.status,
          progress: bookToUpdate.progress,
        });
      }
    }
  };

  const filteredBooks =
    selectedCollection === "all"
      ? savedBooks
      : savedBooks.filter((book) =>
          book.collections?.includes(selectedCollection)
        );

  // Multi-select handlers
  const toggleBookSelect = (id: string) => {
    setSelectedBooks((prev) =>
      prev.includes(id) ? prev.filter((bid) => bid !== id) : [...prev, id]
    );
  };
  const selectAllBooks = () => {
    setSelectedBooks(searchResults.map((b) => b.id));
  };
  const clearSelectedBooks = () => {
    setSelectedBooks([]);
  };
  const allSelected =
    selectedBooks.length === searchResults.length && searchResults.length > 0;

  // Batch add handler (add books to Firestore under the chosen or new collection)
  const handleBatchAdd = async () => {
    if (!userId) {
      setBatchLoading(false);
      return;
    }
    setBatchLoading(true);
    let collectionId = batchCollectionId;
    // Create new collection in Firestore if needed
    if (batchNewCollection.trim()) {
      try {
        const colRef = await addDoc(
          collection(db, "users", userId, "collections"),
          {
            name: batchNewCollection.trim(),
          }
        );
        collectionId = colRef.id;
        setCollections([
          ...collections,
          { id: colRef.id, name: batchNewCollection.trim() },
        ]);
      } catch (err) {
        console.error("Failed to create batch collection:", err);
        setBatchLoading(false);
        return;
      }
    }
    // Add all selected books to Firestore under the chosen collection
    for (const bookId of selectedBooks) {
      const book = searchResults.find((b) => b.id === bookId);
      if (!book) continue;
      const newBook = {
        ...book,
        status: "Want to Read",
        progress: 0,
        collections: [collectionId],
      };
      await setDoc(
        doc(db, "users", userId, "books", book.id.toString()),
        newBook
      );
    }
    setBatchLoading(false);
    setBatchModalOpen(false);
    clearSelectedBooks();
    // Refetch savedBooks and collections
    if (userId) {
      const booksCollection = collection(db, "users", userId, "books");
      const snapshot = await getDocs(booksCollection);
      const booksData: Book[] = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Book)
      );
      setSavedBooks(booksData);
      setSavedIds(booksData.map((book) => book.id));
      // Refetch collections
      const colRef = collection(db, "users", userId, "collections");
      const colSnap = await getDocs(colRef);
      const fetchedCollections: Collection[] = colSnap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Collection)
      );
      setCollections(fetchedCollections);
    }
  };

  return (
    <div className="container py-8 min-h-screen flex items-start">
      <div className="flex flex-col md:flex-row gap-8 w-full">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-6 flex flex-col justify-start flex-shrink-0">
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-2 w-full sm:flex-row sm:items-center sm:gap-2"
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for books"
                className="pl-10 pr-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </form>

          <div className="space-y-2">
            <h3 className="font-medium">My Collections</h3>
            <div className="space-y-1">
              <button
                className={`w-full flex items-center justify-between rounded-md p-2 text-sm ${
                  selectedCollection === "all"
                    ? "bg-accent"
                    : "hover:bg-accent transition-colors"
                }`}
                onClick={() => setSelectedCollection("all")}
              >
                <span>All Books</span>
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                  {savedBooks.length}
                </span>
              </button>
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  className={`w-full flex items-center justify-between rounded-md p-2 text-sm ${
                    selectedCollection === collection.id
                      ? "bg-accent"
                      : "hover:bg-accent transition-colors"
                  }`}
                  onClick={() => setSelectedCollection(collection.id)}
                >
                  <div className="flex items-center gap-2">
                    <span>{collection.name}</span>
                    {collection.isPublic && (
                      <Globe className="h-3 w-3 text-muted-foreground" />
                    )}
                    {!collection.isPublic && !collection.isDefault && (
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                    {
                      savedBooks.filter((b) =>
                        b.collections?.includes(collection.id)
                      ).length
                    }
                  </span>
                </button>
              ))}
            </div>
            <Dialog
              open={isCreateCollectionOpen}
              onOpenChange={setCreateCollectionOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  <Plus className="mr-2 h-4 w-4" /> Create Collection
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Collection</DialogTitle>
                  <DialogDescription>
                    Enter a name for your new collection.
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await handleCreateCollection();
                  }}
                >
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="name"
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="isPublic" className="text-right">
                        Public Collection
                      </Label>
                      <div className="col-span-3 flex items-center space-x-2">
                        <Checkbox
                          id="isPublic"
                          checked={newCollectionIsPublic}
                          onCheckedChange={(checked) =>
                            setNewCollectionIsPublic(!!checked)
                          }
                        />
                        <Label
                          htmlFor="isPublic"
                          className="text-sm text-muted-foreground"
                        >
                          Make this collection visible on your public profile
                        </Label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Save collection</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Genres</h3>
            <div className="flex flex-wrap gap-2">
              {[
                "Fiction",
                "Non-Fiction",
                "Science",
                "History",
                "Biography",
                "Self-Help",
              ].map((genre) => (
                <Badge
                  key={genre}
                  variant={selectedGenre === genre ? "default" : "outline"}
                  className={`cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground ${
                    selectedGenre === genre
                      ? "bg-primary text-primary-foreground"
                      : ""
                  }`}
                  onClick={() => handleGenreSearch(genre)}
                >
                  {genre}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {isSearching || isGenreSearching || searchQuery ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  {isSearching
                    ? `Search Results for "${searchQuery}"`
                    : isGenreSearching
                    ? `Books in ${selectedGenre}`
                    : `Search Results for "${searchQuery}"`}
                </h2>
                <Button variant="ghost" onClick={clearSearch}>
                  Clear Search
                </Button>
              </div>
              {/* Multi-select controls */}
              <div className="flex items-center gap-4 mb-2">
                {selectedBooks.length > 0 && (
                  <Button size="sm" onClick={() => setBatchModalOpen(true)}>
                    Add Selected to Collection
                  </Button>
                )}
                {selectedBooks.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearSelectedBooks}
                  >
                    Clear Selection
                  </Button>
                )}
              </div>
              {isGenreSearching ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">
                    Loading {selectedGenre} books...
                  </p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No books found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try a different search term or browse by genre
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-6">
                  {searchResults.map((book, index) => (
                    <Link
                      key={`${book.id}-${index}`}
                      href={`/books/${book.id}`}
                      className="block"
                    >
                      <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden hover:scale-105 transition-transform cursor-pointer shadow-md">
                        <Image
                          src={book.cover || "/placeholder.svg"}
                          alt={book.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {/* Batch Add Modal */}
              <Dialog open={isBatchModalOpen} onOpenChange={setBatchModalOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Selected Books to Collection</DialogTitle>
                  </DialogHeader>
                  <div className="mb-4">
                    <label className="block mb-2">Select Collection</label>
                    <select
                      className="w-full p-2 rounded bg-gray-800 text-white"
                      value={batchCollectionId}
                      onChange={(e) => setBatchCollectionId(e.target.value)}
                    >
                      <option value="">-- Select --</option>
                      {collections.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4 text-center">or</div>
                  <div className="mb-4">
                    <label className="block mb-2">Create New Collection</label>
                    <input
                      className="w-full p-2 rounded bg-gray-800 text-white"
                      placeholder="New collection name"
                      value={batchNewCollection}
                      onChange={(e) => setBatchNewCollection(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleBatchAdd}
                      disabled={
                        batchLoading ||
                        (!batchCollectionId && !batchNewCollection) ||
                        selectedBooks.length === 0
                      }
                    >
                      {batchLoading ? "Adding..." : "Add Books"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">
                {selectedCollection === "all"
                  ? "My Books"
                  : collections.find((c) => c.id === selectedCollection)
                      ?.name || "My Books"}
              </h2>
              {filteredBooks.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No books in this section
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Add books to your library or change your filter
                  </p>
                  <Button onClick={() => setSelectedCollection("all")}>
                    View All Books
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                  {filteredBooks.length === 0 ? (
                    <div className="col-span-full text-center text-muted-foreground py-12">
                      No books in your collections yet.
                    </div>
                  ) : (
                    filteredBooks.map((book) => (
                      <Card key={book.id} className="overflow-hidden">
                        <div className="bg-card rounded-lg shadow-md overflow-hidden flex flex-col h-full cursor-pointer transition-transform hover:scale-[1.03]">
                          <div className="relative aspect-[2/3] w-full">
                            <Image
                              src={book.cover || "/placeholder.svg"}
                              alt={book.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Dialog for Add to List */}
      <Dialog open={addToListOpen} onOpenChange={setAddToListOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to List</DialogTitle>
            <DialogDescription>
              Choose a list or create a new one to add{" "}
              <b>{addToListBook?.title}</b>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {collections.length > 0 && (
              <div>
                <div className="mb-2 font-medium">Your Lists</div>
                <div className="space-y-2">
                  {collections.map((collection) => (
                    <label
                      key={collection.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="modal-collection"
                        value={collection.id}
                        checked={selectedModalCollectionId === collection.id}
                        onChange={() =>
                          setSelectedModalCollectionId(collection.id)
                        }
                      />
                      <span>{collection.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <Button
              className="w-full"
              onClick={async () => {
                if (!selectedModalCollectionId || !addToListBook) return;
                await addBookToCollection(
                  addToListBook.id,
                  selectedModalCollectionId
                );
                setAddToListOpen(false);
                setSelectedModalCollectionId("");
              }}
              disabled={!selectedModalCollectionId}
            >
              Add to List
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import type React from "react";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, BookOpen, Star, Plus, X, Check } from "lucide-react";
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

const recommendedBooks = [
  {
    id: "1",
    title: "Dune",
    author: "Frank Herbert",
    cover: "/placeholder.svg?height=200&width=140",
    rating: 4.5,
  },
  {
    id: "2",
    title: "The Alchemist",
    author: "Paulo Coelho",
    cover: "/placeholder.svg?height=200&width=140",
    rating: 4.3,
  },
  {
    id: "3",
    title: "Sapiens",
    author: "Yuval Noah Harari",
    cover: "/placeholder.svg?height=200&width=140",
    rating: 4.7,
  },
  {
    id: "4",
    title: "The Silent Patient",
    author: "Alex Michaelides",
    cover: "/placeholder.svg?height=200&width=140",
    rating: 4.2,
  },
  {
    id: "5",
    title: "Where the Crawdads Sing",
    author: "Delia Owens",
    cover: "/placeholder.svg?height=200&width=140",
    rating: 4.6,
  },
  {
    id: "6",
    title: "The Four Winds",
    author: "Kristin Hannah",
    cover: "/placeholder.svg?height=200&width=140",
    rating: 4.4,
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

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!searchQuery.trim()) return;

    setIsSearching(true);

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
  };

  const user = useCurrentUser();
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
        setCollections(fetchedCollections);
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
        }
      );
      const newCollection = { id: colRef.id, name: newCollectionName.trim() };
      setCollections([...collections, newCollection]);
      setNewCollectionName("");
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
    <div className="container max-w-6xl mx-auto px-2 sm:px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-6 flex-shrink-0">
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

          <div>
            <h3 className="font-medium">My Collections</h3>
            <div className="space-y-1 mt-2">
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
                  <span>{collection.name}</span>
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
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleCreateCollection}>
                    Save collection
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div>
            <h3 className="font-medium">Genres</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline">Fiction</Badge>
              <Badge variant="outline">Non-Fiction</Badge>
              <Badge variant="outline">Science</Badge>
              <Badge variant="outline">History</Badge>
              <Badge variant="outline">Biography</Badge>
              <Badge variant="outline">Self-Help</Badge>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {isSearching ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  Search Results for "{searchQuery}"
                </h2>
                <Button variant="ghost" onClick={clearSearch}>
                  Clear Search
                </Button>
              </div>
              {/* Multi-select controls */}
              <div className="flex items-center gap-4 mb-2">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={
                    allSelected ? clearSelectedBooks : selectAllBooks
                  }
                />
                <span>Select All</span>
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
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                {searchResults.map((book, index) => (
                  <Card
                    key={`${book.id}-${index}`}
                    className="overflow-hidden relative w-full h-full flex flex-col group"
                    onClick={(e) => {
                      // Only open modal if not clicking on a button or input
                      if (
                        (e.target as HTMLElement).tagName === "BUTTON" ||
                        (e.target as HTMLElement).tagName === "INPUT" ||
                        (e.target as HTMLElement).closest("button") ||
                        (e.target as HTMLElement).closest("input")
                      ) {
                        return;
                      }
                      setSelectedBook(book);
                      setIsModalOpen(true);
                    }}
                  >
                    <div
                      className="absolute inset-0 z-10 cursor-pointer"
                      onClick={(e) => {
                        // Only open modal if not clicking on a button or input
                        if (
                          (e.target as HTMLElement).tagName === "BUTTON" ||
                          (e.target as HTMLElement).tagName === "INPUT" ||
                          (e.target as HTMLElement).closest("button") ||
                          (e.target as HTMLElement).closest("input")
                        ) {
                          return;
                        }
                        setSelectedBook(book);
                        setIsModalOpen(true);
                      }}
                    />
                    <Checkbox
                      className="absolute top-2 left-2 z-20 bg-white rounded"
                      checked={selectedBooks.includes(book.id)}
                      onCheckedChange={() => toggleBookSelect(book.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <CardContent className="p-0">
                      <div className="relative aspect-[2/3] w-full">
                        <Image
                          src={book.cover || "/placeholder.svg"}
                          alt={book.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium line-clamp-1">
                              {book.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {book.author}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <Star className="h-3 w-3 fill-primary text-primary" />
                            <span className="text-xs ml-1">{book.rating}</span>
                          </div>
                        </div>
                        <DropdownMenu
                          open={addToListDropdownOpen === book.id}
                          onOpenChange={(open) =>
                            setAddToListDropdownOpen(open ? book.id : null)
                          }
                        >
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="default"
                              size="sm"
                              className="w-full"
                              onClick={(e) => {
                                e.preventDefault();
                                setAddToListDropdownOpen(book.id);
                              }}
                              disabled={savedIds.includes(book.id)}
                            >
                              {savedIds.includes(book.id) ? (
                                <>
                                  <Check className="mr-1 h-4 w-4" /> Saved
                                </>
                              ) : (
                                <>
                                  <Plus className="mr-1 h-4 w-4" /> Add to List
                                </>
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {collections.length === 0 ? (
                              <DropdownMenuItem disabled>
                                No lists found
                              </DropdownMenuItem>
                            ) : (
                              collections.map((collection) => (
                                <DropdownMenuItem
                                  key={collection.id}
                                  onClick={async () => {
                                    await addBookToCollection(
                                      book.id,
                                      collection.id
                                    );
                                    setAddToListDropdownOpen(null);
                                  }}
                                  disabled={
                                    savedIds.includes(book.id) &&
                                    savedBooks
                                      .find((b) => b.id === book.id)
                                      ?.collections?.includes(collection.id)
                                  }
                                >
                                  {collection.name}
                                </DropdownMenuItem>
                              ))
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
            <Tabs defaultValue="my-books">
              <TabsList className="mb-4 flex flex-wrap gap-2">
                <TabsTrigger value="my-books">My Books</TabsTrigger>
                <TabsTrigger value="recommendations">
                  Recommendations
                </TabsTrigger>
              </TabsList>

              <TabsContent value="my-books" className="space-y-6">
                <h2 className="text-2xl font-bold">My Books</h2>
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
                  <ScrollArea className="h-[calc(100vh-16rem)] pr-2">
                    <div className="space-y-4">
                      {filteredBooks.map((book) => (
                        <div
                          key={book.id}
                          className="flex flex-col sm:flex-row bg-card border border-border rounded-xl shadow-md overflow-hidden mb-4 w-full cursor-pointer"
                          onClick={() => {
                            setSelectedBook(book);
                            setIsModalOpen(true);
                          }}
                        >
                          <div className="w-full sm:w-24 h-48 sm:h-36 relative flex-shrink-0">
                            <Image
                              src={book.cover || "/placeholder.svg"}
                              alt={book.title}
                              fill
                              className="object-cover rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none"
                            />
                          </div>
                          <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between min-w-0">
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="text-lg font-semibold leading-tight mb-1">
                                    {book.title}
                                  </h3>
                                  <p className="text-sm text-muted-foreground font-medium">
                                    {book.author}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2 mb-4">
                                <Button
                                  variant={
                                    book.status === "Want to Read"
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  className="rounded-full px-4"
                                  onClick={() =>
                                    updateBookStatus(book.id, "Want to Read")
                                  }
                                >
                                  Want to Read
                                </Button>
                                <Button
                                  variant={
                                    book.status === "Reading"
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  className="rounded-full px-4"
                                  onClick={() =>
                                    updateBookStatus(book.id, "Reading")
                                  }
                                >
                                  Reading
                                </Button>
                                <Button
                                  variant={
                                    book.status === "Completed"
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  className="rounded-full px-4"
                                  onClick={() =>
                                    updateBookStatus(book.id, "Completed")
                                  }
                                >
                                  Completed
                                </Button>
                              </div>
                              <div className="border-t border-border my-3" />
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      className="rounded-md px-4"
                                    >
                                      <Plus className="mr-2 h-4 w-4" /> Add
                                      to...
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    {collections.map((collection) => (
                                      <DropdownMenuItem
                                        key={collection.id}
                                        onClick={() =>
                                          addBookToCollection(
                                            book.id,
                                            collection.id
                                          )
                                        }
                                        disabled={book.collections?.includes(
                                          collection.id
                                        )}
                                      >
                                        {collection.name}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-6">
                <h2 className="text-2xl font-bold">Recommended for You</h2>
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6">
                  {recommendedBooks.map((book) => (
                    <Card
                      key={book.id}
                      className="overflow-hidden w-full h-full flex flex-col"
                    >
                      <CardContent className="p-0">
                        <div className="relative aspect-[2/3] w-full">
                          <Image
                            src={book.cover || "/placeholder.svg"}
                            alt={book.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium line-clamp-1">
                                {book.title}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {book.author}
                              </p>
                            </div>
                            <div className="flex items-center">
                              <Star className="h-3 w-3 fill-primary text-primary" />
                              <span className="text-xs ml-1">
                                {book.rating}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => saveBook(book)}
                            disabled={savedIds.includes(book.id)}
                          >
                            {savedIds.includes(book.id) ? (
                              <>
                                <Check className="mr-1 h-4 w-4" /> Saved
                              </>
                            ) : (
                              <>
                                <Plus className="mr-1 h-4 w-4" /> Add to Library
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
      {/* Modal for Book Overview */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedBook?.title || "Book Details"}</DialogTitle>
          </DialogHeader>
          {selectedBook && (
            <div className="flex flex-col md:flex-row gap-6">
              {/* Book Cover */}
              <div className="flex-shrink-0 flex justify-center md:block">
                <Image
                  src={selectedBook.cover || "/placeholder.svg"}
                  alt={selectedBook.title}
                  width={180}
                  height={260}
                  className="rounded-lg shadow-md mb-2 md:mb-0"
                />
              </div>
              {/* Book Details */}
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold mb-2">
                  {selectedBook.title}
                </h2>
                <div className="text-lg font-semibold mb-2 text-emerald-400">
                  {selectedBook.author}
                </div>
                <div className="flex items-center gap-3 mb-3">
                  {/* Rating */}
                  <span className="flex items-center gap-1">
                    <span className="text-emerald-400 font-bold">
                      {selectedBook.rating && selectedBook.rating !== "N/A"
                        ? selectedBook.rating
                        : "N/A"}
                    </span>
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <polygon points="9.9,1.1 7.6,6.6 1.6,7.6 6,11.9 4.9,17.9 9.9,15.1 14.9,17.9 13.8,11.9 18.2,7.6 12.2,6.6 " />
                    </svg>
                  </span>
                  {/* Status */}
                  {selectedBook.status && (
                    <span className="px-2 py-1 rounded bg-muted text-xs font-semibold">
                      {selectedBook.status}
                    </span>
                  )}
                  {/* Progress */}
                  {selectedBook.progress &&
                    selectedBook.status === "Reading" && (
                      <span className="text-xs text-muted-foreground">
                        {selectedBook.progress}% read
                      </span>
                    )}
                </div>
                {/* Collections */}
                {selectedBook.collections &&
                  selectedBook.collections.length > 0 && (
                    <div className="mb-2 text-sm text-muted-foreground flex flex-wrap gap-2">
                      {selectedBook.collections.map((col) => (
                        <span
                          key={col}
                          className="bg-emerald-900/30 text-emerald-300 px-2 py-1 rounded text-xs font-medium"
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                  )}
                {/* Description/Summary */}
                <div className="mt-3 text-base text-gray-300 leading-relaxed">
                  {typeof (selectedBook as any).description === "string" &&
                  (selectedBook as any).description ? (
                    (selectedBook as any).description
                  ) : (
                    <span className="text-muted-foreground">
                      No description available.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
  const [collections, setCollections] = useState<Collection[]>([
    { id: "1", name: "Reading" },
    { id: "2", name: "Completed" },
    { id: "3", name: "Want to Read" },
  ]);
  const [selectedCollection, setSelectedCollection] = useState<string>("all");
  const [isCreateCollectionOpen, setCreateCollectionOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [isBatchModalOpen, setBatchModalOpen] = useState(false);
  const [batchCollectionId, setBatchCollectionId] = useState<string>("");
  const [batchNewCollection, setBatchNewCollection] = useState("");
  const [batchLoading, setBatchLoading] = useState(false);

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
        const books: Book[] = data.items.map((item: any): Book => {
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
        });

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

  const handleCreateCollection = () => {
    if (newCollectionName.trim() === "") return;
    const newCollection = {
      id: (collections.length + 1).toString(),
      name: newCollectionName.trim(),
    };
    setCollections([...collections, newCollection]);
    setNewCollectionName("");
    setCreateCollectionOpen(false);
    // You would also save the new collection to Firestore here
  };

  const addBookToCollection = async (bookId: string, collectionId: string) => {
    const book = savedBooks.find((b) => b.id === bookId);
    if (!book) return;

    const updatedCollections = book.collections
      ? [...book.collections, collectionId]
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

  // Batch add handler
  const handleBatchAdd = async () => {
    if (!userId) {
      setBatchLoading(false);
      return;
    }
    setBatchLoading(true);
    let collectionId = batchCollectionId;
    // Create new collection if needed
    if (batchNewCollection.trim()) {
      // Save to Firestore (collections) and get auto-id
      const newCol = { name: batchNewCollection.trim(), userId };
      const colRef = await addDoc(
        collection(db, "users", userId, "collections"),
        newCol
      );
      collectionId = colRef.id;
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
    // Optionally, refetch savedBooks and collections here
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-6">
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
        <div className="flex-1">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {searchResults.map((book) => (
                  <Card key={book.id} className="overflow-hidden relative">
                    <Checkbox
                      className="absolute top-2 left-2 z-10 bg-white rounded"
                      checked={selectedBooks.includes(book.id)}
                      onCheckedChange={() => toggleBookSelect(book.id)}
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
              <TabsList className="mb-4">
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
                  <ScrollArea className="h-[calc(100vh-16rem)]">
                    <div className="space-y-4">
                      {filteredBooks.map((book) => (
                        <div
                          key={book.id}
                          className="flex border rounded-lg overflow-hidden"
                        >
                          <div className="w-24 h-36 relative flex-shrink-0">
                            <Image
                              src={book.cover || "/placeholder.svg"}
                              alt={book.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 p-4 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between">
                                <h3 className="font-medium">{book.title}</h3>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => removeBook(book.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {book.author}
                              </p>
                            </div>
                            <div className="mt-2">
                              {/* if you ever decide to add the drag bar its here ! */}
                              {/* <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">
                                  {book.status === "Reading" ? `${book.progress}% complete` : book.status}
                                </span>
                              </div>
                              {book.status === "Reading" && (
                                <div className="w-full bg-muted rounded-full h-2 mb-3">
                                  <div
                                    className="bg-primary h-2 rounded-full"
                                    style={{ width: `${book.progress}%` }}
                                  ></div>
                                </div>
                              )} */}
                              <div className="flex gap-2">
                                <Button
                                  variant={
                                    book.status === "Want to Read"
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
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
                                  onClick={() =>
                                    updateBookStatus(book.id, "Completed")
                                  }
                                >
                                  Completed
                                </Button>
                              </div>
                            </div>
                            <div className="p-4 border-t flex flex-col justify-center items-center gap-2 bg-muted/40">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Plus className="mr-2 h-4 w-4" /> Add to...
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
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeBook(book.id)}
                              >
                                <X className="mr-1 h-4 w-4" /> Remove
                              </Button>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                  {recommendedBooks.map((book) => (
                    <Card key={book.id} className="overflow-hidden">
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
    </div>
  );
}

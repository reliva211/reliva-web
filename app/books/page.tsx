"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  BookOpen,
  Plus,
  X,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  MoreHorizontal,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { db } from "@/lib/firebase";
import {
  setDoc,
  doc,
  deleteDoc,
  updateDoc,
  collection,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { useCurrentUser } from "@/hooks/use-current-user";
import Link from "next/link";

interface Book {
  id: string;
  title: string;
  author: string;
  year: number;
  cover: string;
  status?: string;
  notes?: string;
  collections?: string[];
  overview?: string;
  publishedDate?: string;
  pageCount?: number;
}

interface Collection {
  id: string;
  name: string;
  isPublic?: boolean;
  isDefault?: boolean;
  color?: string;
}

interface SearchResult {
  id: string;
  title: string;
  author: string;
  year: number;
  cover: string;
  overview?: string;
  publishedDate?: string;
  pageCount?: number;
}

// Google Books API Search Function
const searchBooks = async (query: string): Promise<SearchResult[]> => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch books');
    }

    const data = await response.json();
    
    if (!data.items) {
      return [];
    }

    return data.items.map((book: any) => {
      const info = book.volumeInfo;
      let year = 0;
      if (info.publishedDate) {
        const date = new Date(info.publishedDate);
        if (!isNaN(date.getTime())) {
          year = date.getFullYear();
        }
      }
      
      return {
        id: book.id,
        title: info.title || "Unknown Title",
        author: info.authors?.join(", ") || "Unknown Author",
        year: year,
        cover: info.imageLinks?.thumbnail || "/placeholder.svg",
        overview: info.description || "",
        publishedDate: info.publishedDate || "",
        pageCount: info.pageCount || 0,
      };
    });
  } catch (error) {
    console.error('Error searching books:', error);
    return [];
  }
};

export default function BooksPage() {
  const { user } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [savedBooks, setSavedBooks] = useState<Book[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>("all");
  const [isCreateCollectionOpen, setCreateCollectionOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionIsPublic, setNewCollectionIsPublic] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [isGenreSearching, setIsGenreSearching] = useState(false);
  const [sortBy, setSortBy] = useState<"title" | "year" | "rating" | "added">("added");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Default collections for books
  const defaultCollections = [
    { name: "All Books", isDefault: true, color: "bg-blue-500" },
    { name: "Reading", isDefault: true, color: "bg-green-500" },
    { name: "Completed", isDefault: true, color: "bg-yellow-500" },
    { name: "To Read", isDefault: true, color: "bg-purple-500" },
    { name: "Dropped", isDefault: true, color: "bg-red-500" },
  ];

  // Fetch user's books and collections
  useEffect(() => {
    if (!user?.uid) return;

    const fetchUserData = async () => {
      try {
        // Fetch books
        const booksRef = collection(db, "users", user.uid, "books");
        const booksSnapshot = await getDocs(booksRef);
        const booksData = booksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Book[];
        setSavedBooks(booksData);

        // Fetch collections
        const collectionsRef = collection(db, "users", user.uid, "bookCollections");
        const collectionsSnapshot = await getDocs(collectionsRef);
        const collectionsData = collectionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Collection[];

        // Create default collections if they don't exist
        const existingNames = collectionsData.map(col => col.name);
        const missingDefaults = defaultCollections.filter(
          col => !existingNames.includes(col.name)
        );

        if (missingDefaults.length > 0) {
          for (const defaultCol of missingDefaults) {
            await addDoc(collectionsRef, defaultCol);
          }
          // Refetch collections
          const newSnapshot = await getDocs(collectionsRef);
          const allCollections = newSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Collection[];
          setCollections(allCollections);
        } else {
          setCollections(collectionsData);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [user]);

  // Enhanced fuzzy search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSelectedGenre("");

    try {
      const results = await searchBooks(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching books:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedGenre("");
    setIsSearching(false);
    setIsGenreSearching(false);
  };

  // Handle collection selection and clear search
  const handleCollectionSelect = (collectionId: string) => {
    setSelectedCollection(collectionId);
    // Clear search when clicking on collection tabs
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
    setIsGenreSearching(false);
  };

  // Add book to collection
  const addBookToCollection = async (book: SearchResult, collectionId: string) => {
    if (!user?.uid) return;

    try {
      // Check if book already exists
      const existingBook = savedBooks.find(b => b.id === book.id);
      
      // Get the "All Books" collection
      const allBooksCollection = collections.find(col => col.name === "All Books");
      
      if (existingBook) {
        let updatedCollections = [...(existingBook.collections || [])];
        
        // Always add to "All Books" if it exists
        if (allBooksCollection && !updatedCollections.includes(allBooksCollection.id)) {
          updatedCollections.push(allBooksCollection.id);
        }
        
        // Add to specific collection if not already there
        if (!updatedCollections.includes(collectionId)) {
          updatedCollections.push(collectionId);
        }
        
        await updateDoc(doc(db, "users", user.uid, "books", book.id), {
          collections: updatedCollections
        });
        setSavedBooks(prev => prev.map(b => 
          b.id === book.id ? { ...b, collections: updatedCollections } : b
        ));
      } else {
        // Create new book
        let bookCollections = [collectionId];
        
        // Always add to "All Books" if it exists
        if (allBooksCollection) {
          bookCollections.push(allBooksCollection.id);
        }
        
        const bookData: Book = {
          id: book.id,
          title: book.title,
          author: book.author,
          year: book.year,
          cover: book.cover,
          status: "To Read",
          notes: "",
          collections: bookCollections,
          overview: book.overview || "",
          publishedDate: book.publishedDate || "",
          pageCount: book.pageCount || 0,
        };

        await setDoc(doc(db, "users", user.uid, "books", book.id), bookData);
        setSavedBooks(prev => [...prev, bookData]);
      }
    } catch (error) {
      console.error("Error adding book to collection:", error);
    }
  };

  // Remove book from collection
  const removeBookFromCollection = async (bookId: string, collectionId: string) => {
    if (!user?.uid) return;

    try {
      const book = savedBooks.find(b => b.id === bookId);
      if (!book) return;

      const updatedCollections = book.collections?.filter(id => id !== collectionId) || [];
      
      if (updatedCollections.length === 0) {
        // Remove book entirely if no collections left
        await deleteDoc(doc(db, "users", user.uid, "books", bookId));
        setSavedBooks(prev => prev.filter(b => b.id !== bookId));
      } else {
        // Update book with remaining collections
        await updateDoc(doc(db, "users", user.uid, "books", bookId), {
          collections: updatedCollections
        });
        setSavedBooks(prev => prev.map(b => 
          b.id === bookId ? { ...b, collections: updatedCollections } : b
        ));
      }
    } catch (error) {
      console.error("Error removing book from collection:", error);
    }
  };

  // Create new collection
  const createCollection = async () => {
    if (!user?.uid || !newCollectionName.trim()) return;

    try {
      const collectionData = {
        name: newCollectionName.trim(),
        isPublic: newCollectionIsPublic,
        isDefault: false,
        color: `bg-${['blue', 'green', 'yellow', 'purple', 'red', 'pink', 'indigo'][Math.floor(Math.random() * 7)]}-500`
      };

      const docRef = await addDoc(collection(db, "users", user.uid, "bookCollections"), collectionData);
      
      const newCollection = { id: docRef.id, ...collectionData };
      setCollections(prev => [...prev, newCollection]);
      
      setNewCollectionName("");
      setNewCollectionIsPublic(false);
      setCreateCollectionOpen(false);
    } catch (error) {
      console.error("Error creating collection:", error);
    }
  };

  // Filter and sort books
  const filteredAndSortedBooks = useMemo(() => {
    let filtered = savedBooks;
    
    // Filter by collection
    if (selectedCollection !== "all") {
      filtered = savedBooks.filter(book => 
        book.collections?.includes(selectedCollection)
      );
    }

    // Sort books
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "year":
          aValue = a.year;
          bValue = b.year;
          break;
        case "added":
        default:
          aValue = a.id;
          bValue = b.id;
          break;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [savedBooks, selectedCollection, sortBy, sortOrder]);

  // Get collection info
  const getCollectionInfo = (collectionId: string) => {
    return collections.find(col => col.id === collectionId);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Books</h1>
              <p className="text-muted-foreground">Discover and organize your favorite books</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              >
                {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search books..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
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
                <Button type="submit" disabled={isSearching}>
                  {isSearching ? "Searching..." : "Search"}
                </Button>
              </form>
            </div>

            {/* Sort Controls */}
            {searchResults.length === 0 && (
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-40">
                    <SortAsc className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="added">Date Added</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                >
                  {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>

          {/* Collections Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {collections.map((collection) => {
              const bookCount = savedBooks.filter(book => 
                book.collections?.includes(collection.id)
              ).length;
              
              return (
                <button
                  key={collection.id}
                  onClick={() => handleCollectionSelect(collection.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                    selectedCollection === collection.id
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "hover:bg-accent"
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${collection.color || 'bg-gray-500'}`} />
                  <span className="font-medium">{collection.name}</span>
                  <Badge variant="secondary" className="ml-1">{bookCount}</Badge>
                </button>
              );
            })}
            
            <Dialog open={isCreateCollectionOpen} onOpenChange={setCreateCollectionOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Collection</DialogTitle>
                  <DialogDescription>
                    Create a new collection to organize your books.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Collection Name</Label>
                    <Input
                      id="name"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      placeholder="Enter collection name..."
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="public"
                      checked={newCollectionIsPublic}
                      onCheckedChange={(checked) => setNewCollectionIsPublic(!!checked)}
                    />
                    <Label htmlFor="public">Make collection public</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={createCollection} disabled={!newCollectionName.trim()}>
                    Create Collection
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {isSearching ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Searching books...</p>
              </div>
            </div>
          ) : searchResults.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Search Results ({searchResults.length})</h2>
                <Button variant="outline" onClick={clearSearch}>
                  Clear Search
                </Button>
              </div>
              <div className={viewMode === "grid" 
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                : "space-y-4"
              }>
                {searchResults.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    collections={collections}
                    isInCollections={savedBooks.some(b => b.id === book.id)}
                    onAddToCollection={addBookToCollection}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </div>
          ) : filteredAndSortedBooks.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No books found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? "Try a different search term"
                  : "Start by searching for books"
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => setSearchQuery("")}>
                  Search Books
                </Button>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">
                  {selectedCollection === "all" 
                    ? "All Books" 
                    : getCollectionInfo(selectedCollection)?.name || "Books"
                  } ({filteredAndSortedBooks.length})
                </h2>
              </div>
              <div className={viewMode === "grid" 
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                : "space-y-4"
              }>
                {filteredAndSortedBooks.map((book) => (
                  <SavedBookCard
                    key={book.id}
                    book={book}
                    collections={collections}
                    onRemoveFromCollection={removeBookFromCollection}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Book Card Component for Search Results
function BookCard({ 
  book, 
  collections, 
  isInCollections, 
  onAddToCollection, 
  viewMode 
}: {
  book: SearchResult;
  collections: Collection[];
  isInCollections: boolean;
  onAddToCollection: (book: SearchResult, collectionId: string) => void;
  viewMode: "grid" | "list";
}) {
  if (viewMode === "list") {
    return (
      <Card className="flex items-center space-x-4 p-4 hover:shadow-lg transition-shadow">
        <div className="relative w-16 h-24 flex-shrink-0">
          <Image
            src={book.cover}
            alt={book.title}
            fill
            className="object-cover rounded"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{book.title}</h3>
          <p className="text-sm text-muted-foreground">{book.author}</p>
          <p className="text-sm text-muted-foreground">{book.year || 'N/A'}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {collections.map((collection) => (
              <DropdownMenuItem
                key={collection.id}
                onClick={() => onAddToCollection(book, collection.id)}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${collection.color || 'bg-gray-500'}`} />
                  {collection.name}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </Card>
    );
  }

  return (
    <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="relative aspect-[2/3]">
        <Image
          src={book.cover}
          alt={book.title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="flex flex-col gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="secondary">
                  <Plus className="h-4 w-4 mr-1" />
                  Add to Collection
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {collections.map((collection) => (
                  <DropdownMenuItem
                    key={collection.id}
                    onClick={() => onAddToCollection(book, collection.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${collection.color || 'bg-gray-500'}`} />
                      {collection.name}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              size="sm" 
              variant="secondary"
              asChild
            >
              <Link href={`/books/${book.id}`}>
                View Details
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <CardContent className="p-3">
        <h3 className="font-semibold text-sm truncate">{book.title}</h3>
        <p className="text-xs text-muted-foreground">{book.author}</p>
        <p className="text-xs text-muted-foreground">{book.year || 'N/A'}</p>
      </CardContent>
    </Card>
  );
}

// Saved Book Card Component
function SavedBookCard({ 
  book, 
  collections, 
  onRemoveFromCollection, 
  viewMode 
}: {
  book: Book;
  collections: Collection[];
  onRemoveFromCollection: (bookId: string, collectionId: string) => void;
  viewMode: "grid" | "list";
}) {
  if (viewMode === "list") {
    return (
      <Card className="flex items-center space-x-4 p-4 hover:shadow-lg transition-shadow">
        <div className="relative w-16 h-24 flex-shrink-0">
          <Image
            src={book.cover}
            alt={book.title}
            fill
            className="object-cover rounded"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{book.title}</h3>
          <p className="text-sm text-muted-foreground">{book.author}</p>
          <p className="text-sm text-muted-foreground">{book.year || 'N/A'}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {book.collections?.map((collectionId) => {
              const collection = collections.find(c => c.id === collectionId);
              return collection ? (
                <Badge key={collectionId} variant="outline" className="text-xs">
                  {collection.name}
                </Badge>
              ) : null;
            })}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {book.collections?.map((collectionId) => {
              const collection = collections.find(c => c.id === collectionId);
              return collection ? (
                <DropdownMenuItem
                  key={collectionId}
                  onClick={() => onRemoveFromCollection(book.id, collectionId)}
                >
                  Remove from {collection.name}
                </DropdownMenuItem>
              ) : null;
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </Card>
    );
  }

  return (
    <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="relative aspect-[2/3]">
        <Image
          src={book.cover}
          alt={book.title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="secondary">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {book.collections?.map((collectionId) => {
                const collection = collections.find(c => c.id === collectionId);
                return collection ? (
                  <DropdownMenuItem
                    key={collectionId}
                    onClick={() => onRemoveFromCollection(book.id, collectionId)}
                  >
                    Remove from {collection.name}
                  </DropdownMenuItem>
                ) : null;
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <CardContent className="p-3">
        <h3 className="font-semibold text-sm truncate">{book.title}</h3>
        <p className="text-xs text-muted-foreground">{book.author}</p>
        <p className="text-xs text-muted-foreground">{book.year || 'N/A'}</p>
        <div className="flex flex-wrap gap-1 mt-2">
          {book.collections?.slice(0, 2).map((collectionId) => {
            const collection = collections.find(c => c.id === collectionId);
            return collection ? (
              <Badge key={collectionId} variant="outline" className="text-xs">
                {collection.name}
              </Badge>
            ) : null;
          })}
          {book.collections && book.collections.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{book.collections.length - 2}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { use } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, BookOpen, Plus, Heart, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface BookDetail {
  id: string;
  title: string;
  authors: string[];
  description: string;
  imageLinks?: {
    thumbnail: string;
    smallThumbnail: string;
  };
  publishedDate: string;
  pageCount: number;
  categories: string[];
  averageRating: number;
  ratingsCount: number;
  publisher: string;
  language: string;
  previewLink: string;
  infoLink: string;
}

interface UserList {
  id: string;
  name: string;
  isPublic?: boolean;
}

export default function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { user, loading: authLoading } = useCurrentUser();
  const router = useRouter();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLists, setUserLists] = useState<UserList[]>([]);
  const [selectedListId, setSelectedListId] = useState("");
  const [addToListOpen, setAddToListOpen] = useState(false);
  const [isSavingToList, setIsSavingToList] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Default collections for books
  const defaultCollections = [
    { name: "Reading", isDefault: true, color: "bg-green-500" },
    { name: "Completed", isDefault: true, color: "bg-yellow-500" },
    { name: "To Read", isDefault: true, color: "bg-purple-500" },
    { name: "Dropped", isDefault: true, color: "bg-red-500" },
    { name: "Recommendations", isDefault: true, color: "bg-blue-500" },
  ];

  useEffect(() => {
    if (!authLoading && user === null) {
      router.replace("/login");
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchBookDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/books/${resolvedParams.id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch book details");
        }

        const data = await response.json();
        setBook(data.volumeInfo);
      } catch (err) {
        setError("Failed to load book details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserLists = async () => {
      if (!user?.uid) return;
      try {
        const listsRef = collection(db, "users", user.uid, "bookCollections");
        const snapshot = await getDocs(listsRef);
        const listsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as UserList[];

        // Create default collections if they don't exist
        const existingNames = listsData.map((col) => col.name);
        const missingDefaults = defaultCollections.filter(
          (col) => !existingNames.includes(col.name)
        );

        if (missingDefaults.length > 0) {
          for (const defaultCol of missingDefaults) {
            await addDoc(listsRef, defaultCol);
          }
          // Refetch collections
          const newSnapshot = await getDocs(listsRef);
          const allLists = newSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as UserList[];
          setUserLists(allLists);
        } else {
          setUserLists(listsData);
        }
      } catch (err) {
        console.error("Error fetching user lists:", err);
      }
    };

    fetchBookDetails();
    fetchUserLists();
  }, [resolvedParams.id, user]);

  const handleAddToList = async () => {
    if (!user?.uid || !selectedListId || !book) return;

    setIsSavingToList(true);
    try {
      // Add book to the main books collection
      const bookData = {
        id: resolvedParams.id,
        title: book.title,
        author: book.authors?.join(", ") || "Unknown Author",
        year: book.publishedDate
          ? new Date(book.publishedDate).getFullYear()
          : new Date().getFullYear(),
        cover: book.imageLinks?.thumbnail || "/placeholder.svg",
        rating: book.averageRating || 0,
        notes: "",
        status: "To Read",
        collections: [selectedListId],
        overview: book.description || "",
        publishedDate: book.publishedDate || "",
        pageCount: book.pageCount || 0,
      };

      await setDoc(
        doc(db, "users", user.uid, "books", resolvedParams.id),
        bookData
      );

      // If adding to Recommendations collection, also add to the recommendations subcollection
      const selectedCollection = userLists.find(
        (list) => list.id === selectedListId
      );
      if (selectedCollection && selectedCollection.name === "Recommendations") {
        try {
          const recommendationsRef = collection(
            db,
            "users",
            user.uid,
            "bookRecommendations"
          );
          await setDoc(doc(recommendationsRef, resolvedParams.id), {
            id: resolvedParams.id,
            title: book.title,
            author: book.authors?.join(", ") || "Unknown Author",
            year: new Date(book.publishedDate).getFullYear(),
            cover: book.imageLinks?.thumbnail || "/placeholder.svg",
            overview: book.description || "",
            publishedDate: book.publishedDate || "",
            pageCount: book.pageCount || 0,
            addedAt: new Date(),
            isPublic: true,
          });
        } catch (error) {
          console.error(
            "Error adding to recommendations subcollection:",
            error
          );
        }
      }

      setAddToListOpen(false);
      setSelectedListId("");
    } catch (err) {
      console.error("Error adding book to list:", err);
      alert("Failed to add book to list. Please try again.");
    } finally {
      setIsSavingToList(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user === null) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading book details...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || "Book not found"}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Cover */}
          <div className="lg:col-span-1">
            <div className="relative">
              <Image
                src={
                  book.imageLinks?.thumbnail
                    ? book.imageLinks.thumbnail.replace("http://", "https://")
                    : "/placeholder.svg"
                }
                alt={book.title}
                width={400}
                height={600}
                className="rounded-lg shadow-lg w-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder.svg";
                }}
              />
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {book.title}
              </h1>
              {book.authors && (
                <p className="text-lg text-muted-foreground mb-4">
                  by {book.authors.join(", ")}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div
                className="text-gray-700 dark:text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html:
                    book.description ||
                    "No description available for this book.",
                }}
              />

              <div className="flex items-center gap-4">
                <Button size="sm" variant="outline" asChild>
                  <a
                    href={book.previewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Preview
                  </a>
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    router.push(
                      `/reviews?type=book&id=${
                        resolvedParams.id
                      }&title=${encodeURIComponent(
                        book.title
                      )}&author=${encodeURIComponent(
                        book.authors?.join(", ") || "Unknown Author"
                      )}&cover=${encodeURIComponent(
                        book.imageLinks?.thumbnail
                          ? book.imageLinks.thumbnail.replace(
                              "http://",
                              "https://"
                            )
                          : "/placeholder.svg"
                      )}`
                    )
                  }
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Write Review
                </Button>
                {book.averageRating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {book.averageRating.toFixed(1)}
                    </span>
                    {book.ratingsCount && (
                      <span className="text-sm text-muted-foreground">
                        ({book.ratingsCount} ratings)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8">
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Heart className="w-4 h-4 mr-2" />
                  Wishlist
                </Button>
                <Dialog open={addToListOpen} onOpenChange={setAddToListOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add to List
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add to List</DialogTitle>
                      <DialogDescription>
                        Choose a list to add "{book.title}" to.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {userLists.length > 0 ? (
                        <div className="space-y-2">
                          {userLists.map((list) => (
                            <label
                              key={list.id}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <input
                                type="radio"
                                name="book-list"
                                value={list.id}
                                checked={selectedListId === list.id}
                                onChange={() => setSelectedListId(list.id)}
                              />
                              <span>{list.name}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          No lists available. Create a list first.
                        </p>
                      )}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={handleAddToList}
                        disabled={isSavingToList || !selectedListId}
                      >
                        {isSavingToList ? "Saving..." : "Add to List"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
          {/* Navigation Tabs */}
          <div className="flex space-x-8 mb-6 border-b border-gray-200 dark:border-gray-700">
            {["all", "reviews", "similar", "thread", "posts"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 px-1 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="min-h-[400px] bg-card rounded-lg p-6">
            {activeTab === "all" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Book Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Published:</span>
                    <p>
                      {book.publishedDate
                        ? new Date(book.publishedDate).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pages:</span>
                    <p>{book.pageCount || "Unknown"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Publisher:</span>
                    <p>{book.publisher || "Unknown"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Language:</span>
                    <p>{book.language?.toUpperCase() || "Unknown"}</p>
                  </div>
                </div>
                {book.categories && (
                  <div>
                    <span className="text-muted-foreground">Categories:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {book.categories.map((category, index) => (
                        <Badge key={index} variant="secondary">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === "reviews" && (
              <div className="text-center text-muted-foreground py-8">
                <p>Reviews coming soon...</p>
              </div>
            )}
            {activeTab === "similar" && (
              <div className="text-center text-muted-foreground py-8">
                <p>Similar books coming soon...</p>
              </div>
            )}
            {activeTab === "thread" && (
              <div className="text-center text-muted-foreground py-8">
                <p>Discussion threads coming soon...</p>
              </div>
            )}
            {activeTab === "posts" && (
              <div className="text-center text-muted-foreground py-8">
                <p>Community posts coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

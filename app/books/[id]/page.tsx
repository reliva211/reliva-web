"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { use } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  BookOpen,
  Plus,
  Heart,
  Edit,
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Book,
} from "lucide-react";
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
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [addToListOpen, setAddToListOpen] = useState(false);
  const [isSavingToList, setIsSavingToList] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Helper function to truncate description to 100 words
  const truncateDescription = (text: string, wordLimit: number = 100) => {
    if (!text) return "";
    const words = text.split(" ");
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(" ") + "...";
  };

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
    if (!user?.uid || selectedListIds.length === 0 || !book) return;

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
        collections: selectedListIds,
        overview: book.description || "",
        publishedDate: book.publishedDate || "",
        pageCount: book.pageCount || 0,
      };

      await setDoc(
        doc(db, "users", user.uid, "books", resolvedParams.id),
        bookData
      );

      // If adding to Recommendations collection, also add to the recommendations subcollection
      const selectedCollections = userLists.filter((list) =>
        selectedListIds.includes(list.id)
      );
      const recommendationsCollection = selectedCollections.find(
        (list) => list.name === "Recommendations"
      );

      if (recommendationsCollection) {
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
      setSelectedListIds([]);
    } catch (err) {
      console.error("Error adding book to list:", err);
      alert("Failed to add book to list. Please try again.");
    } finally {
      setIsSavingToList(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user === null) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading book details...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
          <p className="text-destructive mb-6">{error || "Book not found"}</p>
          <Button onClick={() => router.back()} className="rounded-xl">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-8 rounded-xl hover:bg-muted/50 transition-all duration-200 group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back
        </Button>

        {/* Hero Section with Backdrop */}
        <div className="relative mb-12 rounded-3xl overflow-hidden">
          {book.imageLinks?.thumbnail && (
            <>
              <div className="absolute inset-0">
                <Image
                  src={book.imageLinks.thumbnail.replace("http://", "https://")}
                  alt={book.title}
                  fill
                  className="object-cover blur-sm"
                  priority
                />
              </div>
              {/* Overlay to reduce background image opacity */}
              <div className="absolute inset-0 bg-black/60"></div>
            </>
          )}

          <div className="relative z-10 p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              {/* Cover */}
              <div className="lg:col-span-1 lg:sticky lg:top-8">
                <div className="relative group max-w-xs mx-auto lg:mx-0">
                  <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-gradient-to-br from-muted to-muted/50 shadow-2xl group-hover:shadow-3xl transition-all duration-300">
                    <Image
                      src={
                        book.imageLinks?.thumbnail
                          ? book.imageLinks.thumbnail.replace(
                              "http://",
                              "https://"
                            )
                          : "/placeholder.svg"
                      }
                      alt={book.title}
                      width={400}
                      height={600}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder.svg";
                      }}
                    />
                  </div>
                  {/* Subtle overlay gradient */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none"></div>
                </div>
              </div>

              {/* Details */}
              <div className="lg:col-span-2 space-y-4">
                <div className="space-y-2">
                  <h1 className="text-4xl lg:text-6xl font-bold text-white drop-shadow-2xl">
                    {book.title}
                  </h1>
                  {book.authors && (
                    <p className="text-lg lg:text-xl text-white italic drop-shadow-lg">
                      by {book.authors.join(", ")}
                    </p>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background/60 backdrop-blur-sm border border-border/50 shadow-lg">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {book.publishedDate
                        ? new Date(book.publishedDate).getFullYear()
                        : "Unknown"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background/60 backdrop-blur-sm border border-border/50 shadow-lg">
                    <Book className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {book.pageCount || "Unknown"} Pages
                    </span>
                  </div>
                  {book.averageRating && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background/60 backdrop-blur-sm border border-border/50 shadow-lg">
                      <Star className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        {book.averageRating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Overview */}
                <div className="p-6 rounded-2xl bg-background/60 backdrop-blur-sm border border-border/50 shadow-lg">
                  <div className="text-foreground leading-relaxed text-base">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: showFullDescription
                          ? book.description ||
                            "No description available for this book."
                          : truncateDescription(
                              book.description ||
                                "No description available for this book."
                            ),
                      }}
                    />
                    {book.description &&
                      book.description.split(" ").length > 100 && (
                        <button
                          onClick={() =>
                            setShowFullDescription(!showFullDescription)
                          }
                          className="mt-3 text-emerald-400 hover:text-emerald-300 font-medium transition-colors duration-200 underline"
                        >
                          {showFullDescription ? "Read Less" : "Read More"}
                        </button>
                      )}
                  </div>
                </div>

                {/* Categories */}
                {book.categories && (
                  <div className="flex flex-wrap gap-2">
                    {book.categories.map((category, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="rounded-lg px-3 py-1 text-sm font-medium bg-white/20 text-white border-white/30"
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-4">
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="rounded-xl hover:bg-muted/50 transition-all duration-200 group bg-background/60 border-border/50"
                  >
                    <a
                      href={book.previewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <BookOpen className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                      Preview
                    </a>
                  </Button>
                  <Button
                    size="lg"
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
                    className="rounded-xl hover:scale-105 transition-all duration-200"
                  >
                    <Star className="w-5 h-5 mr-2" />
                    Rate
                  </Button>
                  <Dialog open={addToListOpen} onOpenChange={setAddToListOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="lg"
                        className="rounded-xl hover:scale-105 transition-all duration-200"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Add to List
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl">
                      <DialogHeader>
                        <DialogTitle>Add to List</DialogTitle>
                        <DialogDescription>
                          Choose one or more lists to add "{book.title}" to.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {userLists.length > 0 ? (
                          <div className="space-y-2">
                            {userLists.map((list) => (
                              <label
                                key={list.id}
                                className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-muted/50 transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  value={list.id}
                                  checked={selectedListIds.includes(list.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedListIds([
                                        ...selectedListIds,
                                        list.id,
                                      ]);
                                    } else {
                                      setSelectedListIds(
                                        selectedListIds.filter(
                                          (id) => id !== list.id
                                        )
                                      );
                                    }
                                  }}
                                  className="text-primary rounded"
                                />
                                <span className="font-medium">{list.name}</span>
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
                          disabled={
                            isSavingToList || selectedListIds.length === 0
                          }
                          className="rounded-xl"
                        >
                          {isSavingToList
                            ? "Saving..."
                            : `Add to ${
                                selectedListIds.length > 1
                                  ? `${selectedListIds.length} Lists`
                                  : "List"
                              }`}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="space-y-8">
          {/* Navigation Tabs */}
          <div className="flex justify-center">
            <div className="inline-flex h-14 items-center justify-center rounded-2xl bg-muted/30 backdrop-blur-sm border border-border/20 p-1 gap-1">
              {["overview", "reviews", "similar"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-xl px-6 py-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                    activeTab === tab
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="min-h-[400px] bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border/30 shadow-lg">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  Book Information
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="p-4 rounded-xl bg-muted/30 backdrop-blur-sm border border-border/20">
                    <span className="text-muted-foreground text-sm">
                      Published
                    </span>
                    <p className="font-medium">
                      {book.publishedDate
                        ? new Date(book.publishedDate).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30 backdrop-blur-sm border border-border/20">
                    <span className="text-muted-foreground text-sm">Pages</span>
                    <p className="font-medium">{book.pageCount || "Unknown"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30 backdrop-blur-sm border border-border/20">
                    <span className="text-muted-foreground text-sm">
                      Publisher
                    </span>
                    <p className="font-medium">{book.publisher || "Unknown"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30 backdrop-blur-sm border border-border/20">
                    <span className="text-muted-foreground text-sm">
                      Language
                    </span>
                    <p className="font-medium">
                      {book.language?.toUpperCase() || "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "reviews" && (
              <div className="text-center text-muted-foreground py-12">
                <p className="text-lg">Reviews coming soon...</p>
              </div>
            )}
            {activeTab === "similar" && (
              <div className="text-center text-muted-foreground py-12">
                <p className="text-lg">Similar books coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

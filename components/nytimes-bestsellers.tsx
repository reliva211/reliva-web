"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, BookOpen, TrendingUp, AlertCircle } from "lucide-react";
import { useNYTimesBooks } from "@/hooks/use-nytimes-books";
import Image from "next/image";
import Link from "next/link";

interface NYTimesBestsellersProps {
  maxBooks?: number;
  showListSelector?: boolean;
  defaultList?: string;
}

const POPULAR_LISTS = [
  { value: "hardcover-fiction", label: "Hardcover Fiction" },
  { value: "hardcover-nonfiction", label: "Hardcover Nonfiction" },
  { value: "paperback-fiction", label: "Paperback Fiction" },
  { value: "paperback-nonfiction", label: "Paperback Nonfiction" },
  { value: "advice-how-to-and-miscellaneous", label: "Advice & How-To" },
  {
    value: "childrens-middle-grade-hardcover",
    label: "Children's Middle Grade",
  },
  { value: "young-adult-hardcover", label: "Young Adult" },
];

export function NYTimesBestsellers({
  maxBooks = 10,
  showListSelector = true,
  defaultList = "hardcover-fiction",
}: NYTimesBestsellersProps) {
  const { books, lists, loading, error, fetchOverview, fetchList, clearError } =
    useNYTimesBooks();
  const [selectedList, setSelectedList] = useState(defaultList);
  const [showAllLists, setShowAllLists] = useState(false);

  useEffect(() => {
    if (showListSelector && selectedList) {
      fetchList(selectedList);
    } else {
      fetchOverview();
    }
  }, [selectedList, showListSelector, fetchList, fetchOverview]);

  const handleListChange = (value: string) => {
    setSelectedList(value);
    clearError();
  };

  const handleRefresh = () => {
    if (showListSelector && selectedList) {
      fetchList(selectedList);
    } else {
      fetchOverview();
    }
  };

  const displayBooks = books.slice(0, maxBooks);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            NYTimes Bestsellers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.includes("API key not configured")
                ? "NYTimes API key not configured. Please add NYTIMES_API_KEY to your environment variables."
                : error}
            </AlertDescription>
          </Alert>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="mt-4"
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            NYTimes Bestsellers
          </CardTitle>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {showListSelector && (
          <div className="flex items-center gap-2">
            <Select value={selectedList} onValueChange={handleListChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a list" />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_LISTS.map((list) => (
                  <SelectItem key={list.value} value={list.value}>
                    {list.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllLists(!showAllLists)}
            >
              {showAllLists ? "Show Popular" : "Show All Lists"}
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-16 w-12" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : displayBooks.length > 0 ? (
          <div className="space-y-4">
            {displayBooks.map((book, index) => (
              <div
                key={book.id}
                className="flex gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="relative h-16 w-12 flex-shrink-0">
                  <Image
                    src={book.cover || "/placeholder.svg"}
                    alt={book.title}
                    fill
                    className="object-cover rounded"
                    sizes="48px"
                  />
                  {book.rank && (
                    <Badge
                      variant="secondary"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                    >
                      {book.rank}
                    </Badge>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        by {book.author}
                      </p>
                      {book.overview && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {book.overview}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                      {book.year && <span>{book.year}</span>}
                      {book.weeks_on_list && (
                        <Badge variant="outline" className="text-xs">
                          {book.weeks_on_list} weeks
                        </Badge>
                      )}
                    </div>
                  </div>

                  {book.listName && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {book.listName}
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            {books.length > maxBooks && (
              <div className="text-center pt-4">
                <Button variant="outline" size="sm">
                  View All ({books.length} books)
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No books found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Star } from "lucide-react";

export interface SearchModalProps<T> {
  isOpen: boolean;
  onOpenChangeAction: (open: boolean) => void;
  title: string;
  searchQuery: string;
  setSearchQueryAction: (query: string) => void;
  searchResults: T[];
  isSearching: boolean;
  onSearchAction: (query: string) => void;
  onItemClickAction: (item: T) => void;
  itemType: "movie" | "series" | "book" | "music";
  error?: string | null;
}

export function SearchModal<T>({
  isOpen,
  onOpenChangeAction,
  title,
  searchQuery,
  setSearchQueryAction,
  searchResults,
  isSearching,
  onSearchAction,
  onItemClickAction,
  itemType,
  error,
}: SearchModalProps<T>) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Input changed
    setSearchQueryAction(value);
    // Trigger search with debouncing
    onSearchAction(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearchAction(searchQuery);
    }
  };

  const handleSearchClick = () => {
    onSearchAction(searchQuery);
  };

  const getItemImage = (item: any) => {
    if (itemType === "movie" || itemType === "series") {
      return item.poster_path
        ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
        : "/placeholder.svg";
    } else if (itemType === "book") {
      return item.volumeInfo?.imageLinks?.thumbnail || "/placeholder.svg";
    }
    return "/placeholder.svg";
  };

  const getItemTitle = (item: any) => {
    if (itemType === "movie" || itemType === "series") {
      return item.title || item.name || "Unknown";
    } else if (itemType === "book") {
      return item.volumeInfo?.title || "Unknown";
    }
    return "Unknown";
  };

  const getItemSubtitle = (item: any) => {
    if (itemType === "movie") {
      const year = new Date(item.release_date).getFullYear();
      return !isNaN(year) ? year.toString() : "";
    } else if (itemType === "series") {
      const year = new Date(item.first_air_date).getFullYear();
      return !isNaN(year) ? year.toString() : "";
    } else if (itemType === "book") {
      return item.volumeInfo?.authors?.join(", ") || "Unknown Author";
    }
    return "";
  };

  const getItemRating = (item: any) => {
    if (itemType === "movie" || itemType === "series") {
      const rating = item.vote_average;
      return rating && !isNaN(rating) ? rating.toFixed(1) : "0.0";
    } else if (itemType === "book") {
      const rating = item.volumeInfo?.averageRating;
      return rating && !isNaN(rating) ? rating.toFixed(1) : "0.0";
    }
    return "0.0";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChangeAction}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder={`Search for ${itemType}s...`}
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              autoFocus
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleSearchClick}
              disabled={isSearching || !searchQuery.trim()}
              className="w-full sm:w-auto"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {error && (
            <div className="text-center py-4">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {searchQuery.trim() &&
            !isSearching &&
            searchResults.length === 0 &&
            !error && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  Type your search and press Enter or click Search button
                </p>
              </div>
            )}

          {isSearching && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Searching...</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-h-96 overflow-y-auto">
              {searchResults.map((item: any) => (
                <div
                  key={item.id}
                  className="flex gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => onItemClickAction(item)}
                >
                  <div className="w-12 h-18 sm:w-16 sm:h-24 relative rounded overflow-hidden flex-shrink-0">
                    <Image
                      src={getItemImage(item)}
                      alt={getItemTitle(item)}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate text-sm sm:text-base">
                      {getItemTitle(item)}
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {getItemSubtitle(item)}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-2 w-2 sm:h-3 sm:w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs">{getItemRating(item)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

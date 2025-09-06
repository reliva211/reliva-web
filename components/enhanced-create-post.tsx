"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Book, Music, Film, Loader2 } from "lucide-react";
import { ImageUploadPreview } from "@/components/image-upload-preview";
import { PostSuccessToast } from "@/components/post-success-toast";

interface EnhancedCreatePostProps {
  children: React.ReactNode;
  onAddPostAction: (post: {
    user: { name: string; username: string; avatar: string };
    content: string;
    category: "book" | "music" | "movie";
    images?: string[];
  }) => void;
}

const categoryIcons = {
  book: Book,
  music: Music,
  movie: Film,
};

const categoryPlaceholders = {
  book: "What book are you reading or recommending?",
  music: "What music are you listening to lately?",
  movie: "What movie or show would you recommend?",
};

export function EnhancedCreatePost({
  children,
  onAddPostAction,
}: EnhancedCreatePostProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<"book" | "music" | "movie">("book");
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // Create a copy of current images to avoid exceeding 4 images
      const currentImages = [...images];

      // Process each file
      Array.from(files).forEach((file) => {
        // Only add if we have less than 4 images
        if (currentImages.length < 4) {
          const imageUrl = URL.createObjectURL(file);
          currentImages.push(imageUrl);
        }
      });

      setImages(currentImages);

      // Reset the input value to allow selecting the same file again
      event.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (content.trim()) {
      setIsSubmitting(true);

      try {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        onAddPostAction({
          user: {
            name: "You",
            username: "you",
            avatar: "/placeholder.svg?height=40&width=40",
          },
          content: content.trim(),
          category,
          images: images.length > 0 ? images : undefined,
        });

        // Reset form
        setContent("");
        setImages([]);
        setOpen(false);

        // Show success toast
        setShowSuccessToast(true);
      } catch (error) {
        console.error("Error posting:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handlePost();
    }
  };

  const CategoryIcon = categoryIcons[category];

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[600px] mx-auto">
          <DialogHeader>
            <DialogTitle>Create a post</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="flex items-center space-x-3 sm:block">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src="/placeholder.svg?height=40&width=40"
                  alt="You"
                />
                <AvatarFallback>You</AvatarFallback>
              </Avatar>
              
              {/* Category Selection - Mobile Layout */}
              <div className="flex items-center space-x-2 sm:hidden">
                <span className="text-sm font-medium">Category:</span>
                <Select
                  value={category}
                  onValueChange={(value: "book" | "music" | "movie") =>
                    setCategory(value)
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="book">
                      <div className="flex items-center space-x-2">
                        <Book className="w-4 h-4" />
                        <span>Book</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="music">
                      <div className="flex items-center space-x-2">
                        <Music className="w-4 h-4" />
                        <span>Music</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="movie">
                      <div className="flex items-center space-x-2">
                        <Film className="w-4 h-4" />
                        <span>Movie</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant="secondary">
                  <CategoryIcon className="w-3 h-3 mr-1" />
                  {category.toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              {/* Category Selection - Desktop Layout */}
              <div className="hidden sm:flex items-center space-x-2">
                <span className="text-sm font-medium">Category:</span>
                <Select
                  value={category}
                  onValueChange={(value: "book" | "music" | "movie") =>
                    setCategory(value)
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="book">
                      <div className="flex items-center space-x-2">
                        <Book className="w-4 h-4" />
                        <span>Book</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="music">
                      <div className="flex items-center space-x-2">
                        <Music className="w-4 h-4" />
                        <span>Music</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="movie">
                      <div className="flex items-center space-x-2">
                        <Film className="w-4 h-4" />
                        <span>Movie</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant="secondary" className="ml-2">
                  <CategoryIcon className="w-3 h-3 mr-1" />
                  {category.toUpperCase()}
                </Badge>
              </div>

              {/* Text Area */}
              <Textarea
                placeholder={categoryPlaceholders[category]}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[120px] text-lg border-none resize-none focus-visible:ring-0 p-0"
                maxLength={280}
                disabled={isSubmitting}
              />

              {/* Character Count */}
              <div className="text-right">
                <span
                  className={`text-sm ${
                    content.length > 250
                      ? "text-red-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {content.length}/280
                </span>
              </div>

              {/* Image Preview */}
              <ImageUploadPreview images={images} onRemove={removeImage} />

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    id="image-upload"
                    ref={fileInputRef}
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={images.length >= 4 || isSubmitting}
                    aria-label="Add images"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  {images.length >= 4 && (
                    <span className="text-xs text-muted-foreground">
                      Max 4 images
                    </span>
                  )}
                </div>

                <Button
                  onClick={handlePost}
                  disabled={
                    !content.trim() || content.length > 280 || isSubmitting
                  }
                  className="w-full sm:w-auto px-6"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    "Post"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PostSuccessToast
        show={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
      />
    </>
  );
}

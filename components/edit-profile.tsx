"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { UserProfile } from "@/hooks/use-profile";
import { Loader2 } from "lucide-react";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: UserProfile;
  onSave: (updates: Partial<UserProfile>) => Promise<void>;
  saving: boolean;
}

export function EditProfileDialog({
  open,
  onOpenChange,
  profile,
  onSave,
  saving,
}: EditProfileDialogProps) {
  const [formData, setFormData] = useState({
    displayName: profile.displayName,
    username: profile.username,
    bio: profile.bio,
    visibleSections: {
      music: profile.visibleSections?.music ?? true,
      movies: profile.visibleSections?.movies ?? true,
      series: profile.visibleSections?.series ?? true,
      books: profile.visibleSections?.books ?? true,
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await onSave({
        ...formData,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateVisibleSection = (section: string, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      visibleSections: {
        ...prev.visibleSections,
        [section]: value,
      },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => updateFormData("displayName", e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => updateFormData("username", e.target.value)}
                placeholder="@username"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => updateFormData("bio", e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Profile Sections
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  updateVisibleSection("music", !formData.visibleSections.music)
                }
                className={`relative flex items-center justify-center px-4 py-3 rounded-xl border-2 transition-all duration-200 font-medium text-sm ${
                  formData.visibleSections.music
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-400"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-750"
                }`}
              >
                {formData.visibleSections.music && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full"></div>
                )}
                <span className="flex items-center gap-2">
                  <span className="text-lg">🎵</span>
                  Music
                </span>
              </button>
              
              <button
                type="button"
                onClick={() =>
                  updateVisibleSection("movies", !formData.visibleSections.movies)
                }
                className={`relative flex items-center justify-center px-4 py-3 rounded-xl border-2 transition-all duration-200 font-medium text-sm ${
                  formData.visibleSections.movies
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-400"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-750"
                }`}
              >
                {formData.visibleSections.movies && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full"></div>
                )}
                <span className="flex items-center gap-2">
                  <span className="text-lg">🎬</span>
                  Movies
                </span>
              </button>
              
              <button
                type="button"
                onClick={() =>
                  updateVisibleSection("series", !formData.visibleSections.series)
                }
                className={`relative flex items-center justify-center px-4 py-3 rounded-xl border-2 transition-all duration-200 font-medium text-sm ${
                  formData.visibleSections.series
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-400"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-750"
                }`}
              >
                {formData.visibleSections.series && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full"></div>
                )}
                <span className="flex items-center gap-2">
                  <span className="text-lg">📺</span>
                  Series
                </span>
              </button>
              
              <button
                type="button"
                onClick={() =>
                  updateVisibleSection("books", !formData.visibleSections.books)
                }
                className={`relative flex items-center justify-center px-4 py-3 rounded-xl border-2 transition-all duration-200 font-medium text-sm ${
                  formData.visibleSections.books
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-400"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-750"
                }`}
              >
                {formData.visibleSections.books && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full"></div>
                )}
                <span className="flex items-center gap-2">
                  <span className="text-lg">📚</span>
                  Books
                </span>
              </button>
            </div>
          </div>



          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

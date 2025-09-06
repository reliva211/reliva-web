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
            <div className="space-y-2">
              <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <span className="text-lg">🎵</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">Music</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Share your music</p>
                  </div>
                </div>
                <Switch
                  checked={formData.visibleSections.music}
                  onCheckedChange={(checked) => updateVisibleSection("music", checked)}
                />
              </div>

              <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <span className="text-lg">🎬</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">Movies</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Share your movies</p>
                  </div>
                </div>
                <Switch
                  checked={formData.visibleSections.movies}
                  onCheckedChange={(checked) => updateVisibleSection("movies", checked)}
                />
              </div>

              <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <span className="text-lg">📺</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">Series</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Share your series</p>
                  </div>
                </div>
                <Switch
                  checked={formData.visibleSections.series}
                  onCheckedChange={(checked) => updateVisibleSection("series", checked)}
                />
              </div>

              <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <span className="text-lg">📚</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">Books</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Share your books</p>
                  </div>
                </div>
                <Switch
                  checked={formData.visibleSections.books}
                  onCheckedChange={(checked) => updateVisibleSection("books", checked)}
                />
              </div>
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

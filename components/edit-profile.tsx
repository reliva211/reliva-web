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
    location: profile.location,
    tagline: profile.tagline,
    isPublic: profile.isPublic,
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
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={formData.tagline}
              onChange={(e) => updateFormData("tagline", e.target.value)}
              placeholder="Music • Movies • Books"
            />
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

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => updateFormData("location", e.target.value)}
              placeholder="City, Country"
            />
          </div>

          <div className="space-y-4">
            <Label>Profile Sections</Label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={formData.visibleSections.music ? "default" : "outline"}
                onClick={() =>
                  updateVisibleSection("music", !formData.visibleSections.music)
                }
                className={`w-full ${
                  formData.visibleSections.music
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {formData.visibleSections.music ? "✓ Music" : "Music"}
              </Button>
              <Button
                type="button"
                variant={
                  formData.visibleSections.movies ? "default" : "outline"
                }
                onClick={() =>
                  updateVisibleSection(
                    "movies",
                    !formData.visibleSections.movies
                  )
                }
                className={`w-full ${
                  formData.visibleSections.movies
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {formData.visibleSections.movies ? "✓ Movies" : "Movies"}
              </Button>
              <Button
                type="button"
                variant={
                  formData.visibleSections.series ? "default" : "outline"
                }
                onClick={() =>
                  updateVisibleSection(
                    "series",
                    !formData.visibleSections.series
                  )
                }
                className={`w-full ${
                  formData.visibleSections.series
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {formData.visibleSections.series ? "✓ Series" : "Series"}
              </Button>
              <Button
                type="button"
                variant={formData.visibleSections.books ? "default" : "outline"}
                onClick={() =>
                  updateVisibleSection("books", !formData.visibleSections.books)
                }
                className={`w-full ${
                  formData.visibleSections.books
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {formData.visibleSections.books ? "✓ Books" : "Books"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Profile Visibility</Label>
            <Button
              type="button"
              variant={formData.isPublic ? "default" : "outline"}
              onClick={() => updateFormData("isPublic", !formData.isPublic)}
              className={`w-full ${
                formData.isPublic
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              {formData.isPublic ? "✓ Public Profile" : "Private Profile"}
            </Button>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

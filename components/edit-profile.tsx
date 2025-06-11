"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { UserProfile } from "@/hooks/use-profile"
import { Loader2 } from "lucide-react"

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: UserProfile
  onSave: (updates: Partial<UserProfile>) => Promise<void>
  saving: boolean
}

export function EditProfileDialog({ open, onOpenChange, profile, onSave, saving }: EditProfileDialogProps) {
  const [formData, setFormData] = useState({
    displayName: profile.displayName,
    username: profile.username,
    bio: profile.bio,
    location: profile.location,
    website: profile.website,
    tagline: profile.tagline,
    isPublic: profile.isPublic,
    socialLinks: {
      twitter: profile.socialLinks.twitter || "",
      instagram: profile.socialLinks.instagram || "",
      linkedin: profile.socialLinks.linkedin || "",
      github: profile.socialLinks.github || "",
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Clean up social links (remove empty ones)
    const cleanSocialLinks = Object.fromEntries(
      Object.entries(formData.socialLinks).filter(([_, value]) => value.trim() !== ""),
    )

    try {
      await onSave({
        ...formData,
        socialLinks: cleanSocialLinks,
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to save profile:", error)
    }
  }

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const updateSocialLink = (platform: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value,
      },
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Make changes to your profile here. Click save when you're done.</DialogDescription>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => updateFormData("location", e.target.value)}
                placeholder="City, Country"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => updateFormData("website", e.target.value)}
                placeholder="yourwebsite.com"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Social Links</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="twitter" className="text-sm">
                  Twitter
                </Label>
                <Input
                  id="twitter"
                  value={formData.socialLinks.twitter}
                  onChange={(e) => updateSocialLink("twitter", e.target.value)}
                  placeholder="@username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram" className="text-sm">
                  Instagram
                </Label>
                <Input
                  id="instagram"
                  value={formData.socialLinks.instagram}
                  onChange={(e) => updateSocialLink("instagram", e.target.value)}
                  placeholder="@username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin" className="text-sm">
                  LinkedIn
                </Label>
                <Input
                  id="linkedin"
                  value={formData.socialLinks.linkedin}
                  onChange={(e) => updateSocialLink("linkedin", e.target.value)}
                  placeholder="linkedin.com/in/username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github" className="text-sm">
                  GitHub
                </Label>
                <Input
                  id="github"
                  value={formData.socialLinks.github}
                  onChange={(e) => updateSocialLink("github", e.target.value)}
                  placeholder="github.com/username"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isPublic"
              checked={formData.isPublic}
              onCheckedChange={(checked) => updateFormData("isPublic", checked)}
            />
            <Label htmlFor="isPublic">Make profile public</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
  )
}

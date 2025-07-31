// components/user-privacy-settings.tsx

"use client"

import { useState, useEffect } from "react"
import { Shield, Eye, EyeOff, Users, Mail, MessageCircle, Search, Globe, Lock, UserCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { UserService } from "@/lib/user-service"
import { UserProfile } from "@/types/user"

interface UserPrivacySettingsProps {
  userId: string
  initialProfile?: UserProfile
  onProfileUpdate?: (profile: UserProfile) => void
}

export default function UserPrivacySettings({ 
  userId, 
  initialProfile,
  onProfileUpdate 
}: UserPrivacySettingsProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile || null)

  // Load profile if not provided
  useEffect(() => {
    if (!initialProfile && userId) {
      const loadProfile = async () => {
        setLoading(true)
        try {
          const profileData = await UserService.getUserProfile(userId)
          if (profileData) {
            setProfile(profileData)
          }
        } catch (error) {
          console.error("Failed to load profile:", error)
          toast({
            title: "Error",
            description: "Failed to load privacy settings",
            variant: "destructive"
          })
        } finally {
          setLoading(false)
        }
      }
      loadProfile()
    }
  }, [userId, initialProfile, toast])

  const handlePrivacyChange = (key: keyof UserProfile['privacy'], value: boolean) => {
    if (!profile) return
    
    const updatedProfile = {
      ...profile,
      privacy: {
        ...profile.privacy,
        [key]: value
      }
    }
    setProfile(updatedProfile)
  }

  const handleProfileVisibilityChange = (visibility: 'public' | 'followers' | 'private') => {
    if (!profile) return
    
    const updatedProfile = {
      ...profile,
      isPublic: visibility === 'public',
      privacy: {
        ...profile.privacy,
        allowFollowRequests: visibility === 'private'
      }
    }
    setProfile(updatedProfile)
  }

  const handleSearchableChange = (searchable: boolean) => {
    if (!profile) return
    
    const updatedProfile = {
      ...profile,
      searchable
    }
    setProfile(updatedProfile)
  }

  const saveSettings = async () => {
    if (!profile) return
    
    setSaving(true)
    try {
      await UserService.updateUserProfile(userId, {
        isPublic: profile.isPublic,
        searchable: profile.searchable,
        privacy: profile.privacy
      })
      
      onProfileUpdate?.(profile)
      
      toast({
        title: "Settings saved",
        description: "Your privacy settings have been updated successfully."
      })
    } catch (error) {
      console.error("Failed to save settings:", error)
      toast({
        title: "Error",
        description: "Failed to save privacy settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-red-500">Failed to load privacy settings</p>
        </CardContent>
      </Card>
    )
  }

  const getVisibilityStatus = () => {
    if (!profile.isPublic && profile.privacy.allowFollowRequests) return 'private'
    if (profile.isPublic) return 'public'
    return 'followers'
  }

  return (
    <div className="space-y-6">
      {/* Profile Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Profile Visibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={getVisibilityStatus()}
            onValueChange={(value) => handleProfileVisibilityChange(value as any)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="public" id="public" />
              <Label htmlFor="public" className="flex-1">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span className="font-medium">Public</span>
                  <Badge variant="outline">Recommended</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Anyone can see your profile and follow you without approval
                </p>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="followers" id="followers" />
              <Label htmlFor="followers" className="flex-1">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Followers only</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Only your followers can see your full profile
                </p>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="private" id="private" />
              <Label htmlFor="private" className="flex-1">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <span className="font-medium">Private</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Followers must be approved and only they can see your profile
                </p>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Search & Discovery */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Discovery
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Show in search results</Label>
              <p className="text-xs text-muted-foreground">
                Allow others to find your profile when searching
              </p>
            </div>
            <Switch
              checked={profile.searchable}
              onCheckedChange={handleSearchableChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Show email address</Label>
              <p className="text-xs text-muted-foreground">
                Display your email on your public profile
              </p>
            </div>
            <Switch
              checked={profile.privacy.showEmail}
              onCheckedChange={(value) => handlePrivacyChange('showEmail', value)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Show location</Label>
              <p className="text-xs text-muted-foreground">
                Display your location on your profile
              </p>
            </div>
            <Switch
              checked={profile.privacy.showLocation}
              onCheckedChange={(value) => handlePrivacyChange('showLocation', value)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Show activity status</Label>
              <p className="text-xs text-muted-foreground">
                Show when you were last active
              </p>
            </div>
            <Switch
              checked={profile.privacy.showActivity}
              onCheckedChange={(value) => handlePrivacyChange('showActivity', value)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Show collections</Label>
              <p className="text-xs text-muted-foreground">
                Display your movie, book, and music collections
              </p>
            </div>
            <Switch
              checked={profile.privacy.showCollections}
              onCheckedChange={(value) => handlePrivacyChange('showCollections', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Communication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Communication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Allow messages</Label>
              <p className="text-xs text-muted-foreground">
                Let others send you direct messages
              </p>
            </div>
            <Switch
              checked={profile.privacy.allowMessages}
              onCheckedChange={(value) => handlePrivacyChange('allowMessages', value)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Require follow approval</Label>
              <p className="text-xs text-muted-foreground">
                Review and approve follow requests manually
              </p>
            </div>
            <Switch
              checked={profile.privacy.allowFollowRequests}
              onCheckedChange={(value) => handlePrivacyChange('allowFollowRequests', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Tips */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4" />
            Privacy Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Public profiles help you connect with more users who share your interests</p>
          <p>• Private profiles give you more control over who can see your content</p>
          <p>• You can always change these settings later</p>
          <p>• Blocking a user will override these privacy settings</p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={saveSettings} 
          disabled={saving}
          className="flex items-center gap-2"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Shield className="h-4 w-4" />
          )}
          {saving ? "Saving..." : "Save Privacy Settings"}
        </Button>
      </div>
    </div>
  )
}

// Compact version for settings pages
export function CompactPrivacySettings({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileData = await UserService.getUserProfile(userId)
        setProfile(profileData)
      } catch (error) {
        console.error("Failed to load profile:", error)
      } finally {
        setLoading(false)
      }
    }
    
    if (userId) {
      loadProfile()
    }
  }, [userId])

  if (loading || !profile) {
    return (
      <Card>
        <CardContent className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  const visibilityStatus = profile.isPublic 
    ? 'Public' 
    : profile.privacy.allowFollowRequests 
      ? 'Private' 
      : 'Followers only'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Privacy Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Profile visibility:</span>
          <Badge variant={profile.isPublic ? "default" : "secondary"}>
            {visibilityStatus}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm">Searchable:</span>
          <Badge variant={profile.searchable ? "default" : "secondary"}>
            {profile.searchable ? "Yes" : "No"}
          </Badge>
        </div>
        
        <Button variant="outline" size="sm" className="w-full text-xs">
          Manage Privacy
        </Button>
      </CardContent>
    </Card>
  )
}
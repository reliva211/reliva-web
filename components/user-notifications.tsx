// components/user-notifications.tsx

"use client"

import { useState, useEffect } from "react"
import { 
  Bell, 
  UserPlus, 
  UserCheck, 
  Heart, 
  MessageCircle, 
  Check, 
  X, 
  Clock,
  MoreHorizontal,
  BellOff
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFollowUser } from "@/hooks/use-user"
import { formatDistanceToNow } from "date-fns"
import { UserNotification } from "@/types/user"

// Mock notification data - in real implementation, these would come from Firebase
const mockNotifications: UserNotification[] = [
  {
    id: "1",
    userId: "current-user",
    type: "follow_request",
    fromUserId: "user1",
    fromUsername: "john_doe",
    fromDisplayName: "John Doe",
    fromAvatarUrl: "/avatars/john.jpg",
    isRead: false,
    createdAt: { toDate: () => new Date(Date.now() - 2 * 60 * 60 * 1000) } as any, // 2 hours ago
  },
  {
    id: "2",
    userId: "current-user",
    type: "new_follower",
    fromUserId: "user2",
    fromUsername: "jane_smith",
    fromDisplayName: "Jane Smith",
    fromAvatarUrl: "/avatars/jane.jpg",
    isRead: false,
    createdAt: { toDate: () => new Date(Date.now() - 5 * 60 * 60 * 1000) } as any, // 5 hours ago
  },
  {
    id: "3",
    userId: "current-user",
    type: "follow_accepted",
    fromUserId: "user3",
    fromUsername: "alex_wilson",
    fromDisplayName: "Alex Wilson",
    fromAvatarUrl: "/avatars/alex.jpg",
    isRead: true,
    createdAt: { toDate: () => new Date(Date.now() - 24 * 60 * 60 * 1000) } as any, // 1 day ago
  },
  {
    id: "4",
    userId: "current-user",
    type: "mention",
    fromUserId: "user4",
    fromUsername: "sarah_lee",
    fromDisplayName: "Sarah Lee",
    fromAvatarUrl: "/avatars/sarah.jpg",
    isRead: true,
    createdAt: { toDate: () => new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } as any, // 3 days ago
    data: {
      targetId: "review123",
      targetType: "review",
      message: "mentioned you in a review"
    }
  }
]

interface NotificationItemProps {
  notification: UserNotification
  onAccept?: (notificationId: string) => void
  onDecline?: (notificationId: string) => void
  onMarkRead?: (notificationId: string) => void
  onDelete?: (notificationId: string) => void
}

function NotificationItem({ 
  notification, 
  onAccept, 
  onDecline, 
  onMarkRead, 
  onDelete 
}: NotificationItemProps) {
  const { acceptFollowRequest, loading: acceptLoading } = useFollowUser()

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'follow_request':
        return <UserPlus className="h-4 w-4 text-blue-500" />
      case 'new_follower':
        return <UserCheck className="h-4 w-4 text-green-500" />
      case 'follow_accepted':
        return <UserCheck className="h-4 w-4 text-green-500" />
      case 'mention':
        return <MessageCircle className="h-4 w-4 text-orange-500" />
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getNotificationText = () => {
    switch (notification.type) {
      case 'follow_request':
        return 'requested to follow you'
      case 'new_follower':
        return 'started following you'
      case 'follow_accepted':
        return 'accepted your follow request'
      case 'mention':
        return notification.data?.message || 'mentioned you'
      case 'like':
        return 'liked your post'
      case 'comment':
        return 'commented on your post'
      default:
        return 'sent you a notification'
    }
  }

  const handleAccept = async () => {
    if (notification.type === 'follow_request') {
      try {
        await acceptFollowRequest(notification.userId, notification.fromUserId)
        onAccept?.(notification.id)
      } catch (error) {
        console.error("Failed to accept follow request:", error)
      }
    }
  }

  const handleDecline = () => {
    onDecline?.(notification.id)
  }

  const handleMarkRead = () => {
    if (!notification.isRead) {
      onMarkRead?.(notification.id)
    }
  }

  return (
    <div 
      className={`flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors border-l-2 ${
        notification.isRead ? 'border-l-transparent' : 'border-l-primary'
      }`}
    >
      {/* Avatar */}
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={notification.fromAvatarUrl} alt={notification.fromDisplayName} />
        <AvatarFallback>{notification.fromDisplayName.charAt(0)}</AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          {getNotificationIcon()}
          <div className="flex-1">
            <p className="text-sm">
              <span className="font-medium">{notification.fromDisplayName}</span>
              {' '}
              <span className="text-muted-foreground">{getNotificationText()}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })}
            </p>
          </div>
          
          {!notification.isRead && (
            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1"></div>
          )}
        </div>

        {/* Action Buttons for Follow Requests */}
        {notification.type === 'follow_request' && (
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleAccept}
              disabled={acceptLoading}
              className="flex items-center gap-1"
            >
              <Check className="h-3 w-3" />
              Accept
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecline}
              className="flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Decline
            </Button>
          </div>
        )}
      </div>

      {/* More Options */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!notification.isRead && (
            <DropdownMenuItem onClick={handleMarkRead}>
              <Check className="h-4 w-4 mr-2" />
              Mark as read
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => onDelete?.(notification.id)} className="text-red-600">
            <X className="h-4 w-4 mr-2" />
            Delete notification
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

interface UserNotificationsProps {
  userId: string
  showHeader?: boolean
  maxHeight?: string
}

export default function UserNotifications({ 
  userId, 
  showHeader = true,
  maxHeight = "400px"
}: UserNotificationsProps) {
  const [notifications, setNotifications] = useState<UserNotification[]>(mockNotifications)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    switch (activeTab) {
      case "unread":
        return !notification.isRead
      case "follow":
        return ['follow_request', 'new_follower', 'follow_accepted'].includes(notification.type)
      case "mentions":
        return ['mention', 'like', 'comment'].includes(notification.type)
      default:
        return true
    }
  })

  const unreadCount = notifications.filter(n => !n.isRead).length

  const handleAccept = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId 
          ? { ...n, isRead: true }
          : n
      )
    )
  }

  const handleDecline = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  const handleMarkRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId 
          ? { ...n, isRead: true }
          : n
      )
    )
  }

  const handleDelete = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    )
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

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Mark all as read
              </Button>
            )}
          </div>
        </CardHeader>
      )}
      
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b px-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="follow">Follow</TabsTrigger>
              <TabsTrigger value="mentions">Mentions</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea style={{ maxHeight }}>
            <TabsContent value={activeTab} className="m-0">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BellOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No notifications</p>
                  <p className="text-sm">
                    {activeTab === "unread" 
                      ? "All caught up!" 
                      : "New notifications will appear here"
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onAccept={handleAccept}
                      onDecline={handleDecline}
                      onMarkRead={handleMarkRead}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Compact notification bell for header
export function NotificationBell({ userId }: { userId: string }) {
  const [notifications] = useState<UserNotification[]>(mockNotifications)
  const [showDropdown, setShowDropdown] = useState(false)
  
  const unreadCount = notifications.filter(n => !n.isRead).length
  const recentNotifications = notifications.slice(0, 5)

  return (
    <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount} new</Badge>
            )}
          </div>
        </div>
        
        <ScrollArea className="max-h-96">
          {recentNotifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BellOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {recentNotifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors ${
                    !notification.isRead ? 'bg-muted/20' : ''
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={notification.fromAvatarUrl} alt={notification.fromDisplayName} />
                    <AvatarFallback className="text-xs">
                      {notification.fromDisplayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{notification.fromDisplayName}</span>
                      {' '}
                      <span className="text-muted-foreground">
                        {notification.type === 'follow_request' && 'wants to follow you'}
                        {notification.type === 'new_follower' && 'started following you'}
                        {notification.type === 'follow_accepted' && 'accepted your follow request'}
                        {notification.type === 'mention' && 'mentioned you'}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })}
                    </p>
                  </div>
                  
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="p-4 border-t">
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <a href="/notifications">View all notifications</a>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
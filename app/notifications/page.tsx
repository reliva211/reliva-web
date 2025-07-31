// app/notifications/page.tsx

import { Metadata } from "next"
import UserNotifications from "@/components/user-notifications"

export const metadata: Metadata = {
  title: "Notifications | Reliva",
  description: "View your notifications, follow requests, and mentions on Reliva.",
}

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Notifications</h1>
          <p className="text-muted-foreground">
            Stay up to date with follow requests, mentions, and activity
          </p>
        </div>

        {/* In a real implementation, you would get the current user's ID */}
        <UserNotifications 
          userId="current-user" 
          showHeader={false}
          maxHeight="calc(100vh - 200px)"
        />
      </div>
    </div>
  )
}
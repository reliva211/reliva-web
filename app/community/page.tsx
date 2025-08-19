import { ThemeProvider } from "@/components/theme-provider"
import CommunityFeed from "@/components/community-feed"

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <CommunityFeed />
    </ThemeProvider>
  )
}

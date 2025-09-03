# 🎧 Reliva - Comprehensive Codebase Index (Updated)

## 🎯 Project Overview

**Reliva** is a unified media discovery and sharing platform that allows users to track, review, and share their favorite music, books, movies, and TV series all in one place. The platform emphasizes social features with a "no gatekeeping" philosophy, encouraging users to share what they love.

### Key Features
- **Multi-Media Support**: Music, Books, Movies, TV Series
- **Social Features**: Reviews, Ratings, Following System, Community Feed
- **External API Integration**: Spotify, TMDB, Google Books, JioSaavn, NYTimes, YouTube
- **Real-time Features**: Notifications, Live Feed, Real-time Updates
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Authentication**: Dual system with Firebase Auth + NextAuth.js (Spotify OAuth)

---

## 🏗️ Architecture Overview

### Tech Stack
- **Framework**: Next.js 15.2.4 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Radix UI components
- **Authentication**: Firebase Auth + NextAuth.js (Spotify OAuth)
- **Database**: Firebase Firestore
- **State Management**: React hooks + Zustand
- **Package Manager**: pnpm (preferred over yarn)
- **Deployment**: Netlify

### Project Structure
```
reliva-web/
├── app/                    # Next.js App Router pages & API routes
├── components/            # Reusable UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries and configurations
├── types/                # TypeScript type definitions
├── styles/               # Global CSS and styling
├── public/               # Static assets
├── scripts/              # Utility scripts and data seeding
└── docs/                 # Documentation files
```

---

## 📁 Directory Structure & Components

### `/app` - Application Pages & API Routes

#### Pages
- **`page.tsx`** - Landing page with animated hero section and feature showcase
- **`layout.tsx`** - Root layout with theme provider and auth wrapper
- **`login/page.tsx`** - Firebase email/password authentication
- **`signup/page.tsx`** - User registration
- **`reviews/page.tsx`** - Main community feed (home page for authenticated users)
- **`community/page.tsx`** - Community feed with post creation
- **`profile/page.tsx`** - User profile management
- **`music/page.tsx`** - Music discovery with Spotify integration
- **`books/page.tsx`** - Book discovery with Google Books API
- **`movies/page.tsx`** - Movie discovery with TMDB integration
- **`series/page.tsx`** - TV series discovery
- **`users/page.tsx`** - User discovery and following system
- **`notifications/page.tsx`** - User notifications
- **`recommendations/page.tsx`** - Personalized recommendations

#### API Routes
- **`auth/[...nextauth]/route.ts`** - NextAuth configuration with Spotify provider
- **`spotify/route.ts`** - Spotify API integration (playlists, tracks, artists)
- **`spotify/callback/route.ts`** - Spotify OAuth callback handling
- **`music-api/route.ts`** - General music API wrapper
- **`saavn/`** - JioSaavn API integration for Indian music
  - `search/route.ts` - Search songs, albums, artists
  - `artist/route.ts` - Artist details and discography
  - `album/route.ts` - Album details and tracks
  - `song/route.ts` - Song details and playback
- **`tmdb/`** - The Movie Database API integration
  - `search/route.ts` - Search movies and TV series
  - `details/route.ts` - Detailed media information
  - `test/route.ts` - API connection testing
  - `status/route.ts` - API status monitoring
- **`google-books/route.ts`** - Google Books API integration
- **`nytimes/`** - NYTimes API for book recommendations
- **`youtube/search/route.ts`** - YouTube API for video content
- **`search/route.ts`** - Unified search across all media types
- **`recommendations/route.ts`** - Personalized recommendations
- **`trending/route.ts`** - Trending content across media types

### `/components` - React Components

#### Layout & Navigation
- **`header.tsx`** - Main sidebar navigation with collapsible design
- **`layout-wrapper.tsx`** - Layout wrapper with conditional rendering
- **`mobile-header.tsx`** - Mobile-specific header
- **`mobile-bottom-nav.tsx`** - Mobile bottom navigation
- **`footer.tsx`** - Site footer information

#### Core UI Components
- **`community-feed.tsx`** - Main community feed with post interactions
- **`enhanced-create-post.tsx`** - Post creation with media support
- **`user-profile.tsx`** - User profile display and management
- **`edit-profile.tsx`** - Profile editing interface
- **`search-modal.tsx`** - Global search functionality

#### Media-Specific Components
- **`profile-music-section.tsx`** - User's music collection display
- **`profile-movie-section.tsx`** - User's movie collection display
- **`profile-series-section.tsx`** - User's series collection display
- **`profile-books-section.tsx`** - User's book collection display
- **`spotify-folder.tsx`** - Spotify integration component
- **`trending-songs.tsx`** - Trending music display
- **`nytimes-bestsellers.tsx`** - NYTimes bestseller books
- **`movie-card.tsx`** - Movie display component
- **`audio-player.tsx`** - Audio playback component
- **`video-player.tsx`** - Video playback component
- **`youtube-player.tsx`** - YouTube video integration

#### Review & Social Components
- **`review-post.tsx`** - Review creation form
- **`reviews-section.tsx`** - Review display and management
- **`rating-stars.tsx`** - Star rating component
- **`enhanced-media-bar.tsx`** - Media selection bar
- **`floating-action-buttons.tsx`** - Quick action buttons

#### UI Components (`/components/ui`)
- **50+ reusable components** built on Radix UI
- Includes: Button, Card, Dialog, Dropdown, Form, Input, etc.
- Custom styled with Tailwind CSS
- Fully accessible and responsive

### `/hooks` - Custom React Hooks

#### Authentication & User Management
- **`use-current-user.ts`** - Current user state management
- **`use-profile.ts`** - User profile data management
- **`use-userdata.ts`** - User data operations
- **`use-user-connections.ts`** - Following/followers system

#### Media Management
- **`use-music-api.ts`** - Music API operations
- **`use-music-profile.ts`** - User's music profile
- **`use-music-collections.ts`** - Music collection management
- **`use-movie-profile.ts`** - Movie profile management
- **`use-series-profile.ts`** - Series profile management
- **`use-books-profile.ts`** - Books profile management
- **`use-google-books.ts`** - Google Books API integration
- **`use-nytimes-books.ts`** - NYTimes books integration
- **`use-trending-books.ts`** - Trending books functionality

#### Content & Reviews
- **`use-reviews.ts`** - Review management system
- **`use-all-reviews.ts`** - All reviews fetching
- **`use-followed-reviews.ts`** - Followed users' reviews
- **`use-movie-reviews.ts`** - Movie-specific reviews
- **`use-ratings.ts`** - Rating system
- **`use-recommendations.ts`** - Recommendation system
- **`use-collections.ts`** - Collection management

#### Utility Hooks
- **`use-search.ts`** - Search functionality with debouncing
- **`use-notifications.ts`** - Notification system
- **`use-mobile.tsx`** - Mobile detection
- **`use-toast.ts`** - Toast notifications
- **`use-video-player.ts`** - Video player state management
- **`use-youtube-player.ts`** - YouTube player integration

### `/lib` - Utility Libraries

- **`firebase.ts`** - Firebase configuration and initialization
- **`firebase-admin.ts`** - Firebase Admin SDK setup
- **`utils.ts`** - General utility functions
- **`tmdb.ts`** - TMDB API client
- **`spotify.tsx`** - Spotify API integration
- **`books-api.ts`** - Books API utilities
- **`search-service.ts`** - Search service implementation
- **`spotify-tokens.ts`** - Spotify token management

### `/types` - TypeScript Definitions

- **`review.ts`** - Review and rating type definitions
- **`next-auth.d.ts`** - NextAuth type extensions

---

## 🔧 Key Features & Functionality

### Authentication System
- **Dual Authentication**: Firebase Auth + NextAuth.js
- **Providers**: Email/Password, Google, Spotify OAuth
- **User Management**: Profile creation, editing, public/private settings
- **Session Management**: Automatic token refresh and secure cookie handling

### Media Integration
- **Music**: Spotify API, JioSaavn API for Indian content
- **Movies/TV**: TMDB API for comprehensive movie/TV data
- **Books**: Google Books API, NYTimes Bestsellers
- **Video**: YouTube API for video content
- **Search**: Unified search across all media types

### Social Features
- **Reviews & Ratings**: Star-based rating system with text reviews
- **Following System**: Follow users, see their activity
- **Community Feed**: Real-time activity feed with personalized content
- **Notifications**: Real-time notifications for interactions
- **User Discovery**: Find and connect with other users

### User Experience
- **Responsive Design**: Mobile-first with desktop optimization
- **Dark/Light Theme**: Theme switching with system preference
- **Real-time Updates**: Live feed updates and notifications
- **Media Playback**: Audio/video players for content preview
- **Progressive Web App**: Offline capabilities and mobile optimization

---

## 🚀 Development Setup

### Prerequisites
- Node.js 18+
- pnpm package manager (preferred)
- Firebase project setup
- API keys for external services

### Environment Variables
```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Spotify
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=

# TMDB
NEXT_PUBLIC_TMDB_API_KEY=

# Google Books
GOOGLE_BOOKS_API_KEY=

# NYTimes
NYTIMES_API_KEY=

# YouTube
YOUTUBE_API_KEY=
```

### Installation & Development
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

---

## 📊 Database Schema (Firebase Firestore)

### Collections
- **`users`** - User account data
- **`userProfiles`** - Extended user profile information
- **`reviews`** - User reviews and ratings
- **`collections`** - User media collections
- **`follows`** - Following relationships
- **`notifications`** - User notifications
- **`userRatings`** - User ratings for media items

### Data Models
- **User**: Profile, preferences, connections
- **Review**: Content, ratings, social interactions
- **Media**: Movies, books, music, series metadata
- **Collection**: User-curated content groups
- **Notification**: User activity alerts

---

## 🔌 External API Integrations

### Spotify API
- User authentication and profile
- Playlist management
- Track search and playback
- Top artists and tracks
- OAuth integration with NextAuth.js

### TMDB API
- Movie and TV show data
- Popular and trending content
- Detailed information and images
- Similar content recommendations
- API status monitoring

### Google Books API
- Book search and details
- Author information
- Book covers and descriptions
- ISBN-based lookups

### JioSaavn API
- Indian music content
- Song, album, and artist search
- Playlist management
- Regional music discovery

### NYTimes API
- Bestseller book lists
- Book reviews and recommendations
- Trending book data

### YouTube API
- Video content search
- Video metadata and thumbnails
- Video player integration

---

## 🎨 UI/UX Design System

### Design Principles
- **Mobile-First**: Responsive design starting from mobile
- **Dark Theme Default**: Dark mode as primary theme
- **Accessibility**: WCAG compliant components
- **Performance**: Optimized for fast loading

### Component Library
- **Radix UI**: Headless component primitives
- **Tailwind CSS**: Utility-first styling
- **Custom Components**: Extended functionality
- **Responsive Grid**: Flexible layout system

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **CSS Variables**: Dynamic theming support
- **Custom Animations**: Smooth transitions and interactions
- **Responsive Breakpoints**: Mobile-first responsive design

---

## 🔄 State Management

### React State
- **Custom hooks** for local state management
- **Context providers** for global state
- **Firebase real-time listeners** for live updates
- **Optimistic updates** for better UX

### Data Fetching
- **Custom hooks** for API calls
- **Error handling** with fallback states
- **Loading states** for better user experience
- **Cache invalidation** strategies

---

## 📱 Mobile & Responsive Features

### Mobile Optimization
- **Touch-friendly UI** components
- **Responsive navigation** with collapsible sidebar
- **Mobile-specific layouts** for different screen sizes
- **Progressive Web App** capabilities

### Performance
- **Image optimization** with Next.js Image component
- **Lazy loading** for media content
- **Code splitting** for optimal bundle sizes
- **Service worker** for offline capabilities

---

## 🧪 Development & Testing

### Development Tools
- **ESLint** configuration for code quality
- **TypeScript** strict mode for type safety
- **Prettier** for code formatting
- **Git hooks** for code quality

### Testing & Debugging
- **Error boundaries** for graceful error handling
- **Debug panels** for development assistance
- **Console logging** for debugging
- **Test data scripts** for development

### Utility Scripts
- **`add-test-data.js`** - Add test data for development
- **`add-test-collections.js`** - Add test collections
- **`add-test-following-data.js`** - Add test following relationships
- **`cleanup-test-data.js`** - Clean up test data
- **`debug-reviews.js`** - Debug review system
- **`test-nytimes-api.js`** - Test NYTimes API
- **`test-recommendations.js`** - Test recommendation system

---

## 🚀 Deployment & Environment

### Environment Configuration
- **Environment variables** for API keys and configuration
- **Firebase configuration** for different environments
- **Next.js configuration** for production builds

### Build & Deployment
- **PNPM** package manager for dependencies
- **Next.js build system** for production optimization
- **Netlify deployment** with automatic builds
- **Environment-specific builds** for staging/production

### Netlify Configuration
- **Build command**: `pnpm store prune && pnpm install && pnpm build`
- **Publish directory**: `.next`
- **Node version**: 20
- **PNPM version**: 8.15.0

---

## 🌟 Key Features Implementation

### 1. Multi-Media Support
- Unified interface for different content types
- Consistent review system across media types
- Cross-media recommendations and discovery

### 2. Social Platform
- User following and follower system
- Community-driven content discovery
- Social interactions on reviews and content

### 3. Content Discovery
- AI-powered recommendations
- Trending content algorithms
- Personalized content feeds

### 4. Rich Media Experience
- Audio and video playback integration
- Image galleries and media previews
- Interactive content exploration

---

## 📈 Performance Optimizations

### Frontend Performance
- **Code splitting** and lazy loading
- **Image optimization** and compression
- **Bundle size optimization** with tree shaking
- **Service worker** for offline functionality

### Backend Performance
- **Database indexing** strategies
- **API response caching** mechanisms
- **Real-time updates** with Firebase
- **Efficient data fetching** patterns

---

## 🔮 Future Enhancements

### Planned Features
- **Advanced recommendation algorithms**
- **Social media integration**
- **Mobile app development**
- **Internationalization support**
- **Advanced analytics and insights**

### Technical Improvements
- **GraphQL API** implementation
- **Microservices architecture**
- **Advanced caching strategies**
- **Performance monitoring** and analytics

---

## 📚 Additional Documentation

- **`FOLLOWING_SYSTEM_README.md`** - Social features documentation
- **`RECOMMENDATIONS_FEATURE.md`** - Recommendation system details
- **`NYTIMES_API_INTEGRATION.md`** - Book API integration
- **`SERIES_AND_BOOKS_TODO.md`** - Development roadmap
- **`THREAD_NAVIGATION_README.md`** - Navigation system documentation

---

## 🔧 Recent Updates & Changes

### Current Status
- **Package Manager**: Migrated to pnpm (removing yarn usage)
- **Netlify Configuration**: Updated build commands for pnpm
- **Profile Sections**: Enhanced profile components for all media types
- **Review System**: Improved review functionality and UI
- **API Integrations**: Enhanced external API connections

### Git Status
- Modified files include profile sections, review system, and configuration files
- Ready for commit with recent improvements

---

*This comprehensive index provides a complete overview of the Reliva codebase, its architecture, features, and development setup. The platform represents a modern, full-stack web application with sophisticated media integration and social features, built with Next.js 15, TypeScript, and Firebase.*

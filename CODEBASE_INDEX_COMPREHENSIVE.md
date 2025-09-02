# Reliva - Comprehensive Codebase Index

## 🎯 Project Overview

**Reliva** is a unified media discovery and sharing platform that allows users to track, review, and share their favorite music, books, movies, and TV series all in one place.

### Key Features
- Multi-Media Support: Music, Books, Movies, TV Series
- Social Features: Reviews, Ratings, Following System, Community Feed
- External API Integration: Spotify, TMDB, Google Books, JioSaavn, NYTimes
- Real-time Features: Notifications, Live Feed
- Responsive Design: Mobile-first approach

---

## 🏗️ Architecture Overview

### Tech Stack
- Framework: Next.js 15.2.4 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS + Radix UI components
- Authentication: Firebase Auth + NextAuth.js (Spotify OAuth)
- Database: Firebase Firestore
- State Management: React hooks + Zustand
- Package Manager: pnpm

---

## 📁 Directory Structure

### `/app` - Application Pages & API Routes

#### Pages
- `page.tsx` - Landing page with animated hero section
- `layout.tsx` - Root layout with theme provider and auth wrapper
- `login/page.tsx` - Firebase email/password authentication
- `signup/page.tsx` - User registration
- `reviews/page.tsx` - Main community feed (home page)
- `community/page.tsx` - Community feed with post creation
- `profile/page.tsx` - User profile management
- `music/page.tsx` - Music discovery with Spotify integration
- `books/page.tsx` - Book discovery with Google Books API
- `movies/page.tsx` - Movie discovery with TMDB integration
- `series/page.tsx` - TV series discovery

#### API Routes
- `auth/[...nextauth]/route.ts` - NextAuth configuration with Spotify provider
- `spotify/route.ts` - Spotify API integration
- `music-api/route.ts` - General music API wrapper
- `saavn/` - JioSaavn API integration for Indian music
- `tmdb/` - The Movie Database API integration
- `google-books/route.ts` - Google Books API integration
- `nytimes/` - NYTimes API for book recommendations
- `search/route.ts` - Unified search across all media types
- `recommendations/route.ts` - Personalized recommendations

### `/components` - React Components

#### Layout & Navigation
- `header.tsx` - Main sidebar navigation with collapsible design
- `layout-wrapper.tsx` - Layout wrapper with conditional rendering
- `mobile-header.tsx` - Mobile-specific header
- `mobile-bottom-nav.tsx` - Mobile bottom navigation

#### Core UI Components
- `community-feed.tsx` - Main community feed with post interactions
- `enhanced-create-post.tsx` - Post creation with media support
- `user-profile.tsx` - User profile display and management
- `edit-profile.tsx` - Profile editing interface

#### Media-Specific Components
- `profile-music-section.tsx` - User's music collection display
- `profile-movie-section.tsx` - User's movie collection display
- `profile-series-section.tsx` - User's series collection display
- `profile-books-section.tsx` - User's book collection display
- `spotify-folder.tsx` - Spotify integration component
- `trending-songs.tsx` - Trending music display
- `nytimes-bestsellers.tsx` - NYTimes bestseller books

#### UI Components (`/components/ui`)
- Complete Radix UI component library (50+ components)
- Includes: Button, Card, Dialog, Dropdown, Form, Input, etc.
- Custom styled with Tailwind CSS

### `/hooks` - Custom React Hooks

#### Authentication & User Management
- `use-current-user.ts` - Current user state management
- `use-profile.ts` - User profile data management
- `use-userdata.ts` - User data operations
- `use-user-connections.ts` - Following/followers system

#### Media Management
- `use-music-api.ts` - Music API operations
- `use-music-profile.ts` - User's music profile
- `use-movie-profile.ts` - Movie profile management
- `use-series-profile.ts` - Series profile management
- `use-books-profile.ts` - Books profile management
- `use-google-books.ts` - Google Books API integration
- `use-nytimes-books.ts` - NYTimes books integration

#### Content & Reviews
- `use-reviews.ts` - Review management system
- `use-ratings.ts` - Rating system
- `use-recommendations.ts` - Recommendation system
- `use-collections.ts` - Collection management

#### Utility Hooks
- `use-search.ts` - Search functionality
- `use-notifications.ts` - Notification system
- `use-mobile.tsx` - Mobile detection
- `use-toast.ts` - Toast notifications

### `/lib` - Utility Libraries

- `firebase.ts` - Firebase configuration and initialization
- `firebase-admin.ts` - Firebase Admin SDK setup
- `utils.ts` - General utility functions
- `tmdb.ts` - TMDB API client
- `spotify.tsx` - Spotify API integration
- `books-api.ts` - Books API utilities
- `search-service.ts` - Search service implementation

---

## 🔧 Key Features & Functionality

### Authentication System
- Dual Authentication: Firebase Auth + NextAuth.js
- Providers: Email/Password, Google, Spotify OAuth
- User Management: Profile creation, editing, public/private settings

### Media Integration
- Music: Spotify API, JioSaavn API for Indian content
- Movies/TV: TMDB API for comprehensive movie/TV data
- Books: Google Books API, NYTimes Bestsellers
- Search: Unified search across all media types

### Social Features
- Reviews & Ratings: Star-based rating system with text reviews
- Following System: Follow users, see their activity
- Community Feed: Real-time activity feed
- Notifications: Real-time notifications for interactions

### User Experience
- Responsive Design: Mobile-first with desktop optimization
- Dark/Light Theme: Theme switching with system preference
- Real-time Updates: Live feed updates and notifications
- Media Playback: Audio/video players for content preview

---

## 🚀 Development Setup

### Prerequisites
- Node.js 18+
- pnpm package manager
- Firebase project setup
- API keys for external services

### Environment Variables
```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Spotify
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=

# TMDB
TMDB_API_KEY=

# Google Books
GOOGLE_BOOKS_API_KEY=

# NYTimes
NYTIMES_API_KEY=
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
```

---

## 📊 Database Schema (Firebase Firestore)

### Collections
- `users` - User account data
- `userProfiles` - Extended user profile information
- `reviews` - User reviews and ratings
- `collections` - User media collections
- `follows` - Following relationships
- `notifications` - User notifications

---

## 🔌 External API Integrations

### Spotify API
- User authentication and profile
- Playlist management
- Track search and playback
- Top artists and tracks

### TMDB API
- Movie and TV show data
- Popular and trending content
- Detailed information and images
- Similar content recommendations

### Google Books API
- Book search and details
- Author information
- Book covers and descriptions

### JioSaavn API
- Indian music content
- Song, album, and artist search
- Playlist management

### NYTimes API
- Bestseller book lists
- Book reviews and recommendations

---

## 🎨 UI/UX Design System

### Design Principles
- Mobile-First: Responsive design starting from mobile
- Dark Theme Default: Dark mode as primary theme
- Accessibility: WCAG compliant components
- Performance: Optimized for fast loading

### Component Library
- Radix UI: Headless component primitives
- Tailwind CSS: Utility-first styling
- Custom Components: Extended functionality
- Responsive Grid: Flexible layout system

---

This comprehensive index provides a complete overview of the Reliva codebase, its architecture, features, and development setup. The platform represents a modern, full-stack web application with sophisticated media integration and social features.

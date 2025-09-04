# Reliva - Comprehensive Codebase Index

## 🎯 Project Overview

**Reliva** is a modern social media platform for sharing and discovering media content (music, books, movies, TV shows). Built with Next.js 15, it provides a unified platform where users can rate, review, and share their favorite content without gatekeeping.

### Key Features
- **Multi-media Support**: Movies, TV shows, books, and music
- **Social Features**: Reviews, ratings, following system, community feed
- **External API Integration**: TMDB, Google Books, JioSaavn, Spotify
- **Real-time Features**: Notifications, live feed updates
- **Responsive Design**: Mobile-first with desktop optimization

---

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Authentication**: Firebase Auth + NextAuth.js (Spotify OAuth)
- **Database**: Firebase Firestore + MongoDB (hybrid approach)
- **State Management**: Zustand, React hooks
- **Package Manager**: pnpm (preferred over yarn)

### Project Structure
```
reliva-web/
├── app/                    # Next.js App Router
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and configurations
├── types/                 # TypeScript type definitions
├── styles/                # Global styles and CSS
└── public/               # Static assets
```

---

## 📁 Directory Structure & Components

### `/app` - Next.js App Router

#### Core Pages
- **`page.tsx`** - Landing page with animated hero section
- **`layout.tsx`** - Root layout with providers (Auth, Theme)
- **`globals.css`** - Global styles and CSS variables

#### Authentication
- **`auth/signin/page.tsx`** - Sign-in page
- **`auth/error/page.tsx`** - Authentication error handling
- **`login/page.tsx`** - Login page
- **`signup/page.tsx`** - User registration

#### Media Discovery
- **`music/`** - Music discovery and details
  - `page.tsx` - Music discovery page
  - `song/[id]/page.tsx` - Individual song details
  - `album/[id]/page.tsx` - Album details
  - `artist/[id]/page.tsx` - Artist profiles
- **`movies/`** - Movie discovery and details
- **`books/`** - Book discovery and details
- **`series/`** - TV series discovery and details

#### Social Features
- **`reviews/`** - Review system
  - `page.tsx` - Main reviews feed
  - `[id]/page.tsx` - Individual review details
  - `thread/[commentId]/page.tsx` - Review threads
- **`community/page.tsx`** - Community feed
- **`users/`** - User profiles and connections
- **`recommendations/page.tsx`** - Personalized recommendations
- **`notifications/page.tsx`** - User notifications

#### API Routes (`/app/api/`)
- **Authentication**: `auth/[...nextauth]/route.ts` - NextAuth configuration
- **TMDB**: `tmdb/` - Movie/TV show data from The Movie Database
- **Music**: `saavn/` - Music data from JioSaavn API
- **Books**: `google-books/route.ts` - Book data from Google Books API
- **Spotify**: `spotify/` - Spotify integration for playlists and user data
- **Search**: `search/route.ts` - Unified search across all media types

### `/components` - UI Components

#### Layout Components
- **`layout-wrapper.tsx`** - Main layout wrapper with sidebar
- **`header.tsx`** - Collapsible sidebar navigation
- **`mobile-header.tsx`** - Mobile-specific header
- **`mobile-bottom-nav.tsx`** - Mobile bottom navigation
- **`footer.tsx`** - Site footer

#### Core UI Components
- **`auth-provider.tsx`** - Authentication context provider
- **`theme-provider.tsx`** - Dark/light theme provider
- **`error-boundary.tsx`** - Error handling wrapper

#### Media Components
- **`movie-card.tsx`** - Movie display cards
- **`audio-player.tsx`** - Music player component
- **`video-player.tsx`** - Video player for trailers
- **`youtube-player.tsx`** - YouTube video integration

#### Social Components
- **`community-feed.tsx`** - Main community feed with posts
- **`reviews-section.tsx`** - Review display and management
- **`enhanced-create-post.tsx`** - Post creation interface
- **`user-profile.tsx`** - User profile display
- **`user-avatar.tsx`** - Avatar component with fallbacks

#### Utility Components
- **`search-modal.tsx`** - Global search interface
- **`image-upload.tsx`** - Image upload with preview
- **`rating-stars.tsx`** - Star rating component
- **`floating-action-buttons.tsx`** - Mobile FABs

#### UI Library (`/components/ui/`)
- Complete Radix UI component library
- Custom styled components with Tailwind CSS
- Form components, modals, dropdowns, etc.

### `/hooks` - Custom React Hooks

#### Authentication & User
- **`use-current-user.ts`** - Current user state and Firebase integration
- **`use-userdata.ts`** - User data management
- **`use-user-connections.ts`** - Following/followers system

#### Media Hooks
- **`use-music-api.ts`** - Music API integration (Spotify, JioSaavn)
- **`use-movie-profile.ts`** - Movie data and profiles
- **`use-books-profile.ts`** - Book data and profiles
- **`use-series-profile.ts`** - TV series data

#### Social Features
- **`use-reviews.ts`** - Review CRUD operations
- **`use-followed-reviews.ts`** - Reviews from followed users
- **`use-all-reviews.ts`** - All public reviews
- **`use-notifications.ts`** - Notification system
- **`use-recommendations.ts`** - Personalized recommendations

#### Utility Hooks
- **`use-mobile.tsx`** - Mobile device detection
- **`use-search.ts`** - Search functionality
- **`use-toast.ts`** - Toast notifications
- **`use-cloudinary-upload.ts`** - Image upload to Cloudinary

### `/lib` - Utilities & Configuration

#### Core Libraries
- **`firebase.ts`** - Firebase configuration (Auth, Firestore, Storage)
- **`firebase-admin.ts`** - Server-side Firebase admin
- **`utils.ts`** - Utility functions (cn, formatters, etc.)

#### API Integrations
- **`tmdb.ts`** - The Movie Database API client
- **`spotify.tsx`** - Spotify API integration
- **`spotify-tokens.ts`** - Spotify token management
- **`books-api.ts`** - Google Books API client
- **`search-service.ts`** - Unified search service

#### Utilities
- **`cloudinary.ts`** - Cloudinary image service
- **`user-mapping.ts`** - User ID mapping between Firebase and MongoDB

### `/types` - TypeScript Definitions

- **`review.ts`** - Review data structures
- **`next-auth.d.ts`** - NextAuth type extensions

---

## 🔧 Key Features & Functionality

### Authentication System
- **Firebase Auth** for user management
- **NextAuth.js** for OAuth providers (Spotify)
- **Hybrid Database**: Firebase Firestore + MongoDB
- **User Profile Management** with avatar uploads

### Media Discovery
- **Unified Search** across all media types
- **External API Integration**:
  - TMDB for movies/TV shows
  - Google Books for books
  - JioSaavn for music
  - Spotify for playlists and user data
- **Media Details Pages** with rich information
- **Responsive Design** for all screen sizes

### Social Features
- **Review System** with ratings and comments
- **Following System** for user connections
- **Community Feed** with real-time updates
- **Notifications** for social interactions
- **Recommendations** based on user preferences

### Technical Features
- **Real-time Updates** with Firebase
- **Image Upload** with Cloudinary integration
- **Mobile-First Design** with responsive components
- **Dark/Light Theme** support
- **Error Handling** with error boundaries
- **Loading States** and skeleton screens

---

## 🚀 Development Setup

### Prerequisites
- Node.js 18+
- pnpm (preferred package manager)
- Firebase project
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

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Spotify
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=

# External APIs
NEXT_PUBLIC_TMDB_API_KEY=
GOOGLE_BOOKS_API_KEY=

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
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

## 📊 Data Flow & Architecture

### User Authentication Flow
1. User signs in via Firebase Auth or Spotify OAuth
2. User data stored in Firebase Firestore
3. MongoDB user record created for social features
4. User session managed by NextAuth.js

### Media Data Flow
1. User searches for content
2. API routes query external services (TMDB, Google Books, etc.)
3. Data transformed and cached
4. Results displayed in responsive UI components

### Social Features Flow
1. User creates reviews/ratings
2. Data stored in Firebase Firestore
3. Real-time updates pushed to followers
4. Notifications generated for interactions

---

## 🎨 Design System

### Styling Approach
- **Tailwind CSS** for utility-first styling
- **Radix UI** for accessible component primitives
- **Custom CSS** for complex animations and layouts
- **Responsive Design** with mobile-first approach

### Theme System
- **Dark/Light Mode** support
- **CSS Variables** for consistent theming
- **Component Variants** using class-variance-authority

### Component Architecture
- **Composition Pattern** for flexible components
- **Custom Hooks** for business logic
- **TypeScript** for type safety
- **Error Boundaries** for graceful error handling

---

## 🔍 Search & Discovery

### Search Implementation
- **Unified Search API** (`/api/search/route.ts`)
- **Multi-source Integration** (TMDB, Google Books, JioSaavn)
- **Real-time Search** with debouncing
- **Search History** and suggestions

### Discovery Features
- **Trending Content** across all media types
- **Personalized Recommendations** based on user preferences
- **Category-based Browsing** (genres, years, ratings)
- **Related Content** suggestions

---

## 📱 Mobile Experience

### Mobile-First Design
- **Responsive Layout** with breakpoint-specific components
- **Touch-Friendly** interface elements
- **Mobile Navigation** with bottom tab bar
- **Swipe Gestures** for content interaction

### Performance Optimizations
- **Image Optimization** with Next.js Image component
- **Lazy Loading** for media content
- **Code Splitting** for faster initial loads
- **Caching Strategies** for API responses

---

## 🚀 Deployment & Production

### Build Configuration
- **Next.js 15** with App Router
- **TypeScript** compilation
- **Tailwind CSS** purging for production
- **Environment-specific** configurations

### Hosting Considerations
- **Vercel** deployment ready
- **Netlify** configuration included
- **Environment Variables** management
- **CDN** for static assets

---

## 🔧 Development Guidelines

### Code Organization
- **Feature-based** folder structure
- **Component Composition** over inheritance
- **Custom Hooks** for reusable logic
- **TypeScript** for type safety

### Best Practices
- **pnpm** for package management
- **ESLint** for code quality
- **Prettier** for code formatting
- **Git Hooks** for pre-commit checks

### Testing Strategy
- **Component Testing** with React Testing Library
- **API Testing** for external integrations
- **E2E Testing** for critical user flows
- **Performance Testing** for optimization

---

## 📈 Future Enhancements

### Planned Features
- **Real-time Chat** for user interactions
- **Advanced Recommendations** with ML
- **Content Curation** tools
- **Analytics Dashboard** for user insights
- **Mobile App** development

### Technical Improvements
- **GraphQL** API implementation
- **Microservices** architecture
- **Advanced Caching** strategies
- **Performance Monitoring** integration

---

This comprehensive index provides a complete overview of the Reliva codebase, its architecture, and functionality. The project demonstrates modern web development practices with a focus on user experience, performance, and scalability.
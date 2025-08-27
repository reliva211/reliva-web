# 🎧 Reliva Web Application - Codebase Index

## 📋 Project Overview

**Reliva** is a comprehensive media tracking and review platform that allows users to track their music, books, movies, and TV series all in one place. The application provides social features for sharing reviews, following other users, and discovering new content across multiple media types.

**Tech Stack**: Next.js 15, React 19, TypeScript, Firebase, Tailwind CSS, Radix UI

## 🏗️ Architecture Overview

### Frontend Framework
- **Next.js 15** with App Router
- **React 19** with modern hooks and patterns
- **TypeScript** for type safety
- **Tailwind CSS** for styling with custom design system

### Backend & Database
- **Firebase** for authentication and Firestore database
- **MongoDB** integration for user management
- **NextAuth.js** for OAuth authentication (Spotify)

### UI Components
- **Radix UI** primitives for accessible components
- **Custom component library** built on top of Radix UI
- **Responsive design** with mobile-first approach

## 📁 Directory Structure

```
reliva-web/
├── app/                    # Next.js App Router pages
├── components/            # Reusable UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries and configurations
├── types/                # TypeScript type definitions
├── styles/               # Global CSS and styling
├── public/               # Static assets
└── scripts/              # Utility scripts and data seeding
```

## 🚀 Core Features

### 1. Authentication System
- **Firebase Authentication** with email/password
- **Spotify OAuth** integration via NextAuth.js
- **User profile management** with Firestore
- **Session management** with automatic token refresh

### 2. Media Management
- **Multi-media support**: Movies, TV Series, Books, Music
- **External API integrations**:
  - TMDB for movies and TV series
  - Google Books API
  - Spotify API for music
  - Saavn API for Indian music
  - YouTube API for video content

### 3. Review System
- **Rich review creation** with ratings, tags, and spoiler warnings
- **Social interactions**: likes, helpful votes, comments
- **Review filtering** and search capabilities
- **Public/private review options**

### 4. Social Features
- **User following system**
- **Community feed** with shared reviews
- **Notifications** for social interactions
- **User profiles** with activity history

### 5. Discovery & Recommendations
- **Trending content** across media types
- **Personalized recommendations**
- **Search functionality** across all media types
- **Collection management**

## 🔧 Key Components

### Layout & Navigation
- **`LayoutWrapper`** - Main layout container
- **`Header`** - Navigation with sidebar and mobile menu
- **`Footer`** - Site footer information
- **`ThemeProvider`** - Dark/light theme management

### Authentication Components
- **`AuthProvider`** - Firebase auth context
- **`Login`** - User login page
- **`Signup`** - User registration page
- **`Profile`** - User profile management

### Media Components
- **`MovieCard`** - Movie display component
- **`BookCard`** - Book display component
- **`MusicPlayer`** - Audio playback component
- **`VideoPlayer`** - Video playback component
- **`YouTubePlayer`** - YouTube video integration

### Review Components
- **`ReviewPost`** - Review creation form
- **`ReviewsSection`** - Review display and management
- **`RatingStars`** - Star rating component
- **`CommunityFeed`** - Social review feed

### UI Components (`components/ui/`)
- **50+ reusable components** built on Radix UI
- **Form components** with validation
- **Modal and dialog components**
- **Navigation components**
- **Data display components**

## 🪝 Custom Hooks

### Authentication & User Management
- **`useCurrentUser`** - Current user state and data
- **`useProfile`** - User profile management
- **`useUserConnections`** - Following/follower management

### Media Management
- **`useReviews`** - Review CRUD operations
- **`useCollections`** - User collection management
- **`useRecommendations`** - Content recommendations
- **`useSearch`** - Search functionality

### External API Hooks
- **`useTMDB`** - Movie/TV series data
- **`useGoogleBooks`** - Book data
- **`useSpotify`** - Music data
- **`useSaavn`** - Indian music data

### Utility Hooks
- **`useToast`** - Notification system
- **`useMobile`** - Responsive design detection
- **`useVideoPlayer`** - Video player state management

## 🌐 API Routes

### Authentication
- **`/api/auth/[...nextauth]`** - NextAuth.js OAuth endpoints
- **`/api/auth/spotify`** - Spotify authentication

### Media APIs
- **`/api/tmdb/*`** - Movie and TV series data
- **`/api/books/*`** - Book management
- **`/api/music-api/*`** - Music data
- **`/api/spotify/*`** - Spotify integration
- **`/api/saavn/*`** - Saavn music data

### User Management
- **`/api/users/*`** - User CRUD operations
- **`/api/profile/*`** - Profile management
- **`/api/notifications/*`** - Notification system

### Social Features
- **`/api/reviews/*`** - Review management
- **`/api/recommendations/*`** - Content recommendations
- **`/api/search/*`** - Search functionality

## 🎨 Styling & Design System

### Tailwind CSS Configuration
- **Custom color palette** with CSS variables
- **Component variants** using class-variance-authority
- **Responsive breakpoints** for mobile-first design
- **Animation system** with custom keyframes

### Design Tokens
- **Color system** with semantic naming
- **Typography scale** with Inter font
- **Spacing system** with consistent increments
- **Border radius** and shadow utilities

### Responsive Design
- **Mobile-first approach** with progressive enhancement
- **Breakpoint system** for different screen sizes
- **Touch-friendly interactions** for mobile devices

## 🔐 Security & Authentication

### Firebase Security
- **Firestore security rules** for data access control
- **Authentication state management** with real-time updates
- **User data isolation** and privacy protection

### OAuth Integration
- **Spotify OAuth** with proper scope management
- **Token refresh** handling for long-lived sessions
- **Secure cookie management** for production environments

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

## 🧪 Development & Testing

### Development Tools
- **ESLint** configuration for code quality
- **TypeScript** strict mode for type safety
- **Prettier** for code formatting
- **Husky** for git hooks

### Testing & Debugging
- **Error boundaries** for graceful error handling
- **Debug panels** for development assistance
- **Console logging** for debugging
- **Test data scripts** for development

## 🚀 Deployment & Environment

### Environment Configuration
- **Environment variables** for API keys and configuration
- **Firebase configuration** for different environments
- **Next.js configuration** for production builds

### Build & Deployment
- **PNPM** package manager for dependencies
- **Next.js build system** for production optimization
- **Static asset optimization** for performance
- **Environment-specific builds** for staging/production

## 📊 Data Models

### Core Entities
- **User**: Profile, preferences, connections
- **Review**: Content, ratings, social interactions
- **Media**: Movies, books, music, series metadata
- **Collection**: User-curated content groups
- **Notification**: User activity alerts

### Database Schema
- **Firestore collections** for real-time data
- **MongoDB integration** for complex user data
- **Data relationships** with proper indexing
- **Caching strategies** for performance

## 🔄 State Management

### React State
- **Custom hooks** for local state management
- **Context providers** for global state
- **Firebase real-time listeners** for live updates
- **Optimistic updates** for better UX

### Data Fetching
- **SWR/React Query** patterns for data fetching
- **Error handling** with fallback states
- **Loading states** for better user experience
- **Cache invalidation** strategies

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

## 📚 Additional Documentation

- **`FOLLOWING_SYSTEM_README.md`** - Social features documentation
- **`RECOMMENDATIONS_FEATURE.md`** - Recommendation system details
- **`NYTIMES_API_INTEGRATION.md`** - Book API integration
- **`SERIES_AND_BOOKS_TODO.md`** - Development roadmap

---

*This index provides a comprehensive overview of the Reliva web application codebase. For specific implementation details, refer to the individual component files and API route implementations.*

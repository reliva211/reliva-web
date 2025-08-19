# Reliva Codebase Index

## 🎯 Project Overview
**Reliva** is a comprehensive media tracking and social platform that allows users to discover, review, and share their experiences with music, books, movies, and TV series. The application integrates with multiple external APIs to provide rich media content and offers a social networking experience centered around media consumption.

## 🏗️ Architecture & Technology Stack

### Frontend Framework
- **Next.js 15.2.4** - React-based full-stack framework with App Router
- **React 19** - Modern React with latest features
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 3.4.17** - Utility-first CSS framework

### Backend & Database
- **Firebase** - Authentication, Firestore database, and storage
- **Next.js API Routes** - Server-side API endpoints
- **NextAuth.js** - Authentication framework with Spotify integration

### UI Components
- **Radix UI** - Accessible, unstyled UI primitives
- **Shadcn/ui** - High-quality component library built on Radix
- **Lucide React** - Beautiful icon library
- **Framer Motion** - Animation library

### External API Integrations
- **Spotify API** - Music streaming and playlist management
- **TMDB API** - Movie and TV series database
- **NYTimes Books API** - Bestseller lists and book data
- **JioSaavn API** - Indian music streaming service
- **Google Books API** - Book search and metadata

## 📁 Project Structure

### Core Application (`/app`)
```
app/
├── api/                    # API routes for external services
│   ├── auth/              # Authentication endpoints
│   ├── spotify/           # Spotify API integration
│   ├── tmdb/              # Movie/TV database API
│   ├── nytimes/           # NYTimes Books API
│   ├── saavn/             # JioSaavn music API
│   ├── google-books/      # Google Books API
│   ├── recommendations/   # Personalized recommendations
│   └── search/            # Global search functionality
├── auth/                   # Authentication pages
├── dashboard/              # User dashboard
├── music/                  # Music discovery and management
├── books/                  # Book discovery and management
├── movies/                 # Movie discovery and management
├── series/                 # TV series discovery and management
├── profile/                # User profile management
├── community/              # Social features
└── layout.tsx              # Root layout with providers
```

### Components (`/components`)
```
components/
├── ui/                     # Reusable UI components (shadcn/ui)
├── auth-provider.tsx       # Authentication context provider
├── theme-provider.tsx      # Dark/light theme provider
├── header.tsx              # Navigation header
├── community-feed.tsx      # Social media feed
├── review-post.tsx         # Individual review display
├── enhanced-create-post.tsx # Post creation interface
├── audio-player.tsx        # Music player component
├── movie-card.tsx          # Movie display card
├── profile-sections/       # Profile-specific components
└── layout-wrapper.tsx      # Layout wrapper component
```

### Hooks (`/hooks`)
```
hooks/
├── use-current-user.ts     # Current user authentication state
├── use-notifications.ts    # Notification management
├── use-reviews.ts          # Review data management
├── use-recommendations.ts  # Recommendation system
├── use-search.ts           # Search functionality
├── use-music-api.ts        # Music API integration
├── use-google-books.ts     # Google Books integration
├── use-trending-books.ts   # Trending books data
├── use-user-connections.ts # User following system
└── use-collections.ts      # User collections management
```

### Utilities (`/lib`)
```
lib/
├── firebase.ts             # Firebase configuration
├── firebase-admin.ts       # Server-side Firebase admin
├── spotify.tsx             # Spotify API utilities
├── tmdb.ts                 # TMDB API utilities
├── books-api.ts            # Book API utilities
├── search-service.ts       # Search functionality
└── utils.ts                # General utility functions
```

## 🚀 Key Features

### 1. Multi-Media Support
- **Music**: Spotify integration, JioSaavn support, album/artist/song management
- **Books**: NYTimes bestsellers, Google Books integration, reading lists
- **Movies**: TMDB integration, movie discovery, ratings and reviews
- **TV Series**: Series tracking, episode management, binge-watching features

### 2. Social Networking
- **User Profiles**: Customizable profiles with media collections
- **Following System**: Follow other users to see their reviews and recommendations
- **Community Feed**: Social media-style feed of friends' activities
- **Reviews & Ratings**: 5-star rating system with detailed review capabilities

### 3. Discovery & Recommendations
- **Personalized Feed**: Content from followed users
- **Trending Content**: Popular media across all categories
- **Search**: Global search across all media types
- **Recommendations**: AI-powered suggestions based on user preferences

### 4. Authentication & User Management
- **Firebase Auth**: Email/password and social authentication
- **Spotify OAuth**: Seamless music service integration
- **User Profiles**: Customizable user information and preferences
- **Collections**: Personal media libraries and wishlists

## 🔌 API Integrations

### Spotify API
- User authentication and profile data
- Playlist management and creation
- Top artists and tracks
- Recently played music
- Album and artist information

### TMDB API
- Movie and TV series search
- Detailed media information
- Cast and crew data
- High-quality poster images
- Release dates and ratings

### NYTimes Books API
- Bestseller lists (fiction, non-fiction, etc.)
- Book recommendations
- Publishing information
- Author details

### JioSaavn API
- Indian music catalog
- Song, album, and artist search
- Playlist management
- Music streaming integration

### Google Books API
- Comprehensive book search
- Book metadata and covers
- Author information
- Publishing details

## 🎨 UI/UX Features

### Design System
- **Responsive Design**: Mobile-first approach with responsive breakpoints
- **Dark/Light Theme**: Toggle between themes with system preference detection
- **Modern UI**: Clean, card-based design with smooth animations
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

### Component Library
- **Shadcn/ui**: High-quality, accessible components
- **Custom Components**: Specialized media and social components
- **Responsive Layouts**: Adaptive designs for all screen sizes
- **Interactive Elements**: Hover effects, transitions, and micro-interactions

## 🔒 Security & Performance

### Security Features
- **Firebase Security Rules**: Database access control
- **NextAuth.js**: Secure authentication handling
- **Environment Variables**: Secure API key management
- **Input Validation**: Form validation and sanitization

### Performance Optimizations
- **Next.js Image Optimization**: Automatic image optimization
- **Code Splitting**: Dynamic imports and lazy loading
- **Firebase Caching**: Efficient data fetching and caching
- **Responsive Images**: Adaptive image loading for different devices

## 📱 Mobile Experience

### Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Touch-Friendly**: Large touch targets and gestures
- **Progressive Web App**: Offline capabilities and app-like experience
- **Mobile Navigation**: Collapsible sidebar and mobile menu

## 🧪 Development & Testing

### Development Tools
- **ESLint**: Code quality and consistency
- **TypeScript**: Type safety and developer experience
- **Hot Reload**: Fast development iteration
- **Environment Management**: Multiple environment configurations

### Testing Strategy
- **Component Testing**: Individual component testing
- **Integration Testing**: API endpoint testing
- **E2E Testing**: User workflow testing
- **Performance Testing**: Load time and optimization testing

## 🚀 Deployment & Infrastructure

### Hosting
- **Vercel**: Next.js optimized hosting platform
- **Firebase Hosting**: Alternative hosting option
- **Environment Variables**: Secure configuration management

### Database
- **Firestore**: NoSQL document database
- **Real-time Updates**: Live data synchronization
- **Scalability**: Automatic scaling and performance optimization

## 📊 Data Models

### Core Entities
- **Users**: Authentication, profiles, preferences
- **Reviews**: Media reviews with ratings and content
- **Collections**: User media libraries
- **Media**: Music, books, movies, series metadata
- **Social**: Following relationships, likes, comments

### Data Relationships
- Users can follow other users
- Users can create reviews for media items
- Users can maintain collections of media
- Reviews can be liked and commented on
- Media items can be rated and reviewed

## 🔮 Future Enhancements

### Planned Features
- **AI Recommendations**: Machine learning-based suggestions
- **Social Features**: Comments, sharing, and discussions
- **Analytics**: User listening/reading/watching statistics
- **Mobile App**: Native mobile applications
- **API Expansion**: Additional media service integrations

### Technical Improvements
- **Performance Optimization**: Advanced caching and optimization
- **Scalability**: Database optimization and CDN integration
- **Monitoring**: Application performance monitoring
- **Testing**: Comprehensive test coverage

## 📚 Documentation

### Additional Resources
- `FOLLOWING_SYSTEM_README.md` - User following system details
- `NYTIMES_API_INTEGRATION.md` - NYTimes API integration guide
- `RECOMMENDATIONS_FEATURE.md` - Recommendation system documentation
- `SERIES_AND_BOOKS_TODO.md` - Development roadmap and tasks

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm package manager
- Firebase project setup
- API keys for external services

### Installation
```bash
pnpm install
pnpm dev
```

### Environment Setup
Required environment variables:
- Firebase configuration
- Spotify API credentials
- TMDB API key
- NYTimes API key
- NextAuth secret

This codebase represents a modern, full-stack media social platform with comprehensive API integrations, responsive design, and scalable architecture built on Next.js and Firebase.

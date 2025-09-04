# 🎧 Reliva - Comprehensive Project Index

## 📋 Project Overview

**Reliva** is a comprehensive media discovery and sharing platform that allows users to track, review, and share their favorite music, books, movies, and TV series all in one place. The platform emphasizes community-driven content discovery with a "no gatekeeping" philosophy.

### 🎯 Core Mission

- **Unified Media Platform**: All media types (music, books, movies, TV) in one place
- **Community-Driven**: Share what you love with friends and followers
- **No Gatekeeping**: Pure passion for media discovery and sharing
- **Social Features**: Follow users, like reviews, get recommendations

---

## 🏗️ Technical Architecture

### **Framework & Stack**

- **Frontend**: Next.js 15.2.4 with React 18.2.0
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Radix UI primitives with custom styling
- **Authentication**: Firebase Auth + NextAuth.js (Spotify OAuth)
- **Database**: Firebase Firestore + MongoDB (hybrid approach)
- **File Storage**: Firebase Storage + Cloudinary
- **Deployment**: Netlify (configured)

### **Key Dependencies**

```json
{
  "next": "15.2.4",
  "react": "^18.2.0",
  "firebase": "^11.7.1",
  "next-auth": "^4.24.11",
  "tailwindcss": "^3.4.17",
  "zustand": "^5.0.8",
  "axios": "^1.10.0",
  "lucide-react": "^0.454.0"
}
```

---

## 📁 Project Structure

```
reliva-web/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   ├── auth/                     # Authentication pages
│   ├── books/                    # Books section
│   ├── movies/                   # Movies section
│   ├── music/                    # Music section
│   ├── series/                   # TV Series section
│   ├── reviews/                  # Reviews & Community
│   ├── profile/                  # User profiles
│   └── [other pages]/
├── components/                   # React Components
│   ├── ui/                       # Reusable UI components
│   └── [feature components]/
├── hooks/                        # Custom React hooks
├── lib/                          # Utility libraries
├── types/                        # TypeScript definitions
├── styles/                       # Global styles
└── public/                       # Static assets
```

---

## 🔌 API Routes & External Integrations

### **Authentication & User Management**

- **`/api/auth/[...nextauth]`**: NextAuth.js configuration with Spotify OAuth
- **`/api/auth/session`**: Session management
- **`/api/auth/_login`**: Custom login logic

### **Music APIs**

- **`/api/spotify/`**: Spotify Web API integration
  - User playlists, top artists/tracks
  - Recently played, saved albums/tracks
  - Playlist management (add/remove tracks)
- **`/api/saavn/`**: JioSaavn API integration
  - Song, album, artist search
  - Indian music catalog access
- **`/api/music-api/`**: General music API wrapper
- **`/api/music-preview/`**: Track preview URLs

### **Movies & TV APIs**

- **`/api/tmdb/`**: The Movie Database (TMDB) integration
  - Movie/TV search, details, trending
  - Popular, top-rated, upcoming content
  - Genre-based filtering
- **`/api/youtube/`**: YouTube integration for trailers

### **Books APIs**

- **`/api/google-books/`**: Google Books API
- **`/api/nytimes/`**: New York Times Books API
  - Bestseller lists, book reviews

### **Core Features**

- **`/api/reviews/`**: Review management
- **`/api/recommendations/`**: Content recommendations
- **`/api/search/`**: Unified search across all media types
- **`/api/trending/`**: Trending content aggregation

---

## 🎨 Component Architecture

### **Layout Components**

- **`header.tsx`**: Main navigation sidebar with collapsible design
- **`layout-wrapper.tsx`**: App layout with authentication handling
- **`mobile-header.tsx`**: Mobile-responsive navigation
- **`footer.tsx`**: Site footer (shown only for non-authenticated users)

### **Authentication Components**

- **`auth-provider.tsx`**: NextAuth session provider
- **`theme-provider.tsx`**: Dark/light theme management

### **Media Components**

- **`movie-card.tsx`**: Movie display cards
- **`audio-player.tsx`**: Music player component
- **`video-player.tsx`**: Video player for trailers
- **`youtube-player.tsx`**: YouTube video integration

### **Community Features**

- **`community-feed.tsx`**: Social feed for reviews
- **`review-post.tsx`**: Individual review display
- **`enhanced-create-post.tsx`**: Review creation interface
- **`reviews-section.tsx`**: Reviews listing and management

### **Profile & User Management**

- **`user-profile.tsx`**: User profile display
- **`edit-profile.tsx`**: Profile editing interface
- **`profile-*-section.tsx`**: Media-specific profile sections

### **UI Components** (`/components/ui/`)

- Complete set of Radix UI components with custom styling
- Form components, modals, dropdowns, tooltips
- Responsive design components

---

## 🪝 Custom Hooks

### **Authentication & User**

- **`use-current-user.ts`**: Firebase auth state management
- **`use-userdata.ts`**: User data fetching and management
- **`use-user-connections.ts`**: Following/followers system

### **Media Management**

- **`use-music-api.ts`**: Spotify API integration
- **`use-movie-profile.ts`**: Movie data management
- **`use-series-profile.ts`**: TV series data management
- **`use-books-profile.ts`**: Books data management
- **`use-music-profile.ts`**: Music profile management

### **Reviews & Community**

- **`use-reviews.ts`**: Review CRUD operations
- **`use-all-reviews.ts`**: All reviews fetching
- **`use-followed-reviews.ts`**: Following users' reviews
- **`use-ratings.ts`**: Rating system management

### **Search & Discovery**

- **`use-search.ts`**: Unified search functionality
- **`use-recommendations.ts`**: Content recommendations
- **`use-trending-books.ts`**: Trending books
- **`use-nytimes-books.ts`**: NYT bestsellers

### **Utility Hooks**

- **`use-mobile.tsx`**: Mobile device detection
- **`use-toast.ts`**: Toast notifications
- **`use-notifications.ts`**: Notification system
- **`use-cloudinary-upload.ts`**: Image upload handling

---

## 📚 Library Utilities

### **Firebase Integration** (`lib/firebase.ts`)

- Firebase app initialization
- Authentication, Firestore, Storage setup
- Analytics configuration

### **External API Clients**

- **`lib/tmdb.ts`**: TMDB API client with comprehensive movie/TV functions
- **`lib/spotify.tsx`**: Spotify API integration
- **`lib/books-api.ts`**: Books API utilities
- **`lib/cloudinary.ts`**: Image upload and management

### **Utilities**

- **`lib/utils.ts`**: Tailwind CSS class merging utility
- **`lib/search-service.ts`**: Search functionality
- **`lib/spotify-tokens.ts`**: Spotify token management

---

## 🎭 Type Definitions

### **Review System** (`types/review.ts`)

```typescript
interface Review {
  id: string;
  userId: string;
  mediaType: "movie" | "book" | "music" | "series";
  mediaTitle: string;
  title: string;
  content: string;
  rating: number; // 1-5 stars
  isPublic: boolean;
  likes: number;
  helpfulVotes: number;
  // ... additional fields
}
```

### **Authentication** (`types/next-auth.d.ts`)

- Extended NextAuth types for Spotify integration
- Custom session and user properties

---

## 🎨 Styling & Design System

### **CSS Architecture**

- **`globals.css`**: Global styles and CSS variables
- **`mobile-responsive.css`**: Mobile-specific styles
- **`horizontal-list.css`**: Horizontal scrolling components

### **Design Principles**

- **Dark-first design** with light mode support
- **Mobile-responsive** with collapsible sidebar
- **Gradient accents** (emerald, blue, purple)
- **Modern glassmorphism** effects
- **Smooth animations** and transitions

### **Color Palette**

- Primary: Emerald (#10b981) to Blue (#3b82f6)
- Accent: Purple (#8b5cf6)
- Background: Dark zinc (#18181b) / Light gray
- Text: High contrast white/black

---

## 🔐 Authentication Flow

### **Multi-Provider Setup**

1. **Firebase Auth**: Primary authentication system
2. **NextAuth.js**: Session management with Spotify OAuth
3. **Hybrid Database**: Firebase Firestore + MongoDB

### **User Creation Process**

1. User signs in via Spotify OAuth
2. Firebase creates user document
3. MongoDB user created with `authorId`
4. User data synchronized between systems

---

## 📱 Key Features

### **Media Discovery**

- **Unified Search**: Search across all media types
- **Trending Content**: Real-time trending movies, music, books
- **Recommendations**: AI-powered content suggestions
- **Genre Filtering**: Browse by categories

### **Social Features**

- **User Profiles**: Comprehensive media profiles
- **Following System**: Follow users for personalized feeds
- **Review System**: Rate and review all media types
- **Community Feed**: See what friends are consuming

### **Media Management**

- **Collections**: Organize favorite content
- **Wishlists**: Save content for later
- **Progress Tracking**: Track reading/watching progress
- **Import from Spotify**: Sync music preferences

### **Content Creation**

- **Rich Reviews**: Detailed review system with ratings
- **Media Posts**: Share thoughts on specific content
- **Image Uploads**: Cloudinary integration for media
- **Spoiler Warnings**: Protect other users from spoilers

---

## 🚀 Deployment & Configuration

### **Environment Variables**

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=

# Spotify
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
NEXTAUTH_SECRET=

# TMDB
NEXT_PUBLIC_TMDB_API_KEY=

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
```

### **Build Configuration**

- **Next.js 15** with App Router
- **TypeScript** strict mode
- **ESLint** configuration
- **Tailwind CSS** with custom config
- **Netlify** deployment ready

---

## 📊 Data Flow Architecture

### **Client-Side State Management**

- **React Hooks**: Custom hooks for data fetching
- **Zustand**: Global state management (if needed)
- **Firebase Realtime**: Real-time updates for social features

### **API Integration Pattern**

1. **Client Components** use custom hooks
2. **Hooks** call Next.js API routes
3. **API Routes** integrate with external services
4. **Data** flows back through the chain

### **Database Strategy**

- **Firebase Firestore**: User data, reviews, social features
- **MongoDB**: Extended user profiles, complex queries
- **External APIs**: Real-time media data

---

## 🔧 Development Scripts

### **Available Commands**

```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm start        # Production server
pnpm lint         # ESLint checking
```

### **Testing Scripts** (`/scripts/`)

- **`add-test-data.js`**: Seed test data
- **`test-nytimes-api.js`**: API testing
- **`test-recommendations.js`**: Recommendation testing
- **`cleanup-test-data.js`**: Cleanup utilities

---

## 📈 Performance Optimizations

### **Image Optimization**

- **Next.js Image**: Automatic optimization
- **Cloudinary**: Advanced image transformations
- **Lazy Loading**: Component-level lazy loading

### **Code Splitting**

- **Dynamic Imports**: Route-based code splitting
- **Component Lazy Loading**: Heavy components loaded on demand

### **Caching Strategy**

- **API Response Caching**: External API responses
- **Static Generation**: Pre-built pages where possible
- **Client-Side Caching**: React Query patterns

---

## 🛡️ Security Considerations

### **Authentication Security**

- **OAuth 2.0**: Secure third-party authentication
- **JWT Tokens**: Secure session management
- **Firebase Rules**: Database security rules

### **API Security**

- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Sanitize all user inputs
- **CORS Configuration**: Proper cross-origin setup

---

## 🎯 Future Roadmap

### **Planned Features**

- **Real-time Chat**: User messaging system
- **Advanced Recommendations**: ML-powered suggestions
- **Mobile App**: React Native application
- **API Rate Limiting**: Enhanced API protection
- **Content Moderation**: Automated content filtering

### **Technical Improvements**

- **Performance Monitoring**: Real-time performance tracking
- **Error Tracking**: Comprehensive error logging
- **A/B Testing**: Feature experimentation
- **Analytics**: User behavior tracking

---

## 📞 Support & Documentation

### **Additional Documentation**

- **`FOLLOWING_SYSTEM_README.md`**: Following system details
- **`RECOMMENDATIONS_FEATURE.md`**: Recommendation system
- **`NYTIMES_API_INTEGRATION.md`**: NYT API integration
- **`THREAD_NAVIGATION_README.md`**: Navigation system

### **Code Quality**

- **TypeScript**: Full type safety
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Component Documentation**: JSDoc comments

---

_This comprehensive index provides a complete overview of the Reliva project architecture, features, and implementation details. The platform represents a modern, scalable approach to media discovery and social sharing._



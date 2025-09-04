# Reliva - Comprehensive Codebase Index

## 🎯 Project Overview

**Reliva** is a modern social media platform for sharing and discovering media content (movies, TV shows, books, and music). Built with Next.js 15, it provides a unified platform where users can rate, review, and share their favorite content.

### Key Features
- **Multi-media Support**: Movies, TV shows, books, and music
- **Social Features**: Reviews, ratings, comments, likes, and following system
- **Real-time Updates**: WebSocket integration for live feed updates
- **Search & Discovery**: Advanced search across multiple APIs (TMDB, Google Books, Saavn)
- **User Profiles**: Customizable profiles with avatar/cover image uploads
- **Responsive Design**: Mobile-first design with dark/light theme support

---

## 🏗️ Architecture & Tech Stack

### Frontend
- **Framework**: Next.js 15.2.4 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Radix UI primitives with custom styling
- **State Management**: React hooks + Zustand
- **Authentication**: Firebase Auth + NextAuth.js
- **Database**: Firebase Firestore
- **Real-time**: WebSocket connections
- **Image Upload**: Cloudinary integration

### Backend APIs
- **TMDB API**: Movies and TV shows data
- **Google Books API**: Book information and search
- **Saavn API**: Music search and streaming
- **Spotify API**: Playlist integration
- **YouTube API**: Video content

### Development Tools
- **Package Manager**: pnpm (preferred over yarn)
- **Linting**: ESLint with Next.js config
- **Type Checking**: TypeScript with strict mode

---

## 📁 Project Structure

```
reliva-web/
├── app/                          # Next.js App Router
│   ├── api/                     # API routes
│   ├── auth/                    # Authentication pages
│   ├── books/                   # Books section
│   ├── community/               # Community features
│   ├── dashboard/               # User dashboard
│   ├── movies/                  # Movies section
│   ├── music/                   # Music section
│   ├── profile/                 # User profiles
│   ├── reviews/                 # Reviews and feed
│   ├── series/                  # TV series section
│   ├── users/                   # User management
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
├── components/                   # Reusable components
│   ├── ui/                      # Base UI components
│   ├── auth-provider.tsx        # Authentication context
│   ├── header.tsx               # Navigation sidebar
│   ├── layout-wrapper.tsx       # Layout management
│   ├── theme-provider.tsx       # Theme context
│   └── [feature-components]     # Feature-specific components
├── hooks/                       # Custom React hooks
├── lib/                         # Utility libraries
├── public/                      # Static assets
├── styles/                      # Additional stylesheets
├── types/                       # TypeScript type definitions
└── scripts/                     # Development scripts
```

---

## 🔧 Core Components

### Authentication System
- **Firebase Auth**: Primary authentication
- **NextAuth.js**: Session management
- **User Mapping**: Firebase UID to MongoDB authorId mapping
- **Profile Management**: User profiles with avatar/cover uploads

### Media Search & Discovery
- **SearchService**: Unified search across multiple APIs
- **TMDB Integration**: Movies and TV shows
- **Google Books**: Book search and details
- **Saavn API**: Music search and streaming
- **Real-time Search**: Instant search results

### Social Features
- **Reviews System**: Rate and review media content
- **Comments & Replies**: Nested comment system
- **Likes & Interactions**: Like posts and comments
- **Following System**: Follow other users
- **Real-time Feed**: WebSocket-powered live updates

---

## 🚀 Key Features Breakdown

### 1. Landing Page (`app/page.tsx`)
- **Hero Section**: Animated background with call-to-action
- **Feature Showcase**: Platform capabilities demonstration
- **Responsive Design**: Mobile-optimized layout
- **Authentication Flow**: Redirects authenticated users

### 2. Reviews & Feed (`app/reviews/page.tsx`)
- **Media Search**: Search across movies, shows, books, music
- **Review Creation**: Rate and review selected media
- **Social Feed**: Real-time posts and interactions
- **Comment System**: Nested replies with threading
- **WebSocket Integration**: Live updates

### 3. Navigation (`components/header.tsx`)
- **Collapsible Sidebar**: Desktop and mobile responsive
- **User Menu**: Profile, settings, logout
- **Notification Badge**: Unread notifications count
- **Discover Section**: Media type navigation

### 4. User Profiles (`hooks/use-profile.ts`)
- **Profile Management**: Bio, avatar, cover image
- **Image Upload**: Cloudinary integration
- **Social Links**: External profile connections
- **Privacy Settings**: Visibility controls

---

## 🔌 API Integration

### External APIs
1. **TMDB (The Movie Database)**
   - Movies and TV shows data
   - Search, trending, popular content
   - Detailed information and images

2. **Google Books API**
   - Book search and metadata
   - Author information
   - Cover images and descriptions

3. **Saavn API**
   - Music search (songs and albums)
   - Artist information
   - Streaming integration

4. **Spotify API**
   - Playlist management
   - User music preferences
   - OAuth integration

### Internal APIs (`app/api/`)
- **Authentication**: Session management
- **Search**: Unified search endpoints
- **Media Details**: Detailed content information
- **User Management**: Profile and following system
- **Recommendations**: Personalized content suggestions

---

## 🎨 UI/UX Design

### Design System
- **Color Palette**: Dark theme with emerald/blue accents
- **Typography**: Inter font family
- **Spacing**: Consistent spacing scale
- **Components**: Radix UI primitives with custom styling

### Responsive Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

---

## 🔐 Security & Authentication

### Authentication Flow
1. **Firebase Auth**: Primary authentication provider
2. **User Creation**: Automatic user document creation
3. **Author ID Mapping**: Firebase UID to MongoDB mapping
4. **Session Management**: NextAuth.js session handling

### Data Security
- **Environment Variables**: Secure API key management
- **Firestore Rules**: Database security rules
- **Image Upload**: Cloudinary secure upload
- **CORS Configuration**: Proper cross-origin setup

---

## 🚀 Development Workflow

### Getting Started
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

### Environment Setup
Required environment variables:
- `NEXT_PUBLIC_FIREBASE_*`: Firebase configuration
- `NEXT_PUBLIC_TMDB_API_KEY`: TMDB API key
- `NEXT_PUBLIC_CLOUDINARY_*`: Cloudinary configuration
- `NEXTAUTH_SECRET`: NextAuth.js secret
- `NEXT_PUBLIC_API_BASE`: Backend API base URL

---

## 🔄 Real-time Features

### WebSocket Integration
- **Live Feed Updates**: Real-time post updates
- **Comment Notifications**: Instant comment notifications
- **Like Updates**: Real-time like counts
- **User Presence**: Online status indicators

### State Management
- **React Hooks**: Local component state
- **Zustand**: Global state management
- **Firebase Realtime**: Database listeners
- **WebSocket State**: Connection management

---

## 📊 Performance Optimization

### Frontend Optimization
- **Next.js Optimization**: Built-in performance features
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic route-based splitting
- **Lazy Loading**: Component and image lazy loading

### Backend Optimization
- **API Caching**: Response caching strategies
- **Database Indexing**: Firestore query optimization
- **CDN Integration**: Cloudinary for image delivery
- **WebSocket Efficiency**: Connection pooling

---

## 🔮 Future Enhancements

### Planned Features
- **Advanced Recommendations**: ML-powered suggestions
- **Social Groups**: Community features
- **Content Moderation**: Automated content filtering
- **Analytics Dashboard**: User engagement metrics
- **Mobile App**: React Native mobile application

### Technical Improvements
- **Performance Monitoring**: Real-time performance tracking
- **Error Tracking**: Comprehensive error logging
- **A/B Testing**: Feature experimentation
- **Internationalization**: Multi-language support

---

*This comprehensive index provides a complete overview of the Reliva codebase, its architecture, features, and development practices.*
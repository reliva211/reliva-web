# Reliva Codebase Index

## 🎧 Project Overview

**Reliva** is a comprehensive media discovery and sharing platform that allows users to track, rate, and review music, books, movies, and TV series all in one place. The platform emphasizes community-driven content discovery with a "no gatekeeping" philosophy.

### Key Features
- **Multi-media Support**: Music, Books, Movies, TV Series
- **Social Features**: Reviews, ratings, likes, community feed
- **External API Integration**: Spotify, TMDB, MusicBrainz, MusicAPI
- **Authentication**: Firebase Auth with NextAuth.js
- **Real-time Database**: Firebase Firestore
- **Modern UI**: Next.js 15 with Tailwind CSS and Radix UI components

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Backend**: Next.js API routes, Firebase
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth + NextAuth.js
- **External APIs**: Spotify, TMDB, MusicBrainz, MusicAPI
- **Package Manager**: pnpm

### Project Structure
```
reliva-web/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── books/             # Books section
│   ├── community/         # Community features
│   ├── contact/           # Contact/About pages
│   ├── dashboard/         # User dashboard
│   ├── home/              # Home page
│   ├── login/             # Login page
│   ├── movies/            # Movies section
│   ├── music/             # Music section
│   ├── person/            # Person details
│   ├── profile/           # User profile
│   ├── reviews/           # Reviews section
│   ├── series/            # TV series section
│   ├── signup/            # Signup page
│   ├── spotify/           # Spotify integration
│   ├── users/             # User discovery
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/                # Reusable UI components (Radix-based)
│   ├── audio-player.tsx   # Music player component
│   ├── auth-provider.tsx  # Authentication context
│   ├── collection-section.tsx
│   ├── community-feed.tsx
│   ├── debug-panel.tsx
│   ├── edit-profile.tsx
│   ├── enhanced-create-post.tsx
│   ├── enhanced-media-bar.tsx
│   ├── error-boundary.tsx
│   ├── footer.tsx
│   ├── header.tsx         # Main navigation sidebar
│   ├── horizontal-list.tsx
│   ├── image-upload-preview.tsx
│   ├── image-upload.tsx
│   ├── layout-wrapper.tsx
│   ├── mode-toggle.tsx    # Dark/light mode toggle
│   ├── movie-card.tsx
│   ├── post-success-toast.tsx
│   ├── rating-stars.tsx   # Star rating component
│   ├── review-post.tsx    # Review display component
│   ├── reviews-section.tsx
│   ├── search-modal.tsx
│   ├── spotify-folder.tsx
│   ├── spotify-playlists.tsx
│   ├── theme-provider.tsx
│   └── user-profile.tsx
├── hooks/                 # Custom React hooks
│   ├── use-collections.ts
│   ├── use-current-user.ts # User authentication hook
│   ├── use-mobile.tsx
│   ├── use-music-api.ts   # Music API integration
│   ├── use-profile.ts
│   ├── use-ratings.ts
│   ├── use-reviews.ts
│   ├── use-search.ts
│   ├── use-toast.ts
│   └── use-userdata.ts
├── lib/                   # Utility libraries
│   ├── firebase-admin.ts  # Firebase admin SDK
│   ├── firebase.ts        # Firebase client config
│   ├── search-service.ts
│   ├── spotify-tokens.ts
│   ├── spotify.tsx        # Spotify API utilities
│   ├── tmdb.ts           # TMDB API utilities
│   └── utils.ts          # General utilities
├── types/                 # TypeScript type definitions
│   ├── next-auth.d.ts
│   └── review.ts         # Review data types
├── public/               # Static assets
├── styles/               # Additional stylesheets
└── Configuration files
    ├── package.json
    ├── tailwind.config.ts
    ├── tsconfig.json
    └── next.config.mjs
```

## 🔧 Core Features

### 1. Authentication System
- **Firebase Auth**: Primary authentication provider
- **NextAuth.js**: Additional authentication layer with Spotify integration
- **User Management**: Profile creation, user data storage in Firestore
- **Session Management**: Persistent login state

**Key Files:**
- `app/api/auth/[...nextauth]/route.ts` - NextAuth configuration
- `hooks/use-current-user.ts` - User authentication hook
- `components/auth-provider.tsx` - Auth context provider

### 2. Media Discovery & Management

#### Music Section (`/music`)
- **MusicBrainz Integration**: Artist, album, and track search
- **Spotify Integration**: Playlist management, track previews
- **MusicAPI Integration**: Enhanced music search capabilities
- **Favorites System**: Save and manage favorite music
- **Audio Player**: Preview tracks with embedded player

**Key Files:**
- `app/music/page.tsx` - Main music page
- `lib/spotify.tsx` - Spotify API utilities
- `app/api/music-api/route.ts` - MusicAPI integration
- `components/audio-player.tsx` - Music player component

#### Movies Section (`/movies`)
- **TMDB Integration**: Movie search and details
- **Rating System**: Star-based ratings
- **Movie Details**: Comprehensive movie information
- **Trending Movies**: Daily trending content

**Key Files:**
- `app/movies/page.tsx` - Movies listing
- `app/movies/[id]/page.tsx` - Movie details
- `lib/tmdb.ts` - TMDB API utilities

#### TV Series Section (`/series`)
- **TMDB Integration**: TV series search and details
- **Season Management**: Episode and season information
- **Series Details**: Comprehensive series information

**Key Files:**
- `app/series/page.tsx` - Series listing
- `app/series/[id]/page.tsx` - Series details

#### Books Section (`/books`)
- **Book Management**: Book search and tracking
- **Reading Lists**: Organize books by status
- **Book Reviews**: Rate and review books

**Key Files:**
- `app/books/page.tsx` - Books listing

### 3. Review System
- **Multi-media Reviews**: Review movies, books, music, and series
- **Rating System**: 1-5 star ratings
- **Like System**: Like and interact with reviews
- **Review Feed**: Community review display
- **Review Creation**: Comprehensive review form

**Key Files:**
- `app/reviews/page.tsx` - Reviews page
- `components/review-post.tsx` - Review display component
- `components/enhanced-create-post.tsx` - Review creation
- `types/review.ts` - Review data types

### 4. Community Features
- **User Discovery**: Find and follow other users
- **Community Feed**: Social media-style feed
- **User Profiles**: Detailed user profiles
- **Social Interactions**: Like, comment, share

**Key Files:**
- `app/community/page.tsx` - Community feed
- `app/users/page.tsx` - User discovery
- `app/profile/page.tsx` - User profile
- `components/community-feed.tsx` - Community component

### 5. Navigation & UI
- **Responsive Sidebar**: Collapsible navigation
- **Dark/Light Mode**: Theme switching
- **Mobile Support**: Responsive design
- **Search Functionality**: Global search across media types

**Key Files:**
- `components/header.tsx` - Main navigation sidebar
- `components/mode-toggle.tsx` - Theme toggle
- `components/layout-wrapper.tsx` - Layout management

## 🔌 API Integrations

### 1. Firebase
- **Authentication**: User sign-up, sign-in, session management
- **Firestore**: Real-time database for user data, reviews, favorites
- **Storage**: File uploads for images and media

### 2. Spotify
- **OAuth Integration**: User authentication
- **Playlist Management**: Access and manage user playlists
- **Track Search**: Search and preview tracks
- **User Library**: Access user's saved music

### 3. TMDB (The Movie Database)
- **Movie Search**: Search movies by title, genre, etc.
- **Movie Details**: Comprehensive movie information
- **TV Series**: Search and details for TV shows
- **Trending Content**: Daily trending movies and series

### 4. MusicBrainz
- **Music Metadata**: Comprehensive music database
- **Artist Information**: Detailed artist profiles
- **Album Data**: Complete album information
- **Track Details**: Track metadata and relationships

### 5. MusicAPI
- **Enhanced Music Search**: Additional music search capabilities
- **Playlist Operations**: Create and manage playlists
- **Track Management**: Add/remove tracks from playlists

## 🎨 UI/UX Features

### Design System
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Custom Components**: Tailored UI components
- **Responsive Design**: Mobile-first approach

### Theme System
- **Dark/Light Mode**: Automatic theme switching
- **CSS Variables**: Dynamic theming
- **Consistent Design**: Unified design language

### Interactive Elements
- **Hover Effects**: Smooth transitions and animations
- **Loading States**: Skeleton loaders and spinners
- **Toast Notifications**: User feedback system
- **Modal Dialogs**: Contextual information display

## 🔒 Security & Performance

### Security Features
- **Environment Variables**: Secure API key management
- **Authentication Guards**: Protected routes and components
- **Input Validation**: Form validation and sanitization
- **CORS Configuration**: Proper cross-origin handling

### Performance Optimizations
- **Next.js Optimization**: Built-in performance features
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic route-based splitting
- **Caching**: Strategic caching strategies

## 📱 Mobile Support

### Responsive Design
- **Mobile-First**: Mobile-optimized layouts
- **Touch Interactions**: Touch-friendly interface
- **Progressive Enhancement**: Graceful degradation
- **Performance**: Optimized for mobile devices

## 🚀 Development & Deployment

### Development Setup
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

### Environment Variables
Required environment variables:
- `NEXT_PUBLIC_FIREBASE_*` - Firebase configuration
- `NEXT_PUBLIC_TMDB_API_KEY` - TMDB API key
- `SPOTIFY_CLIENT_ID` - Spotify OAuth client ID
- `SPOTIFY_CLIENT_SECRET` - Spotify OAuth client secret
- `MUSICAPI_CLIENT_ID` - MusicAPI client ID
- `MUSICAPI_CLIENT_SECRET` - MusicAPI client secret
- `NEXTAUTH_SECRET` - NextAuth secret

### Key Dependencies
- **Next.js 15**: React framework
- **React 19**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Firebase**: Backend services
- **NextAuth.js**: Authentication
- **Radix UI**: Component primitives
- **Lucide React**: Icons
- **Axios**: HTTP client

## 🎯 Future Enhancements

### Planned Features
- **Real-time Chat**: User messaging system
- **Advanced Search**: Filters and sorting options
- **Recommendations**: AI-powered content recommendations
- **Social Features**: Comments, sharing, following
- **Mobile App**: Native mobile applications
- **Analytics**: User behavior tracking
- **Moderation**: Content moderation tools

### Technical Improvements
- **Performance**: Further optimization and caching
- **Accessibility**: Enhanced accessibility features
- **Testing**: Comprehensive test coverage
- **Documentation**: Enhanced developer documentation
- **Monitoring**: Error tracking and performance monitoring

---

*This index provides a comprehensive overview of the Reliva codebase. For detailed implementation specifics, refer to the individual files and their inline documentation.* 
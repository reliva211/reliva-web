# Reliva Codebase Index

## 🎧 Project Overview

**Reliva** is a comprehensive media discovery and sharing platform that allows users to track, rate, and review music, books, movies, and TV series all in one place. The platform emphasizes community-driven content discovery with a "no gatekeeping" philosophy.

### Key Features

- **Multi-media Support**: Music, Books, Movies, TV Series
- **Social Features**: Reviews, ratings, likes, community feed, following system
- **External API Integration**: Spotify, TMDB, MusicBrainz, MusicAPI, Saavn, NYTimes Books API
- **Authentication**: Firebase Auth with NextAuth.js
- **Real-time Database**: Firebase Firestore
- **Modern UI**: Next.js 15 with Tailwind CSS and Radix UI components
- **Following System**: Follow users and see personalized feeds
- **Recommendations**: Discover content from other users' collections
- **Notifications**: Real-time user notifications
- **Bestseller Lists**: NYTimes Books API integration

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Backend**: Next.js API routes, Firebase
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth + NextAuth.js
- **External APIs**: Spotify, TMDB, MusicBrainz, MusicAPI, Saavn, NYTimes Books API, Google Books API
- **Package Manager**: pnpm

### Project Structure

```
reliva-web/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── albums/        # Album management
│   │   ├── auth/          # Authentication endpoints
│   │   ├── music-api/     # Music API integration
│   │   ├── music-preview/ # Music preview functionality
│   │   ├── nytimes/       # NYTimes Books API integration
│   │   ├── google-books/  # Google Books API integration
│   │   ├── recommendations/ # Recommendations API
│   │   ├── saavn/         # Saavn API integration
│   │   ├── search/        # Global search
│   │   ├── song/          # Song management
│   │   ├── spotify/       # Spotify integration
│   │   └── tmdb/          # TMDB API integration
│   ├── auth/              # Authentication pages
│   ├── bio/               # User bio pages
│   ├── books/             # Books section
│   ├── community/         # Community features
│   ├── contact/           # Contact/About pages
│   ├── context/           # React context providers
│   ├── dashboard/         # User dashboard
│   ├── home/              # Home page
│   ├── login/             # Login page
│   ├── movies/            # Movies section
│   ├── music/             # Music section
│   ├── notifications/     # Notifications page
│   ├── person/            # Person details
│   ├── profile/           # User profile
│   ├── recommendations/   # Recommendations page
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
│   ├── nytimes-bestsellers.tsx # NYTimes Books component

│   ├── post-success-toast.tsx
│   ├── profile-books-section.tsx
│   ├── profile-movie-section.tsx
│   ├── profile-music-section.tsx
│   ├── profile-series-section.tsx
│   ├── rating-stars.tsx   # Star rating component
│   ├── recommendations.tsx
│   ├── review-post.tsx    # Review display component
│   ├── reviews-section.tsx
│   ├── search-modal.tsx
│   ├── spotify-folder.tsx
│   ├── spotify-playlists.tsx
│   ├── theme-provider.tsx
│   └── user-profile.tsx
├── hooks/                 # Custom React hooks
│   ├── use-books-profile.ts
│   ├── use-collections.ts
│   ├── use-current-user.ts # User authentication hook
│   ├── use-followed-reviews.ts # Following system hook
│   ├── use-mobile.tsx
│   ├── use-movie-profile.ts
│   ├── use-music-api.ts   # Music API integration
│   ├── use-music-collections.ts
│   ├── use-music-profile.ts
│   ├── use-notifications.ts
│   ├── use-nytimes-books.ts # NYTimes Books API hook
│   ├── use-google-books.ts  # Google Books API hook
│   ├── use-profile.ts
│   ├── use-ratings.ts
│   ├── use-recommendations.ts # Recommendations hook
│   ├── use-reviews.ts
│   ├── use-search.ts
│   ├── use-series-profile.ts
│   ├── use-toast.ts

│   ├── use-user-connections.ts
│   └── use-userdata.ts
├── lib/                   # Utility libraries
│   ├── firebase-admin.ts  # Firebase admin SDK
│   ├── firebase.ts        # Firebase client config
│   ├── search-service.ts
│   ├── spotify-tokens.ts
│   ├── spotify.tsx        # Spotify API utilities
│   ├── tmdb.ts           # TMDB API utilities
│   └── utils.ts          # General utilities
├── scripts/               # Development and testing scripts
│   ├── add-test-collections.js
│   ├── add-test-data.js
│   ├── add-test-following-data.js
│   ├── cleanup-test-data.js
│   ├── debug-reviews.js
│   ├── test-nytimes-api.js
│   ├── test-google-books-api.js
│   └── test-recommendations.js
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

### 2. Following System

- **User Following**: Follow/unfollow other users
- **Personalized Feed**: See reviews only from followed users
- **User Discovery**: Find and connect with other users
- **Real-time Updates**: Feed updates when following changes

**Key Files:**

- `hooks/use-followed-reviews.ts` - Following system hook
- `app/users/page.tsx` - User discovery page
- `app/home/page.tsx` - Personalized feed
- `scripts/add-test-following-data.js` - Test data script

### 3. Recommendations System

- **Multi-Category Support**: Movies, books, and series recommendations
- **User Collections**: Browse other users' collections
- **Add to Collection**: One-click add items to your collections
- **Source Filtering**: Choose between friends and all users

**Key Files:**

- `app/recommendations/page.tsx` - Recommendations page
- `hooks/use-recommendations.ts` - Recommendations hook
- `app/api/recommendations/route.ts` - Recommendations API
- `components/recommendations.tsx` - Recommendations component

### 4. Media Discovery & Management

#### Music Section (`/music`)

- **MusicBrainz Integration**: Artist, album, and track search
- **Spotify Integration**: Playlist management, track previews
- **MusicAPI Integration**: Enhanced music search capabilities
- **Saavn Integration**: Additional music streaming service
- **Favorites System**: Save and manage favorite music
- **Audio Player**: Preview tracks with embedded player

**Key Files:**

- `app/music/page.tsx` - Main music page
- `lib/spotify.tsx` - Spotify API utilities
- `app/api/music-api/route.ts` - MusicAPI integration
- `app/api/saavn/search/route.ts` - Saavn API integration
- `components/audio-player.tsx` - Music player component
- `components/spotify-playlists.tsx` - Spotify playlists component
- `components/spotify-folder.tsx` - Spotify folder component

#### Movies Section (`/movies`)

- **TMDB Integration**: Movie search and details
- **Rating System**: Star-based ratings
- **Movie Details**: Comprehensive movie information
- **Trending Movies**: Daily trending content
- **Profile Integration**: User movie collections

**Key Files:**

- `app/movies/page.tsx` - Movies listing
- `app/movies/[id]/page.tsx` - Movie details
- `lib/tmdb.ts` - TMDB API utilities
- `components/profile-movie-section.tsx` - Movie profile section

#### TV Series Section (`/series`)

- **TMDB Integration**: TV series search and details
- **Season Management**: Episode and season information
- **Series Details**: Comprehensive series information
- **Profile Integration**: User series collections

**Key Files:**

- `app/series/page.tsx` - Series listing
- `app/series/[id]/page.tsx` - Series details
- `components/profile-series-section.tsx` - Series profile section

#### Books Section (`/books`)

- **Book Management**: Book search and tracking
- **Reading Lists**: Organize books by status
- **Book Reviews**: Rate and review books
- **Profile Integration**: User book collections
- **NYTimes Bestsellers**: Integration with NYTimes Books API

**Key Files:**

- `app/books/page.tsx` - Books listing
- `components/profile-books-section.tsx` - Books profile section
- `components/nytimes-bestsellers.tsx` - NYTimes bestsellers component
- `hooks/use-nytimes-books.ts` - NYTimes Books API hook
- `hooks/use-google-books.ts` - Google Books API hook
- `app/api/nytimes/books/route.ts` - NYTimes Books API endpoint
- `app/api/google-books/route.ts` - Google Books API endpoint

### 5. Review System

- **Multi-media Reviews**: Review movies, books, music, and series
- **Rating System**: 1-5 star ratings
- **Like System**: Like and interact with reviews
- **Review Feed**: Community review display
- **Review Creation**: Comprehensive review form
- **Following Integration**: See reviews from followed users

**Key Files:**

- `app/reviews/page.tsx` - Reviews page
- `components/review-post.tsx` - Review display component
- `components/enhanced-create-post.tsx` - Review creation
- `components/reviews-section.tsx` - Reviews section component
- `types/review.ts` - Review data types

### 6. Community Features

- **User Discovery**: Find and follow other users
- **Community Feed**: Social media-style feed
- **User Profiles**: Detailed user profiles with media collections
- **Social Interactions**: Like, comment, share
- **Notifications**: Real-time user notifications

**Key Files:**

- `app/community/page.tsx` - Community feed
- `app/users/page.tsx` - User discovery
- `app/profile/page.tsx` - User profile
- `app/notifications/page.tsx` - Notifications page
- `components/community-feed.tsx` - Community component
- `components/user-profile.tsx` - User profile component

### 7. Navigation & UI

- **Responsive Sidebar**: Collapsible navigation
- **Dark/Light Mode**: Theme switching
- **Mobile Support**: Responsive design
- **Search Functionality**: Global search across media types
- **Loading States**: Skeleton loaders and spinners

**Key Files:**

- `components/header.tsx` - Main navigation sidebar
- `components/mode-toggle.tsx` - Theme toggle
- `components/layout-wrapper.tsx` - Layout management
- `components/search-modal.tsx` - Search functionality

## 🔌 API Integrations

### 1. Firebase

- **Authentication**: User sign-up, sign-in, session management
- **Firestore**: Real-time database for user data, reviews, favorites, following
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

### 6. Saavn

- **Music Streaming**: Additional music streaming service
- **Search Integration**: Search for songs and albums
- **Playlist Support**: Access to Saavn playlists

### 7. NYTimes Books API

- **Bestseller Lists**: Access to NYTimes bestseller lists
- **Book Data**: Comprehensive book information
- **Multiple Lists**: Hardcover, paperback, fiction, nonfiction
- **Real-time Updates**: Current bestseller data

### 8. Google Books API

- **Book Search**: Search by title, author, ISBN, or general query
- **Detailed Information**: Publisher, page count, ratings, reviews
- **Purchase Links**: Direct links to buy books
- **Preview Functionality**: Book preview links
- **Categories**: Book categorization and genres

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
- **Image Upload**: Profile picture and media upload

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
- **Lazy Loading**: Components and images loaded on demand

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
- `NYTIMES_API_KEY` - NYTimes Books API key
- `NEXTAUTH_SECRET` - NextAuth secret

### Testing Scripts

- `scripts/add-test-data.js` - Add test users and reviews
- `scripts/add-test-following-data.js` - Add following relationships
- `scripts/add-test-collections.js` - Add media collections
- `scripts/debug-reviews.js` - Debug review functionality
- `scripts/test-recommendations.js` - Test recommendations feature
- `scripts/test-nytimes-api.js` - Test NYTimes Books API
- `scripts/cleanup-test-data.js` - Clean up test data

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
- **React Hook Form**: Form management
- **Zod**: Schema validation
- **Date-fns**: Date utilities
- **Recharts**: Data visualization
- **Sonner**: Toast notifications

## 🎯 Recent Features & Enhancements

### Following System (Latest)

- **User Following**: Follow/unfollow other users
- **Personalized Feed**: Home page shows reviews from followed users only
- **User Discovery**: Enhanced user search and discovery
- **Real-time Updates**: Feed updates when following relationships change

### Recommendations Feature

- **Multi-Category Support**: Browse movies, books, and series from other users
- **Collection Integration**: Add items directly to your collections
- **Source Filtering**: Choose between friends and all users
- **User Cards**: Expandable user recommendation cards

### NYTimes Books API Integration

- **Bestseller Lists**: Access to current NYTimes bestseller lists
- **Multiple Categories**: Hardcover, paperback, fiction, nonfiction
- **Book Details**: Comprehensive book information
- **Component Integration**: Reusable NYTimes bestsellers component

### Google Books API Integration

- **Book Search**: Search by title, author, ISBN, or general query
- **Detailed Information**: Publisher, page count, ratings, reviews
- **Purchase Links**: Direct links to buy books
- **Preview Functionality**: Book preview links
- **Categories**: Book categorization and genres

### Trending Books Feature

- **NYTimes Integration**: Display current bestseller lists
- **Google Books Integration**: Fetch detailed book information on click
- **Smart Search**: Automatic ISBN, title, and author matching
- **Purchase Options**: Direct links to buy books
- **Book Previews**: Preview functionality for available books

### Enhanced Profile Sections

- **Profile Books Section**: Comprehensive book collection management
- **Profile Movie Section**: Movie collection with status tracking
- **Profile Music Section**: Music collection and Spotify integration
- **Profile Series Section**: TV series collection management

### Improved Music Integration

- **Saavn API**: Additional music streaming service
- **Enhanced Spotify Integration**: Better playlist and folder management
- **Music Preview**: Improved audio player functionality
- **Album Management**: Better album search and organization

### Notification System

- **Real-time Notifications**: User activity notifications
- **Notification Page**: Dedicated notifications interface
- **Toast Notifications**: Enhanced user feedback

## 🔮 Future Enhancements

### Planned Features

- **Real-time Chat**: User messaging system
- **Advanced Search**: Filters and sorting options
- **AI Recommendations**: Machine learning-powered content recommendations
- **Social Features**: Comments, sharing, following improvements
- **Mobile App**: Native mobile applications
- **Analytics**: User behavior tracking
- **Moderation**: Content moderation tools
- **Friend System**: Enhanced friend relationships
- **Feed Algorithm**: Smart feed prioritization
- **Real-time Updates**: WebSocket integration

### Technical Improvements

- **Performance**: Further optimization and caching
- **Accessibility**: Enhanced accessibility features
- **Testing**: Comprehensive test coverage
- **Documentation**: Enhanced developer documentation
- **Monitoring**: Error tracking and performance monitoring
- **Pagination**: Load more functionality for large datasets
- **Caching**: Advanced caching strategies

## 📚 Documentation Files

- `CODEBASE_INDEX.md` - This comprehensive codebase index
- `FOLLOWING_SYSTEM_README.md` - Detailed following system documentation
- `RECOMMENDATIONS_FEATURE.md` - Recommendations feature documentation
- `NYTIMES_API_INTEGRATION.md` - NYTimes Books API integration guide
- `SERIES_AND_BOOKS_TODO.md` - Implementation notes for series and books pages
- `README.md` - Basic project setup and structure

## 🎵 Media Types Supported

### Music

- **Sources**: Spotify, MusicBrainz, MusicAPI, Saavn
- **Features**: Playlist management, track previews, artist/album search
- **Collections**: Favorites, playlists, custom collections

### Movies

- **Sources**: TMDB
- **Features**: Movie search, ratings, reviews, trending content
- **Collections**: Watchlist, watched, custom collections

### TV Series

- **Sources**: TMDB
- **Features**: Series search, season/episode tracking, ratings
- **Collections**: Watchlist, watching, completed, dropped

### Books

- **Sources**: NYTimes Books API, Google Books API
- **Features**: Bestseller lists, book search, reading lists, trending books integration
- **Collections**: To read, reading, completed, dropped

## 🔄 Data Flow

### User Authentication Flow

1. User signs up/logs in via Firebase Auth
2. NextAuth.js handles session management
3. User data stored in Firestore
4. Real-time updates via Firebase listeners

### Content Discovery Flow

1. User searches for content via external APIs
2. Content added to user collections in Firestore
3. Reviews and ratings stored in Firestore
4. Following system filters content for personalized feed

### Social Interaction Flow

1. User follows other users (stored in Firestore)
2. Reviews from followed users appear in personalized feed
3. Users can like and interact with reviews
4. Real-time notifications for social activities

---

_This index provides a comprehensive overview of the Reliva codebase, including all recent features and enhancements. For detailed implementation specifics, refer to the individual files and their inline documentation._

# Recommendations Feature

## Overview

The Recommendations feature allows users to discover content from other users' collections. Users can browse through movies, books, and series that other users have added to their watchlists and collections.

## Features

### 1. Multi-Category Support
- **Movies**: Browse movies from other users' collections
- **Books**: Discover books recommended by other users
- **Series**: Explore TV series from other users' watchlists

### 2. User Interface
- **Category Tabs**: Switch between movies, books, and series
- **Source Filter**: Choose between "From Friends" and "From All Users"
- **Expandable User Cards**: Click to see detailed recommendations from each user
- **Add to Collection**: One-click functionality to add items to your own collections

### 3. Functionality
- **Real-time Data**: Fetches live data from Firestore
- **Toast Notifications**: User feedback for actions
- **Loading States**: Smooth loading animations
- **Error Handling**: Graceful error handling with user-friendly messages

## File Structure

```
app/
├── recommendations/
│   ├── page.tsx          # Main recommendations page
│   └── loading.tsx       # Loading component
├── api/
│   └── recommendations/
│       └── route.ts      # API endpoint for fetching recommendations
hooks/
├── use-recommendations.ts # Custom hook for recommendations logic
scripts/
└── add-test-data.js      # Script to add test data
```

## Components

### Recommendations Page (`app/recommendations/page.tsx`)
- Main page component with category tabs
- User cards with expandable content
- Add to collection functionality
- Toast notifications

### Loading Component (`app/recommendations/loading.tsx`)
- Skeleton loading animation
- Matches the layout of the main page

### API Endpoint (`app/api/recommendations/route.ts`)
- Fetches user data from Firestore
- Filters by category and source
- Returns formatted recommendations data

### Custom Hook (`hooks/use-recommendations.ts`)
- Manages recommendations state
- Handles adding items to collections
- Error handling and loading states

## Database Structure

### Users Collection
```
users/
├── {userId}/
│   ├── movies/           # User's movie collection
│   ├── books/            # User's book collection
│   └── series/           # User's series collection
```

### Item Structure
Each item in collections follows this structure:

**Movies:**
```typescript
{
  id: number,
  title: string,
  year: number,
  cover: string,
  status: string,
  rating: number,
  notes: string,
  collections: string[],
  overview: string,
  release_date: string
}
```

**Books:**
```typescript
{
  id: string,
  title: string,
  author: string,
  year: number,
  cover: string,
  status: string,
  notes: string,
  collections: string[],
  overview: string,
  publishedDate: string,
  pageCount: number
}
```

**Series:**
```typescript
{
  id: number,
  title: string,
  year: number,
  cover: string,
  status: string,
  rating: number,
  notes: string,
  collections: string[],
  overview: string,
  first_air_date: string,
  number_of_seasons: number,
  number_of_episodes: number
}
```

## Usage

### Adding to Sidebar
The recommendations link has been added to the sidebar navigation:

```typescript
const navigationItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/recommendations", label: "Recommendations", icon: TrendingUp },
  // ... other items
];
```

### Using the Recommendations Hook
```typescript
import { useRecommendations } from "@/hooks/use-recommendations";

const {
  recommendations,
  loading,
  error,
  addMovieToCollection,
  addBookToCollection,
  addSeriesToCollection,
} = useRecommendations();
```

### Adding Items to Collections
```typescript
// Add a movie to your collection
await addMovieToCollection(movie, "Watchlist");

// Add a book to your collection
await addBookToCollection(book, "To Read");

// Add a series to your collection
await addSeriesToCollection(series, "Watchlist");
```

## API Endpoints

### GET /api/recommendations
Fetches recommendations for a specific user and category.

**Query Parameters:**
- `userId` (required): Current user's ID
- `category` (optional): Category to filter by (movies, books, series)
- `source` (optional): Source filter (friends, all)

**Response:**
```json
{
  "recommendations": [
    {
      "user": {
        "uid": "string",
        "displayName": "string",
        "photoURL": "string",
        "email": "string"
      },
      "items": [...],
      "itemCount": number
    }
  ],
  "total": number
}
```

## Styling

The recommendations page uses:
- **Tailwind CSS** for styling
- **Shadcn/ui** components
- **Lucide React** icons
- **Dark/Light mode** support
- **Responsive design** for all screen sizes

## Future Enhancements

1. **Friend System**: Implement actual friend relationships
2. **Recommendation Algorithm**: Smart recommendations based on user preferences
3. **Social Features**: Like, comment, and share recommendations
4. **Filtering**: Filter by rating, year, genre, etc.
5. **Pagination**: Load more recommendations as needed
6. **Real-time Updates**: Live updates when users add new items

## Testing

To test the recommendations feature:

1. **Add Test Data**: Run the test data script
2. **Create Multiple Users**: Add different users with various collections
3. **Test Adding Items**: Verify items can be added to your own collections
4. **Test Categories**: Switch between movies, books, and series
5. **Test Error Handling**: Test with invalid data or network issues

## Performance Considerations

- **API Caching**: Recommendations are cached to reduce database calls
- **Lazy Loading**: Images are loaded on demand
- **Pagination**: Only load visible items initially
- **Optimized Queries**: Use efficient Firestore queries

## Security

- **User Authentication**: Only authenticated users can access recommendations
- **Data Privacy**: Users can only see public collections
- **Input Validation**: All user inputs are validated
- **Error Handling**: Sensitive information is not exposed in error messages 
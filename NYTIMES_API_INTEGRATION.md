# NYTimes Books API Integration

This document explains how to use the New York Times Books API integration in the Reliva application.

## Setup

### 1. Get an NYTimes API Key

1. Visit [NYTimes Developer Portal](https://developer.nytimes.com/)
2. Create an account and register your application
3. Subscribe to the "Books API" service
4. Copy your API key

### 2. Configure Environment Variables

Add your NYTimes API key to your environment variables:

```bash
# .env.local
NYTIMES_API_KEY=your_api_key_here
```

**Note**: For client-side access, you can also use `NEXT_PUBLIC_NYTIMES_API_KEY`, but it's recommended to use the server-side version for security.

## API Endpoints

### 1. Overview Endpoint

```
GET /api/nytimes/books?published_date=current
```

Returns all bestseller lists with their books.

**Parameters:**

- `published_date` (optional): Date in YYYY-MM-DD format or "current"

### 2. Specific List Endpoint

```
GET /api/nytimes/books/lists?list=hardcover-fiction&published_date=current
```

Returns books from a specific bestseller list.

**Parameters:**

- `list` (required): The list name (e.g., "hardcover-fiction", "paperback-nonfiction")
- `published_date` (optional): Date in YYYY-MM-DD format or "current"

## Available Lists

Popular NYTimes bestseller lists include:

- `hardcover-fiction` - Hardcover Fiction
- `hardcover-nonfiction` - Hardcover Nonfiction
- `paperback-fiction` - Paperback Fiction
- `paperback-nonfiction` - Paperback Nonfiction
- `advice-how-to-and-miscellaneous` - Advice & How-To
- `childrens-middle-grade-hardcover` - Children's Middle Grade
- `young-adult-hardcover` - Young Adult

## Usage Examples

### Using the Hook

```tsx
import { useNYTimesBooks } from "@/hooks/use-nytimes-books";

function MyComponent() {
  const { books, loading, error, fetchOverview, fetchList } = useNYTimesBooks();

  useEffect(() => {
    // Fetch all bestseller lists
    fetchOverview();

    // Or fetch a specific list
    // fetchList('hardcover-fiction');
  }, [fetchOverview]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {books.map((book) => (
        <div key={book.id}>
          <h3>{book.title}</h3>
          <p>by {book.author}</p>
        </div>
      ))}
    </div>
  );
}
```

### Using the Component

```tsx
import { NYTimesBestsellers } from "@/components/nytimes-bestsellers";

function BooksPage() {
  return (
    <div>
      <h1>Bestsellers</h1>

      {/* Show all bestseller lists */}
      <NYTimesBestsellers maxBooks={10} showListSelector={false} />

      {/* Show specific list with selector */}
      <NYTimesBestsellers
        maxBooks={5}
        showListSelector={true}
        defaultList="hardcover-fiction"
      />
    </div>
  );
}
```

## Data Structure

### Book Object

```typescript
interface NYTimesBook {
  id: string;
  title: string;
  author: string;
  year: number;
  cover: string;
  overview?: string;
  publishedDate?: string;
  pageCount?: number;
  listName?: string;
  rank?: number;
  isbn13?: string;
  isbn10?: string;
  weeks_on_list?: number;
  description?: string;
  book_image?: string;
  created_date?: string;
}
```

### List Object

```typescript
interface NYTimesList {
  list_id: number;
  list_name: string;
  list_name_encoded: string;
  display_name: string;
  updated: string;
  list_image?: string;
  list_image_width?: number;
  list_image_height?: number;
  books: NYTimesBook[];
}
```

## Error Handling

The integration includes comprehensive error handling:

1. **API Key Missing**: Clear error message when API key is not configured
2. **Network Errors**: Proper error messages for network issues
3. **Rate Limiting**: Respects NYTimes API rate limits
4. **Invalid Responses**: Handles malformed API responses gracefully

## Rate Limits

The NYTimes Books API has the following rate limits:

- 1,000 requests per day
- 5 requests per second

The integration includes proper error handling for rate limit exceeded errors.

## Security Considerations

1. **API Key Protection**: Use server-side environment variables when possible
2. **Request Validation**: All requests are validated before being sent
3. **Error Sanitization**: Error messages are sanitized to prevent information leakage

## Troubleshooting

### Common Issues

1. **"API key not configured" error**

   - Ensure `NYTIMES_API_KEY` is set in your environment variables
   - Restart your development server after adding the environment variable

2. **"Failed to fetch books data" error**

   - Check your internet connection
   - Verify your API key is valid
   - Check if you've exceeded rate limits

3. **No books returned**
   - The API might not have data for the requested date
   - Try using "current" as the published_date parameter

### Debug Mode

Enable debug logging by checking the browser console for detailed error messages and API request information.

## Contributing

When contributing to the NYTimes API integration:

1. Follow the existing code patterns
2. Add proper error handling
3. Include TypeScript types for new features
4. Update this documentation for any changes
5. Test with both valid and invalid API keys


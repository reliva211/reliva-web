// Books API service using OpenLibrary API (better covers and detailed information)
export interface BookSearchResult {
  id: string;
  title: string;
  author: string;
  year: number;
  cover: string;
  overview?: string;
  publishedDate?: string;
  pageCount?: number;
}
 
export interface BookDetails {
  id: string;
  title: string;
  author: string;
  year: number;
  cover: string;
  overview: string;
  publishedDate: string;
  pageCount: number;
  isbn: string[];
  subjects: string[];
  publishers: string[];
  languages: string[];
  numberOfPages: number;
  firstSentence: string;
  excerpt: string;
}

// Search books using OpenLibrary API
export async function searchBooks(query: string): Promise<BookSearchResult[]> {
  try {
    console.log("Searching books with query:", query);
    
    // OpenLibrary search API
    const response = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20&fields=key,title,author_name,first_publish_year,cover_i,edition_count,has_fulltext,ebook_access,ebook_count,edition_key,first_sentence,subject,isbn,language,number_of_pages_median,publisher,first_sentence,excerpts`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("OpenLibrary search response:", data);

    if (!data.docs || data.docs.length === 0) {
      return [];
    }

    // Transform OpenLibrary data to our format
    const results = data.docs.map((book: any) => {
      const coverId = book.cover_i;
      const coverUrl = coverId 
        ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
        : '/placeholder-book.jpg';

      return {
        id: book.key || `book-${Math.random()}`,
        title: book.title || 'Unknown Title',
        author: book.author_name ? book.author_name[0] : 'Unknown Author',
        year: book.first_publish_year || new Date().getFullYear(),
        cover: coverUrl,
        overview: book.first_sentence ? book.first_sentence[0] : '',
        publishedDate: book.first_publish_year ? book.first_publish_year.toString() : '',
        pageCount: book.number_of_pages_median || 0,
      };
    });

    console.log("Transformed search results:", results);
    return results;
  } catch (error) {
    console.error("Error searching books:", error);
    throw error;
  }
}

// Get detailed book information using OpenLibrary API
export async function getBookDetails(bookId: string): Promise<BookDetails | null> {
  try {
    console.log("Fetching book details for ID:", bookId);
    
    // Handle dummy IDs
    if (bookId.startsWith('book-')) {
      return null;
    }

    // OpenLibrary works API
    const response = await fetch(
      `https://openlibrary.org${bookId}.json`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("OpenLibrary book details response:", data);

    // Get cover image
    let coverUrl = '/placeholder-book.jpg';
    if (data.covers && data.covers.length > 0) {
      coverUrl = `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg`;
    }

    // Get author information
    let author = 'Unknown Author';
    if (data.authors && data.authors.length > 0) {
      try {
        const authorResponse = await fetch(
          `https://openlibrary.org${data.authors[0].author.key}.json`
        );
        if (authorResponse.ok) {
          const authorData = await authorResponse.json();
          author = authorData.name || 'Unknown Author';
        }
      } catch (error) {
        console.error("Error fetching author details:", error);
      }
    }

    // Get additional details
    const description = data.description 
      ? (typeof data.description === 'string' 
          ? data.description 
          : data.description.value || '')
      : '';

    const excerpt = data.excerpts && data.excerpts.length > 0
      ? data.excerpts[0].excerpt
      : '';

    const firstSentence = data.first_sentence && data.first_sentence.length > 0
      ? data.first_sentence[0]
      : '';

    return {
      id: bookId,
      title: data.title || 'Unknown Title',
      author: author,
      year: data.first_publish_date ? parseInt(data.first_publish_date.split('-')[0]) : new Date().getFullYear(),
      cover: coverUrl,
      overview: description || excerpt || firstSentence || 'No description available.',
      publishedDate: data.first_publish_date || '',
      pageCount: data.number_of_pages_median || data.number_of_pages || 0,
      isbn: data.isbn_13 || data.isbn_10 || [],
      subjects: data.subjects || [],
      publishers: data.publishers || [],
      languages: data.languages ? data.languages.map((lang: any) => lang.key) : [],
      numberOfPages: data.number_of_pages_median || data.number_of_pages || 0,
      firstSentence: firstSentence,
      excerpt: excerpt,
    };
  } catch (error) {
    console.error("Error fetching book details:", error);
    throw error;
  }
}

// Get trending/popular books using OpenLibrary API
export async function getTrendingBooks(): Promise<BookSearchResult[]> {
  try {
    console.log("Fetching trending books");
    
    // Use popular search queries to get trending books
    const popularQueries = [
      'harry potter',
      'lord of the rings',
      'game of thrones',
      'the hobbit',
      '1984',
      'pride and prejudice',
      'to kill a mockingbird',
      'the great gatsby',
      'brave new world',
      'animal farm'
    ];

    // Randomly select a few queries to simulate trending
    const selectedQueries = popularQueries
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);

    const allResults: BookSearchResult[] = [];

    for (const query of selectedQueries) {
      try {
        const results = await searchBooks(query);
        // Take first 2 results from each query
        allResults.push(...results.slice(0, 2));
      } catch (error) {
        console.error(`Error fetching books for query "${query}":`, error);
      }
    }

    // Remove duplicates and limit results
    const uniqueResults = allResults.filter((book, index, self) => 
      index === self.findIndex(b => b.id === book.id)
    );

    console.log("Trending books fetched:", uniqueResults.slice(0, 10));
    return uniqueResults.slice(0, 10);
  } catch (error) {
    console.error("Error fetching trending books:", error);
    throw error;
  }
}

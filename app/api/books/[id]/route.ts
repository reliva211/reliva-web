import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // First, try to fetch directly from Google Books API
    let response = await fetch(
      `https://www.googleapis.com/books/v1/volumes/${id}`
    );

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    // If direct fetch fails, the ID might be from NYTimes
    // We need to decode the ID to get book information
    try {
      const decodedId = decodeURIComponent(id);
      const bookInfo = JSON.parse(decodedId);

      // Search Google Books using title and author
      const searchQuery = `${bookInfo.title} ${bookInfo.author}`;
      const searchResponse = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
          searchQuery
        )}&maxResults=1`
      );

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();

        if (searchData.items && searchData.items.length > 0) {
          // Return the first result
          return NextResponse.json(searchData.items[0]);
        }
      }

      // If no Google Books result found, create a fallback response
      const fallbackBook = {
        id: id,
        volumeInfo: {
          title: bookInfo.title || "Unknown Title",
          authors: [bookInfo.author || "Unknown Author"],
          description: bookInfo.overview || "No description available",
          imageLinks: {
            thumbnail: bookInfo.cover || "/placeholder.svg",
            smallThumbnail: bookInfo.cover || "/placeholder.svg",
          },
          publishedDate: bookInfo.publishedDate || "",
          pageCount: bookInfo.pageCount || 0,
          categories: [],
          averageRating: 0,
          ratingsCount: 0,
          publisher: "Unknown",
          language: "en",
          previewLink: "",
          infoLink: "",
        },
      };

      return NextResponse.json(fallbackBook);
    } catch (parseError) {
      console.error("Error parsing book ID:", parseError);
      return NextResponse.json(
        { error: "Invalid book ID format" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error fetching book details:", error);
    return NextResponse.json(
      { error: "Failed to fetch book details" },
      { status: 500 }
    );
  }
}

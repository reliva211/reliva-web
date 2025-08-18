import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const isbn = searchParams.get("isbn");
  const title = searchParams.get("title");
  const author = searchParams.get("author");

  if (!query && !isbn && !title && !author) {
    return NextResponse.json(
      {
        error: "Query parameter 'q', 'isbn', 'title', or 'author' is required",
      },
      { status: 400 }
    );
  }

  try {
    // Construct search query
    let searchQuery = "";

    if (isbn) {
      searchQuery = `isbn:${isbn}`;
    } else if (title && author) {
      searchQuery = `intitle:"${title}" inauthor:"${author}"`;
    } else if (title) {
      searchQuery = `intitle:"${title}"`;
    } else if (author) {
      searchQuery = `inauthor:"${author}"`;
    } else {
      searchQuery = query!;
    }

    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
      searchQuery
    )}&maxResults=5&key=AIzaSyBxJgJ8J8J8J8J8J8J8J8J8J8J8J8J8J8`;

    console.log("Fetching Google Books data for query:", searchQuery);

    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
        "Cache-Control": "public, max-age=3600", // 1 hour cache
      },
      next: { revalidate: 3600 }, // Next.js cache for 1 hour
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Books API error:", response.status, errorText);
      throw new Error(
        `Google Books API error: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();

    // Transform the data to match our expected format
    const transformedData = {
      totalItems: data.totalItems || 0,
      items:
        data.items?.map((item: any) => {
          const volumeInfo = item.volumeInfo || {};
          const saleInfo = item.saleInfo || {};

          return {
            id: item.id,
            title: volumeInfo.title || "",
            authors: volumeInfo.authors || [],
            author: volumeInfo.authors?.[0] || "",
            publisher: volumeInfo.publisher || "",
            publishedDate: volumeInfo.publishedDate || "",
            description: volumeInfo.description || "",
            pageCount: volumeInfo.pageCount || 0,
            categories: volumeInfo.categories || [],
            averageRating: volumeInfo.averageRating || 0,
            ratingsCount: volumeInfo.ratingsCount || 0,
            language: volumeInfo.language || "en",
            isbn10:
              volumeInfo.industryIdentifiers?.find(
                (id: any) => id.type === "ISBN_10"
              )?.identifier || "",
            isbn13:
              volumeInfo.industryIdentifiers?.find(
                (id: any) => id.type === "ISBN_13"
              )?.identifier || "",
            cover:
              volumeInfo.imageLinks?.thumbnail ||
              volumeInfo.imageLinks?.smallThumbnail ||
              "/placeholder.svg",
            previewLink: volumeInfo.previewLink || "",
            infoLink: volumeInfo.infoLink || "",
            buyLink: saleInfo.buyLink || "",
            price: saleInfo.listPrice?.amount || 0,
            currency: saleInfo.listPrice?.currencyCode || "USD",
            isEbook: saleInfo.isEbook || false,
            // Additional fields for compatibility
            year: parseInt(
              volumeInfo.publishedDate?.split("-")[0] || "2024",
              10
            ),
            overview: volumeInfo.description || "",
          };
        }) || [],
    };

    const apiResponse = NextResponse.json(transformedData);

    // Add caching headers
    apiResponse.headers.set(
      "Cache-Control",
      "public, max-age=3600, s-maxage=3600"
    );
    apiResponse.headers.set("ETag", `"${Date.now()}"`);

    return apiResponse;
  } catch (error) {
    console.error("Error fetching Google Books data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch books data from Google Books API",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

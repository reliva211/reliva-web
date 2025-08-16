import { NextRequest, NextResponse } from "next/server";

const NYTIMES_API_KEY =
  process.env.NYTIMES_API_KEY || process.env.NEXT_PUBLIC_NYTIMES_API_KEY || "";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const listName = searchParams.get("list");
  const publishedDate = searchParams.get("published_date") || "current";

  if (!NYTIMES_API_KEY) {
    console.error("NYTimes API key not configured");
    return NextResponse.json(
      {
        error:
          "NYTimes API key not configured. Please add NYTIMES_API_KEY to your environment variables.",
      },
      { status: 500 }
    );
  }

  if (!listName) {
    return NextResponse.json(
      {
        error: "List name parameter is required. Use 'list' query parameter.",
      },
      { status: 400 }
    );
  }

  try {
    // Construct the API URL for specific list
    let apiUrl = `https://api.nytimes.com/svc/books/v3/lists/${encodeURIComponent(
      listName
    )}.json?api-key=${NYTIMES_API_KEY}`;

    // Add published_date parameter if specified
    if (publishedDate !== "current") {
      apiUrl += `&published_date=${publishedDate}`;
    }

    console.log("Fetching NYTimes list data from:", apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("NYTimes API error:", response.status, errorText);
      throw new Error(`NYTimes API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Transform the data to match our expected format
    const transformedData = {
      status: data.status,
      copyright: data.copyright,
      num_results: data.num_results,
      last_modified: data.last_modified,
      results: {
        ...data.results,
        books: data.results?.books?.map((book: any) => ({
          ...book,
          // Ensure we have a unique ID
          id:
            book.isbns?.[0]?.isbn13 ||
            book.isbns?.[0]?.isbn10 ||
            `nyt-${book.rank}-${data.results?.list_id}`,
          // Add computed fields for consistency
          year: parseInt(book.created_date?.split("-")[0] || "2024", 10),
          cover: book.book_image || "/placeholder.svg",
          overview: book.description || "",
          publishedDate: book.created_date || "",
          pageCount: book.weeks_on_list || 0,
          listName: data.results?.list_name || listName,
        })),
      },
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("Error fetching NYTimes list data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch list data from NYTimes API",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


// Test script to check JioSaavn API response for artist ID 610240
async function testArtistAPI() {
  try {
    console.log("Testing JioSaavn API for artist ID 610240...");

    const response = await fetch(
      "https://jiosavan-api-with-playlist.vercel.app/api/artists?id=610240"
    );
    const data = await response.json();

    console.log("API Response:", JSON.stringify(data, null, 2));

    if (data.data) {
      console.log("Artist name:", data.data.name);
      console.log("Top songs count:", data.data.topSongs?.length || 0);
      console.log("Top albums count:", data.data.topAlbums?.length || 0);
      console.log("Bio:", data.data.bio);
    } else {
      console.log("No data found in response");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

testArtistAPI();

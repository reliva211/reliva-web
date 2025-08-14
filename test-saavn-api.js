// Test script to verify Saavn API transformation
const fetch = require("node-fetch");

async function testSaavnAPI() {
  try {
    console.log("Testing Saavn API transformation...");

    // Test song search
    const songResponse = await fetch(
      "http://localhost:3000/api/saavn/search?q=shape%20of%20you&type=song&limit=1"
    );
    const songData = await songResponse.json();

    console.log("\n=== Song Search Results ===");
    if (songData.data?.results?.[0]) {
      const song = songData.data.results[0];
      console.log("Song Name:", song.name);
      console.log("Primary Artists (string):", song.primaryArtists);
      console.log(
        "Artists (array):",
        song.artists?.primary?.map((a) => a.name).join(", ")
      );
      console.log(
        "Has both structures:",
        !!(song.primaryArtists && song.artists?.primary)
      );
    }

    // Test album search
    const albumResponse = await fetch(
      "http://localhost:3000/api/saavn/search?q=divide&type=album&limit=1"
    );
    const albumData = await albumResponse.json();

    console.log("\n=== Album Search Results ===");
    if (albumData.data?.results?.[0]) {
      const album = albumData.data.results[0];
      console.log("Album Name:", album.name);
      console.log("Primary Artists (string):", album.primaryArtists);
      console.log(
        "Artists (array):",
        album.artists?.primary?.map((a) => a.name).join(", ")
      );
      console.log(
        "Has both structures:",
        !!(album.primaryArtists && album.artists?.primary)
      );
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testSaavnAPI();


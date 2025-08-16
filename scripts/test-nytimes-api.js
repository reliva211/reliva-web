const fetch = require("node-fetch");

// Test NYTimes API integration
async function testNYTimesAPI() {
  console.log("🧪 Testing NYTimes Books API Integration...\n");

  const baseUrl = "http://localhost:3000";

  // Test 1: Overview endpoint
  console.log("1️⃣ Testing overview endpoint...");
  try {
    const response = await fetch(
      `${baseUrl}/api/nytimes/books?published_date=current`
    );
    const data = await response.json();

    if (response.ok) {
      console.log("✅ Overview endpoint working");
      console.log(`   Status: ${data.status}`);
      console.log(`   Results: ${data.num_results || "N/A"}`);
      console.log(`   Lists: ${data.results?.lists?.length || 0} lists found`);
    } else {
      console.log("❌ Overview endpoint failed");
      console.log(`   Error: ${data.error || "Unknown error"}`);
    }
  } catch (error) {
    console.log("❌ Overview endpoint error:", error.message);
  }

  console.log("\n2️⃣ Testing specific list endpoint...");
  try {
    const response = await fetch(
      `${baseUrl}/api/nytimes/books/lists?list=hardcover-fiction&published_date=current`
    );
    const data = await response.json();

    if (response.ok) {
      console.log("✅ Specific list endpoint working");
      console.log(`   Status: ${data.status}`);
      console.log(`   List: ${data.results?.list_name || "N/A"}`);
      console.log(`   Books: ${data.results?.books?.length || 0} books found`);
    } else {
      console.log("❌ Specific list endpoint failed");
      console.log(`   Error: ${data.error || "Unknown error"}`);
    }
  } catch (error) {
    console.log("❌ Specific list endpoint error:", error.message);
  }

  console.log("\n3️⃣ Testing error handling (invalid list)...");
  try {
    const response = await fetch(
      `${baseUrl}/api/nytimes/books/lists?list=invalid-list&published_date=current`
    );
    const data = await response.json();

    if (response.ok) {
      console.log("⚠️  Invalid list returned data (unexpected)");
    } else {
      console.log("✅ Error handling working for invalid list");
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${data.error || "Unknown error"}`);
    }
  } catch (error) {
    console.log("❌ Error handling test failed:", error.message);
  }

  console.log("\n4️⃣ Testing missing API key scenario...");
  try {
    // This would require temporarily removing the API key from env
    console.log(
      "ℹ️  To test missing API key, temporarily remove NYTIMES_API_KEY from .env.local"
    );
  } catch (error) {
    console.log("❌ Missing API key test error:", error.message);
  }

  console.log("\n📋 Summary:");
  console.log(
    "   - Make sure NYTIMES_API_KEY is set in your environment variables"
  );
  console.log(
    "   - The API has rate limits: 1,000 requests per day, 5 per second"
  );
  console.log("   - Check the browser console for detailed error messages");
  console.log("   - Visit /books page to see the integration in action");
}

// Run the test
testNYTimesAPI().catch(console.error);


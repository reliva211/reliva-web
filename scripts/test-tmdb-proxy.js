#!/usr/bin/env node

/**
 * Test script to verify TMDB proxy functionality
 * Run with: node scripts/test-tmdb-proxy.js
 */

const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

async function testTMDBProxy() {
  console.log('🧪 Testing TMDB Proxy Implementation...\n');

  const tests = [
    {
      name: 'Movie Search',
      endpoint: '/api/tmdb/proxy/search/movie?query=inception&page=1',
      expectKeys: ['results']
    },
    {
      name: 'TV Search', 
      endpoint: '/api/tmdb/proxy/search/tv?query=breaking%20bad&page=1',
      expectKeys: ['results']
    },
    {
      name: 'Movie Details',
      endpoint: '/api/tmdb/proxy/movie/550?append_to_response=videos,credits',
      expectKeys: ['id', 'title', 'overview']
    },
    {
      name: 'Trending Movies',
      endpoint: '/api/tmdb/proxy/trending/movie/week',
      expectKeys: ['results']
    },
    {
      name: 'Configuration',
      endpoint: '/api/tmdb/proxy/configuration',
      expectKeys: ['images']
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      const response = await fetch(`${baseUrl}${test.endpoint}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Check if expected keys exist
      const missingKeys = test.expectKeys.filter(key => !(key in data));
      if (missingKeys.length > 0) {
        throw new Error(`Missing expected keys: ${missingKeys.join(', ')}`);
      }

      console.log(`✅ ${test.name} - PASSED`);
      passed++;
      
    } catch (error) {
      console.log(`❌ ${test.name} - FAILED: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! TMDB proxy is working correctly.');
    console.log('\n💡 Benefits for users:');
    console.log('   • Jio users can now access TMDB data');
    console.log('   • API key is kept secure server-side'); 
    console.log('   • Improved caching reduces API calls');
    console.log('   • No CORS issues');
  } else {
    console.log('\n⚠️  Some tests failed. Check your TMDB_API_KEY environment variable.');
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  testTMDBProxy().catch(console.error);
}

module.exports = { testTMDBProxy };

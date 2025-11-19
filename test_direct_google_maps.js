/**
 * 🗺️ DIRECT GOOGLE MAPS TEST
 * Test trực tiếp Google Maps API với key mới
 * Key: AIzaSyBqA9agThQfCJtE54OzaufTKetrswFWOIk
 */

const axios = require("axios");

console.log("🗺️ DIRECT GOOGLE MAPS API TEST");
console.log("Key: AIzaSyBqA9agThQfCJtE54OzaufTKetrswFWOIk");
console.log("=".repeat(60));

(async () => {
  const GOOGLE_API_KEY = "AIzaSyBqA9agThQfCJtE54OzaufTKetrswFWOIk";

  const testAddresses = [
    "Saigon",
    "Ho Chi Minh City",
    "908 Phạm Văn Đồng, Hiệp Bình Chánh",
    "Vincom Center, 72 Lê Thánh Tôn, Quận 1",
    "Chợ Bến Thành, Quận 1",
  ];

  console.log("\n🔍 TESTING GOOGLE MAPS API DIRECTLY:");
  console.log("─".repeat(50));

  for (const [index, address] of testAddresses.entries()) {
    console.log(`\n${index + 1}. Testing: "${address}"`);

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address + ", Vietnam")}&key=${GOOGLE_API_KEY}&region=vn`;

      console.log(`   🌐 URL: ${url.substring(0, 100)}...`);

      const startTime = Date.now();
      const response = await axios.get(url, { timeout: 10000 });
      const duration = Date.now() - startTime;

      console.log(`   ⏱️ Response time: ${duration}ms`);
      console.log(`   📊 Status: ${response.data.status}`);

      if (response.data.status === "OK" && response.data.results.length > 0) {
        const result = response.data.results[0];

        console.log(`   ✅ SUCCESS`);
        console.log(
          `   📍 Coordinates: ${result.geometry.location.lat}, ${result.geometry.location.lng}`
        );
        console.log(`   🏷️ Type: ${result.geometry.location_type}`);
        console.log(`   📝 Address: ${result.formatted_address}`);
        console.log(`   🏁 Types: ${result.types.slice(0, 3).join(", ")}`);
      } else if (response.data.status === "REQUEST_DENIED") {
        console.log(`   ❌ REQUEST DENIED`);
        console.log(
          `   💡 Error: ${response.data.error_message || "API key không có quyền"}`
        );
        console.log(
          `   🔧 Solution: Enable Geocoding API + Setup billing trong Google Cloud Console`
        );
      } else if (response.data.status === "OVER_QUERY_LIMIT") {
        console.log(`   ❌ OVER QUOTA`);
        console.log(`   💡 API đã vượt quota limit`);
      } else if (response.data.status === "ZERO_RESULTS") {
        console.log(`   ⚠️ NO RESULTS`);
        console.log(`   💡 Google Maps không tìm thấy địa chỉ này`);
      } else {
        console.log(`   ❌ ERROR: ${response.data.status}`);
        if (response.data.error_message) {
          console.log(`   💡 Message: ${response.data.error_message}`);
        }
      }
    } catch (error) {
      console.log(`   💥 NETWORK ERROR: ${error.message}`);

      if (error.response) {
        console.log(`   📊 HTTP Status: ${error.response.status}`);
        if (error.response.status === 403) {
          console.log(
            `   💡 403 Forbidden - API key issues or billing not setup`
          );
        }
      }
    }

    // Delay between requests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("\n" + "=".repeat(60));
  console.log("🔧 TROUBLESHOOTING GUIDE");
  console.log("=".repeat(60));

  console.log('\n❌ If you see "REQUEST_DENIED":');
  console.log("1. 🌐 Go to: https://console.cloud.google.com/");
  console.log('2. 📂 Navigate to "APIs & Services" → "Library"');
  console.log('3. 🔍 Search for "Geocoding API"');
  console.log('4. ✅ Click "ENABLE"');
  console.log("5. 💳 Setup billing account (first 40,000 requests are FREE)");

  console.log('\n❌ If you see "OVER_QUERY_LIMIT":');
  console.log("1. ⏰ Wait for quota reset");
  console.log("2. 💰 Increase quota limits in Google Cloud Console");
  console.log("3. 📊 Monitor usage in console");

  console.log('\n✅ If you see "OK" responses:');
  console.log("1. 🎉 API key is working correctly!");
  console.log("2. 🚀 Ready to use in production");
  console.log("3. 📊 Monitor costs and usage");

  console.log("\n💡 NEXT STEPS:");
  console.log("1. 🔧 Fix any authorization issues");
  console.log("2. 🧪 Test with geocodingValidator.js");
  console.log("3. 🚀 Deploy simplified Google Maps only system");
})().catch(console.error);

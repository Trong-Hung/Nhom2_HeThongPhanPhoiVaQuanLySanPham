/**
 * 🗺️ GOOGLE MAPS API KEY TEST
 * Test key mới: AIzaSyBqA9agThQfCJtE54OzaufTKetrswFWOIk
 */

const { validateAndImproveGeocode } = require("./src/util/geocodingValidator");

console.log("🗺️ GOOGLE MAPS API KEY TEST");
console.log("Key: AIzaSyBqA9agThQfCJtE54OzaufTKetrswFWOIk");
console.log("=".repeat(60));

(async () => {
  const testAddresses = [
    "908 Phạm Văn Đồng, Hiệp Bình Chánh",
    "Vincom Center, 72 Lê Thánh Tôn, Quận 1",
    "123 Lê Lợi, Quận 1",
    "Đại học Bách Khoa, 268 Lý Thường Kiệt, Quận 10",
    "Sân bay Tân Sơn Nhất",
  ];

  let vietnamDBHits = 0;
  let mapboxHits = 0;
  let googleHits = 0;
  let totalSuccess = 0;
  let totalTests = testAddresses.length;

  console.log("\n📍 TESTING WITH NEW GOOGLE MAPS KEY:");
  console.log("─".repeat(50));

  for (const [index, address] of testAddresses.entries()) {
    console.log(`\n${index + 1}. Testing: ${address}`);

    try {
      const result = await validateAndImproveGeocode(address, "hcm");

      if (result.success) {
        totalSuccess++;
        const coords = result.result;

        if (coords.source === "vietnam_address_db") {
          vietnamDBHits++;
          console.log(
            `   ✅ 🇻🇳 VIETNAM DB (${(coords.confidence * 100).toFixed(0)}%)`
          );
        } else if (coords.source === "mapbox") {
          mapboxHits++;
          console.log(
            `   ✅ 🥇 MAPBOX (${(coords.confidence * 100).toFixed(0)}%)`
          );
        } else if (coords.source === "google_maps") {
          googleHits++;
          console.log(
            `   ✅ 🗺️ GOOGLE MAPS (${(coords.confidence * 100).toFixed(0)}%)`
          );
        }

        console.log(
          `   📍 ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`
        );
        console.log(`   🏷️ ${coords.displayName || "No display name"}`);
      } else {
        console.log(`   ❌ FAILED: ${result.error}`);
      }

      // Delay để không spam API
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.log(`   💥 ERROR: ${error.message}`);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 GOOGLE MAPS API KEY TEST RESULTS");
  console.log("=".repeat(60));

  const successRate = (totalSuccess / totalTests) * 100;
  console.log(
    `\n🎯 Overall Success: ${successRate.toFixed(1)}% (${totalSuccess}/${totalTests})`
  );

  console.log(`\n📈 Service Performance:`);
  console.log(
    `   🇻🇳 Vietnam DB: ${vietnamDBHits} hits (${((vietnamDBHits / Math.max(totalSuccess, 1)) * 100).toFixed(1)}%)`
  );
  console.log(
    `   🥇 Mapbox: ${mapboxHits} hits (${((mapboxHits / Math.max(totalSuccess, 1)) * 100).toFixed(1)}%)`
  );
  console.log(
    `   🗺️ Google Maps: ${googleHits} hits (${((googleHits / Math.max(totalSuccess, 1)) * 100).toFixed(1)}%)`
  );

  console.log(`\n💰 Cost Analysis:`);
  console.log(`   🆓 FREE: Vietnam DB (${vietnamDBHits} requests)`);
  console.log(
    `   💳 FREEMIUM: Mapbox (${mapboxHits} requests - 100K/month free)`
  );
  console.log(
    `   💸 PAID: Google Maps (${googleHits} requests - $5/1K after 40K free)`
  );

  console.log(`\n🔑 API Key Status:`);
  if (googleHits > 0) {
    console.log("   ✅ Google Maps API key WORKING!");
    console.log("   🎉 New key has proper permissions");
    console.log("   💡 Can be used as reliable backup service");
  } else if (
    totalSuccess === totalTests &&
    vietnamDBHits + mapboxHits === totalSuccess
  ) {
    console.log(
      "   ⚠️ Google Maps not needed - Mapbox + Vietnam DB handled all requests"
    );
    console.log("   💡 Keep Google as backup for edge cases");
  } else {
    console.log("   ❌ Google Maps API key có vấn đề");
    console.log("   💡 Check console logs for detailed error messages");
  }

  console.log(`\n🏆 RECOMMENDATION:`);
  if (successRate === 100 && vietnamDBHits + mapboxHits === totalSuccess) {
    console.log("   📍 Current setup (Vietnam DB + Mapbox) is sufficient");
    console.log("   🛡️ Keep Google Maps as backup for robustness");
  } else if (googleHits > 0) {
    console.log("   🎯 Add Google Maps as 3rd tier fallback");
    console.log("   📈 This will improve overall success rate");
  } else {
    console.log("   🔧 Focus on Mapbox + Vietnam DB optimization");
    console.log("   ⚡ Google Maps backup when needed");
  }
})().catch(console.error);

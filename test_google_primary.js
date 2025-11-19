/**
 * 🥇 GOOGLE MAPS PRIMARY TEST
 * Test với Google Maps là primary geocoding service
 */

const { validateAndImproveGeocode } = require("./src/util/geocodingValidator");

console.log("🥇 GOOGLE MAPS PRIMARY TEST");
console.log("Google Maps → Mapbox → Vietnam DB (fallback order)");
console.log("Key: AIzaSyBqA9agThQfCJtE54OzaufTKetrswFWOIk");
console.log("=".repeat(60));

(async () => {
  const testAddresses = [
    "908 Phạm Văn Đồng, Hiệp Bình Chánh",
    "Vincom Center, 72 Lê Thánh Tôn, Quận 1",
    "123 Lê Lợi, Quận 1",
    "Đại học Bách Khoa, 268 Lý Thường Kiệt, Quận 10",
    "Sân bay Tân Sơn Nhất",
    "Chợ Bến Thành, Quận 1",
    "456 Nguyễn Trãi, Quận 5",
    "Bitexco Financial Tower, Quận 1",
  ];

  let vietnamDBHits = 0;
  let mapboxHits = 0;
  let googleHits = 0;
  let totalSuccess = 0;
  let totalTests = testAddresses.length;

  console.log("\n📍 TESTING WITH GOOGLE MAPS AS PRIMARY:");
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
            `   ✅ 🇻🇳 VIETNAM DB (${(coords.confidence * 100).toFixed(0)}%) - Local database hit`
          );
        } else if (coords.source === "google_maps") {
          googleHits++;
          console.log(
            `   ✅ 🥇 GOOGLE MAPS (${(coords.confidence * 100).toFixed(0)}%) - Primary service`
          );
        } else if (coords.source === "mapbox") {
          mapboxHits++;
          console.log(
            `   ✅ 🗺️ MAPBOX (${(coords.confidence * 100).toFixed(0)}%) - Backup service`
          );
        }

        console.log(
          `   📍 ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`
        );
        console.log(
          `   🏷️ ${coords.displayName?.substring(0, 60) || "No display name"}...`
        );
      } else {
        console.log(`   ❌ FAILED: ${result.error}`);
      }

      // Delay để không spam API
      await new Promise((resolve) => setTimeout(resolve, 800));
    } catch (error) {
      console.log(`   💥 ERROR: ${error.message}`);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 GOOGLE MAPS PRIMARY TEST RESULTS");
  console.log("=".repeat(60));

  const successRate = (totalSuccess / totalTests) * 100;
  console.log(
    `\n🎯 Overall Success: ${successRate.toFixed(1)}% (${totalSuccess}/${totalTests})`
  );

  console.log(`\n📈 Service Usage (New Priority Order):`);
  console.log(
    `   🇻🇳 Vietnam DB: ${vietnamDBHits} hits (${((vietnamDBHits / Math.max(totalSuccess, 1)) * 100).toFixed(1)}%) - Local cache`
  );
  console.log(
    `   🥇 Google Maps: ${googleHits} hits (${((googleHits / Math.max(totalSuccess, 1)) * 100).toFixed(1)}%) - PRIMARY`
  );
  console.log(
    `   🗺️ Mapbox: ${mapboxHits} hits (${((mapboxHits / Math.max(totalSuccess, 1)) * 100).toFixed(1)}%) - Backup`
  );

  console.log(`\n💰 Cost Impact Analysis:`);
  console.log(`   🆓 FREE: Vietnam DB (${vietnamDBHits} requests)`);
  console.log(`   💸 PAID: Google Maps (${googleHits} requests)`);
  console.log(`      └─ Free tier: First 40,000 requests/month`);
  console.log(`      └─ Cost: $5 per 1,000 requests after free tier`);
  console.log(
    `   💳 FREEMIUM: Mapbox (${mapboxHits} requests - 100K/month free)`
  );

  const estimatedMonthlyCost = Math.max(0, (googleHits * 30 - 40000) * 0.005);
  console.log(
    `   💵 Estimated monthly cost: $${estimatedMonthlyCost.toFixed(2)} (assuming ${googleHits} requests/day)`
  );

  console.log(`\n🔄 Priority Flow Validation:`);
  if (vietnamDBHits > 0) {
    console.log(
      `   ✅ Vietnam DB catching known addresses (${vietnamDBHits} hits)`
    );
  }
  if (googleHits > 0) {
    console.log(
      `   ✅ Google Maps working as PRIMARY service (${googleHits} hits)`
    );
  }
  if (mapboxHits > 0) {
    console.log(
      `   ✅ Mapbox serving as backup when needed (${mapboxHits} hits)`
    );
  }

  console.log(`\n🏆 PERFORMANCE ASSESSMENT:`);
  if (successRate === 100) {
    console.log("   🎯 EXCELLENT: 100% success rate achieved");
  } else if (successRate >= 90) {
    console.log("   🥈 VERY GOOD: High success rate");
  } else {
    console.log("   ⚠️ NEEDS IMPROVEMENT: Success rate below 90%");
  }

  if (googleHits >= vietnamDBHits + mapboxHits) {
    console.log(
      "   📊 Google Maps is handling majority of requests (as intended)"
    );
  } else {
    console.log("   📊 Fallback services handling most requests");
  }

  console.log(`\n🚀 RECOMMENDATION:`);
  if (googleHits > 0 && successRate === 100) {
    console.log("   ✅ Google Maps Primary setup is working perfectly!");
    console.log("   💡 Monitor costs as usage scales");
    console.log("   🛡️ Mapbox provides excellent backup coverage");
  } else if (successRate === 100) {
    console.log(
      "   ⚠️ Google Maps not being used much - check API key or address types"
    );
    console.log("   💡 Current fallback services are sufficient");
  } else {
    console.log("   🔧 Need to investigate failed geocoding requests");
  }
})().catch(console.error);

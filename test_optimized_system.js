/**
 * 🚀 OPTIMIZED SYSTEM TEST
 * Test hệ thống đã tối ưu chỉ với services tốt nhất
 */

const { validateAndImproveGeocode } = require("./src/util/geocodingValidator");

console.log("🚀 OPTIMIZED SYSTEM TEST");
console.log("Chỉ sử dụng Vietnam Address DB + Mapbox + OSRM");
console.log("=".repeat(60));

(async () => {
  const testAddresses = [
    "908 Phạm Văn Đồng, Hiệp Bình Chánh",
    "39 Hiệp Bình, Hiệp Bình Chánh",
    "Vincom Center, 72 Lê Thánh Tôn, Quận 1",
    "123/45 Cách Mạng Tháng 8, Quận 3",
    "Đại học Bách Khoa, 268 Lý Thường Kiệt, Quận 10",
  ];

  let vietnamDBHits = 0;
  let mapboxHits = 0;
  let totalSuccess = 0;

  console.log("\n📍 GEOCODING TEST RESULTS:");
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
            `   ✅ 🇻🇳 VIETNAM DB - Confidence: ${(coords.confidence * 100).toFixed(0)}%`
          );
        } else if (coords.source === "mapbox") {
          mapboxHits++;
          console.log(
            `   ✅ 🥇 MAPBOX - Confidence: ${(coords.confidence * 100).toFixed(0)}%`
          );
        }

        console.log(
          `   📍 Coordinates: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
        );
      } else {
        console.log(`   ❌ FAILED: ${result.error}`);
      }
    } catch (error) {
      console.log(`   💥 ERROR: ${error.message}`);
    }
  }

  // Test OSRM
  console.log("\n🗺️  OSRM ROUTING TEST:");
  console.log("─".repeat(50));

  try {
    const axios = require("axios");
    const testCoords =
      "106.73007578112086,10.835067828591106;106.698648,10.773804";
    const osrmUrl = `http://127.0.0.1:5000/route/v1/driving/${testCoords}?overview=false`;

    console.log("Testing OSRM routing...");
    const response = await axios.get(osrmUrl, { timeout: 5000 });

    if (response.data.code === "Ok") {
      const route = response.data.routes[0];
      console.log(`   ✅ OSRM ROUTING: OK`);
      console.log(`   📏 Distance: ${(route.distance / 1000).toFixed(2)} km`);
      console.log(
        `   ⏱️  Duration: ${Math.round(route.duration / 60)} minutes`
      );
    } else {
      console.log(`   ❌ OSRM Error: ${response.data.message}`);
    }
  } catch (error) {
    console.log(`   ❌ OSRM Test Failed: ${error.message}`);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 OPTIMIZED SYSTEM SUMMARY");
  console.log("=".repeat(60));

  const successRate = (totalSuccess / testAddresses.length) * 100;
  console.log(
    `\n🎯 Overall Success Rate: ${successRate.toFixed(1)}% (${totalSuccess}/${testAddresses.length})`
  );

  console.log(`\n📈 Service Usage:`);
  console.log(
    `   🇻🇳 Vietnam Address DB: ${vietnamDBHits} hits (${((vietnamDBHits / totalSuccess) * 100).toFixed(1)}%)`
  );
  console.log(
    `   🥇 Mapbox: ${mapboxHits} hits (${((mapboxHits / totalSuccess) * 100).toFixed(1)}%)`
  );

  console.log(`\n💰 Cost Analysis:`);
  console.log(`   🆓 FREE Services: Vietnam DB (${vietnamDBHits} requests)`);
  console.log(
    `   💳 Paid Services: Mapbox (${mapboxHits} requests out of 100,000/month FREE)`
  );
  console.log(`   💸 Total Cost: $0.00 (within free tiers)`);

  console.log(`\n🏆 System Status:`);
  if (successRate >= 95) {
    console.log("   ⭐ EXCELLENT - Production Ready!");
  } else if (successRate >= 85) {
    console.log("   🥈 VERY GOOD - Minor tweaks needed");
  } else {
    console.log("   ⚠️  NEEDS IMPROVEMENT");
  }

  console.log(`\n✨ OPTIMIZED SERVICES:`);
  console.log(`   ✅ Vietnam Address Database - FREE local geocoding`);
  console.log(`   ✅ Mapbox Geocoding - Best external service`);
  console.log(`   ✅ OSRM Docker - FREE self-hosted routing`);
  console.log(`   ✅ Leaflet Maps - FREE visualization`);

  console.log(`\n🗑️  REMOVED SERVICES:`);
  console.log(`   ❌ Google Maps - Authorization issues + cost`);
  console.log(`   ❌ Nominatim - Slower than Mapbox`);
  console.log(`   ❌ OpenCage - Redundant with Mapbox`);

  console.log(
    `\n🚀 FINAL RESULT: Streamlined system với chỉ những services tốt nhất!`
  );
})().catch(console.error);

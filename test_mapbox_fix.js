/**
 * 🧪 TEST MAPBOX GEOCODING AFTER FIXING TOKEN
 */

require("dotenv").config();
const { geocodeAddress } = require("./src/util/mapService");

async function testMapboxGeocoding() {
  console.log("🔍 Testing Mapbox Geocoding với token mới...");
  console.log(
    "🔑 MAPBOX_ACCESS_TOKEN:",
    process.env.MAPBOX_ACCESS_TOKEN ? "✅ Có" : "❌ Không có"
  );

  // Test addresses
  const testAddresses = [
    "39 Phạm Văn Đồng, Hiệp Bình Chánh, Thủ Đức, TP.HCM",
    "123 Lê Lợi, Quận 1, TP.HCM",
    "456 Nguyễn Huệ, Quận 1, TP.HCM",
  ];

  for (const address of testAddresses) {
    console.log(`\n📍 Testing: ${address}`);
    try {
      const result = await geocodeAddress(address);
      if (result) {
        console.log(`✅ SUCCESS:`);
        console.log(`   📍 Tọa độ: (${result.latitude}, ${result.longitude})`);
        console.log(
          `   🎯 Confidence: ${(result.confidence * 100).toFixed(1)}%`
        );
        console.log(`   🔧 Source: ${result.source}`);
        console.log(`   📝 Display: ${result.displayName}`);
      } else {
        console.log(`❌ FAILED: Không tìm thấy tọa độ`);
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
  }
}

// Run test
testMapboxGeocoding()
  .then(() => {
    console.log("\n🏁 Test hoàn thành!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test thất bại:", error);
    process.exit(1);
  });

/**
 * 🧪 TEST MAPBOX GEOCODING - Địa chỉ không có trong Vietnam DB
 */

require("dotenv").config();
const { tryMapboxGeocoding } = require("./src/util/mapService");

async function testMapboxSpecific() {
  console.log("🔍 Testing specific Mapbox Geocoding...");
  console.log(
    "🔑 MAPBOX_ACCESS_TOKEN:",
    process.env.MAPBOX_ACCESS_TOKEN ? "✅ Có" : "❌ Không có"
  );

  // Test với địa chỉ khó tìm (không có trong Vietnam DB)
  const testAddresses = [
    "789 Đường ABC, Phường XYZ, Quận 7, TP.HCM", // Fake address
    "15 Đường Số 1, Khu Phố 2, Phường An Phú, Quận 2, TP.HCM",
    "Số 100 Đường Điện Biên Phủ, Quận Bình Thạnh, TP.HCM",
  ];

  // Import tryMapboxGeocoding directly
  const axios = require("axios");

  async function directMapboxTest(address) {
    const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

    if (!MAPBOX_ACCESS_TOKEN) {
      console.log(`⚠️ Mapbox: Access token không được cấu hình`);
      return null;
    }

    try {
      const query = address + ", Ho Chi Minh City, Vietnam";
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=vn&limit=3&types=address,poi,place`;

      console.log(`🔍 Mapbox URL: ${url.substring(0, 100)}...`);

      const response = await axios.get(url, { timeout: 8000 });

      if (response.data.features && response.data.features.length > 0) {
        const result = response.data.features[0];

        console.log(`✅ Mapbox SUCCESS:`);
        console.log(`   📍 Tọa độ: (${result.center[1]}, ${result.center[0]})`);
        console.log(`   🎯 Relevance: ${(result.relevance * 100).toFixed(1)}%`);
        console.log(`   📝 Place: ${result.place_name}`);
        console.log(`   🏷️ Types: ${result.place_type?.join(", ")}`);

        return result;
      } else {
        console.log(`❌ Mapbox: No results`);
        return null;
      }
    } catch (err) {
      if (err.response) {
        console.log(
          `❌ Mapbox HTTP Error: ${err.response.status} - ${err.response.statusText}`
        );
        if (err.response.data) {
          console.log(`   📄 Response: ${JSON.stringify(err.response.data)}`);
        }
      } else {
        console.log(`❌ Mapbox Error: ${err.message}`);
      }
      return null;
    }
  }

  for (const address of testAddresses) {
    console.log(`\n📍 Testing: ${address}`);
    await directMapboxTest(address);
  }
}

// Run test
testMapboxSpecific()
  .then(() => {
    console.log("\n🏁 Mapbox test hoàn thành!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test thất bại:", error);
    process.exit(1);
  });

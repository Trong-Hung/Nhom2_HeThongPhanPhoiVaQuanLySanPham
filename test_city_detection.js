/**
 * 🧪 TEST GEOCODING HANOI vs HO CHI MINH
 */

require("dotenv").config();
const { geocodeAddress } = require("./src/util/mapService");

async function testCityDetection() {
  console.log("🔍 Testing City Detection trong Geocoding...");

  const testAddresses = [
    // Hà Nội addresses
    "587 tam trinh, Phường Yên Sở, Quận Hoàng Mai, Thành phố Hà Nội",
    "123 Đường Láng, Quận Đống Đa, Hà Nội",
    "456 Phố Huế, Quận Hai Bà Trưng, Hà Nội",

    // TP.HCM addresses
    "39 Phạm Văn Đồng, Hiệp Bình Chánh, Thủ Đức, TP.HCM",
    "123 Lê Lợi, Quận 1, Hồ Chí Minh",

    // Đà Nẵng address
    "789 Nguyễn Văn Linh, Quận Hải Châu, Đà Nẵng",
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

        // Check if coordinates make sense for the city
        const lat = result.latitude;
        const lon = result.longitude;

        let expectedCity = "Unknown";
        if (
          address.toLowerCase().includes("hà nội") ||
          address.toLowerCase().includes("hanoi")
        ) {
          expectedCity = "Hà Nội";
          // Hanoi coordinates: ~21.0285°N, 105.8542°E
          const isInHanoi =
            lat >= 20.8 && lat <= 21.4 && lon >= 105.3 && lon <= 105.9;
          console.log(
            `   🌍 Coordinates check: ${isInHanoi ? "✅ Trong Hà Nội" : "❌ KHÔNG trong Hà Nội"}`
          );
        } else if (
          address.toLowerCase().includes("hồ chí minh") ||
          address.toLowerCase().includes("tp.hcm")
        ) {
          expectedCity = "TP.HCM";
          // HCMC coordinates: ~10.7769°N, 106.7009°E
          const isInHCMC =
            lat >= 10.3 && lat <= 11.2 && lon >= 106.3 && lon <= 107.0;
          console.log(
            `   🌍 Coordinates check: ${isInHCMC ? "✅ Trong TP.HCM" : "❌ KHÔNG trong TP.HCM"}`
          );
        }
      } else {
        console.log(`❌ FAILED: Không tìm thấy tọa độ`);
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
  }
}

// Run test
testCityDetection()
  .then(() => {
    console.log("\n🏁 City detection test hoàn thành!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test thất bại:", error);
    process.exit(1);
  });

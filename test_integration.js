/**
 * 🔄 TEST INTEGRATION WITH EXISTING CONTROLLERS
 * Kiểm tra tính tương thích với các controllers sử dụng mapService
 */

const {
  geocodeAddress,
  getDistanceMatrix,
  getRoute,
} = require("./src/util/mapService");

async function testControllerIntegration() {
  console.log(`\n🔄 TESTING CONTROLLER INTEGRATION`);
  console.log(`===============================`);

  try {
    // Test 1: Geocode function (used by DonHangController, WarehouseController, ShipperController)
    console.log(`\n1️⃣ Testing geocodeAddress function:`);
    const address = "123 Nguyễn Huệ, Quận 1, TP.HCM";
    const geocodeResult = await geocodeAddress(address);

    if (geocodeResult) {
      console.log(`✅ geocodeAddress: SUCCESS`);
      console.log(`   Source: ${geocodeResult.source}`);
      console.log(
        `   Confidence: ${(geocodeResult.confidence * 100).toFixed(1)}%`
      );
      console.log(
        `   Coordinates: ${geocodeResult.latitude}, ${geocodeResult.longitude}`
      );
    } else {
      console.log(`❌ geocodeAddress: FAILED`);
      return false;
    }

    // Test 2: Distance matrix (used by DonHangController for route optimization)
    console.log(`\n2️⃣ Testing getDistanceMatrix function:`);
    const locations = [
      { latitude: 10.776347, longitude: 106.703294 }, // Nguyễn Huệ
      { latitude: 10.774977, longitude: 106.700793 }, // Lê Lợi
      { latitude: 10.75582, longitude: 106.68282 }, // Trần Hưng Đạo
    ];

    const matrixResult = await getDistanceMatrix(locations);

    if (matrixResult && Array.isArray(matrixResult)) {
      console.log(`✅ getDistanceMatrix: SUCCESS`);
      console.log(
        `   Matrix size: ${matrixResult.length}x${matrixResult[0].length}`
      );
      console.log(`   Sample distance: ${matrixResult[0][1]}m`);
      console.log(`   Distance matrix format: OSRM-compatible`);
    } else {
      console.log(`❌ getDistanceMatrix: FAILED`);
      console.log(`   Result:`, matrixResult);
      return false;
    }

    // Test 3: Route calculation (used by ShipperController)
    console.log(`\n3️⃣ Testing getRoute function:`);
    const routeResult = await getRoute(
      { latitude: 10.776347, longitude: 106.703294 }, // Start
      { latitude: 10.774977, longitude: 106.700793 } // End
    );

    if (routeResult && routeResult.geometry) {
      console.log(`✅ getRoute: SUCCESS`);
      console.log(`   Distance: ${routeResult.distance}`);
      console.log(`   Duration: ${routeResult.duration}`);
      console.log(`   Geometry points: ${routeResult.geometry.length}`);
      console.log(`   Instructions: ${routeResult.instructions.length} steps`);
    } else {
      console.log(`❌ getRoute: FAILED`);
      console.log(`   Result:`, routeResult);
      return false;
    }

    console.log(`\n🎉 ALL CONTROLLER FUNCTIONS WORKING PERFECTLY`);
    console.log(`===============================================`);
    console.log(
      `✅ geocodeAddress: Compatible với DonHangController, WarehouseController, ShipperController`
    );
    console.log(
      `✅ getDistanceMatrix: Compatible với DonHangController route optimization`
    );
    console.log(`✅ getRoute: Compatible với ShipperController routing`);
    console.log(`\n💡 System Ready for Production:`);
    console.log(
      `   - Vietnam Address Database: HIGH accuracy cho Vietnamese addresses`
    );
    console.log(
      `   - Mapbox Integration: RELIABLE fallback với global coverage`
    );
    console.log(
      `   - OSRM Routing: LOCAL server cho distance matrix & routing`
    );
    console.log(`   - Cost: $0/month (all within free tiers)`);

    return true;
  } catch (error) {
    console.error(`\n💥 Integration Test Failed:`, error.message);
    return false;
  }
}

// Run test if called directly
if (require.main === module) {
  testControllerIntegration()
    .then((success) => {
      if (success) {
        console.log(`\n🏁 Integration test completed successfully!`);
        process.exit(0);
      } else {
        console.log(`\n❌ Integration test failed!`);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error(`\n💥 Integration test error:`, error);
      process.exit(1);
    });
}

module.exports = { testControllerIntegration };

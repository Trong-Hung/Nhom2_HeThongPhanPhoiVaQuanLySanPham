/**
 * 🛣️ TEST OSRM INTEGRATION FOR REAL ROUTES
 * Kiểm tra tích hợp OSRM vào hệ thống bản đồ
 */

const axios = require("axios");

const OSRM_SERVER_URL = "http://127.0.0.1:5000";

async function testOSRMIntegration() {
  console.log(`\n🛣️ TESTING OSRM INTEGRATION`);
  console.log(`==========================`);

  // Test coordinates (Warehouse -> Customer)
  const warehouseCoords = {
    latitude: 10.845507,
    longitude: 106.725729,
    name: "Kho hàng Thủ Đức",
  };

  const customerCoords = {
    latitude: 10.776347,
    longitude: 106.703294,
    name: "Khách hàng Nguyễn Huệ, Q1",
  };

  console.log(`📍 From: ${warehouseCoords.name}`);
  console.log(`📍 To: ${customerCoords.name}`);

  try {
    // Test OSRM Route API
    const routeUrl = `${OSRM_SERVER_URL}/route/v1/driving/${warehouseCoords.longitude},${warehouseCoords.latitude};${customerCoords.longitude},${customerCoords.latitude}?steps=true&geometries=geojson`;

    console.log(`\n🌐 Testing OSRM URL: ${routeUrl}`);

    const response = await axios.get(routeUrl, { timeout: 10000 });

    if (response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];

      console.log(`\n✅ OSRM ROUTE SUCCESS!`);
      console.log(`🛣️ Distance: ${(route.distance / 1000).toFixed(2)} km`);
      console.log(`⏱️ Duration: ${Math.round(route.duration / 60)} phút`);
      console.log(`📊 Geometry points: ${route.geometry.coordinates.length}`);

      // Test if geometry is valid
      if (
        route.geometry &&
        route.geometry.coordinates &&
        route.geometry.coordinates.length > 0
      ) {
        console.log(`✅ Route geometry: VALID`);
        console.log(
          `   First point: [${route.geometry.coordinates[0][1]}, ${route.geometry.coordinates[0][0]}]`
        );
        console.log(
          `   Last point: [${route.geometry.coordinates[route.geometry.coordinates.length - 1][1]}, ${route.geometry.coordinates[route.geometry.coordinates.length - 1][0]}]`
        );

        // Check if it's a real route (not straight line)
        const straightLineDistance = calculateStraightLineDistance(
          warehouseCoords.latitude,
          warehouseCoords.longitude,
          customerCoords.latitude,
          customerCoords.longitude
        );

        const routeDistance = route.distance / 1000;
        const routeRatio = routeDistance / straightLineDistance;

        console.log(`\n📏 Route Analysis:`);
        console.log(`   Straight line: ${straightLineDistance.toFixed(2)} km`);
        console.log(`   Actual route: ${routeDistance.toFixed(2)} km`);
        console.log(`   Route ratio: ${routeRatio.toFixed(2)}x`);

        if (routeRatio > 1.1) {
          console.log(
            `✅ REAL ROUTE: Tuyến đường thực tế (${routeRatio.toFixed(1)}x longer than straight line)`
          );
        } else {
          console.log(
            `⚠️ SUSPICIOUS: Route might be too straight (only ${routeRatio.toFixed(1)}x)`
          );
        }

        return {
          success: true,
          distance: route.distance,
          duration: route.duration,
          geometry: route.geometry,
          routeRatio: routeRatio,
        };
      } else {
        console.log(`❌ Route geometry: INVALID or EMPTY`);
        return {
          success: false,
          error: "Invalid route geometry",
        };
      }
    } else {
      console.log(`❌ OSRM ROUTE FAILED: No routes found`);
      return { success: false, error: "No routes found" };
    }
  } catch (error) {
    console.log(`💥 OSRM ERROR: ${error.message}`);

    if (error.code === "ECONNREFUSED") {
      console.log(`🔧 SOLUTION: Khởi động OSRM server:`);
      console.log(
        `   docker run -t -i -p 5000:5000 -v "C:\\DOAN:/data" osrm/osrm-backend osrm-routed /data/vietnam-251114.osrm`
      );
    }

    return { success: false, error: error.message };
  }
}

// Helper function to calculate straight line distance
function calculateStraightLineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Run test if called directly
if (require.main === module) {
  testOSRMIntegration()
    .then((result) => {
      if (result.success) {
        console.log(`\n🎉 OSRM Integration: SUCCESS!`);
        console.log(`Ready to show real routes on maps! 🗺️`);
      } else {
        console.log(`\n❌ OSRM Integration: FAILED`);
        console.log(`Error: ${result.error}`);
      }
    })
    .catch((error) => {
      console.error(`\n💥 Test failed:`, error);
    });
}

module.exports = { testOSRMIntegration };

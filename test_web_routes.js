/**
 * 🌐 WEB TEST OSRM ROUTES
 * Test trực quan tuyến đường thực tế trên web
 */

const axios = require("axios");

async function testWebRoutes() {
  console.log(`\n🌐 TESTING WEB ROUTES DISPLAY`);
  console.log(`============================`);

  try {
    // Test API endpoint của shipper
    const response = await axios.get(
      "http://localhost:3000/shipper/api/order-detail",
      {
        params: {
          orderId: "225ae1", // Sử dụng một order ID từ log server
        },
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (response.data) {
      console.log(`✅ API Response received`);
      console.log(`📦 Order ID: ${response.data.order?._id || "N/A"}`);

      // Check if route data is included
      if (response.data.routeData) {
        console.log(`✅ Route Data: INCLUDED`);
        console.log(
          `🛣️ Distance: ${(response.data.routeData.distance / 1000).toFixed(2)} km`
        );
        console.log(
          `⏱️ Duration: ${Math.round(response.data.routeData.duration / 60)} phút`
        );
        console.log(
          `📍 Geometry points: ${response.data.routeData.geometry?.coordinates?.length || 0}`
        );
      } else {
        console.log(`❌ Route Data: MISSING`);
      }

      // Check coordinates
      if (
        response.data.order?.customerLatitude &&
        response.data.order?.customerLongitude
      ) {
        console.log(
          `✅ Customer coordinates: [${response.data.order.customerLatitude}, ${response.data.order.customerLongitude}]`
        );
      } else {
        console.log(`❌ Customer coordinates: MISSING`);
      }

      return { success: true, hasRouteData: !!response.data.routeData };
    } else {
      console.log(`❌ Empty API response`);
      return { success: false, error: "Empty response" };
    }
  } catch (error) {
    console.log(`💥 API ERROR: ${error.message}`);

    if (error.response?.status === 404) {
      console.log(
        `🔧 SOLUTION: Order ID không tồn tại. Thử với order ID khác.`
      );
    } else if (error.code === "ECONNREFUSED") {
      console.log(`🔧 SOLUTION: Server chưa chạy. Start server:`);
      console.log(`   npm start`);
    }

    return { success: false, error: error.message };
  }
}

// Test instructions
function showTestInstructions() {
  console.log(`\n📋 MANUAL TEST INSTRUCTIONS`);
  console.log(`===========================`);
  console.log(`1. Mở trình duyệt và truy cập: http://localhost:3000`);
  console.log(`2. Đăng nhập với tài khoản shipper`);
  console.log(`3. Vào mục "Đơn hàng cần giao"`);
  console.log(`4. Click vào một đơn hàng để xem chi tiết`);
  console.log(`5. Kiểm tra bản đồ có hiển thị tuyến đường thực tế không`);
  console.log(`\n🔍 WHAT TO LOOK FOR:`);
  console.log(`✅ Tuyến đường cong theo đường phố (không phải đường thẳng)`);
  console.log(`✅ Hiển thị khoảng cách và thời gian chính xác`);
  console.log(`✅ Bản đồ tự động zoom vừa tuyến đường`);
  console.log(`⚠️ Nếu OSRM lỗi: hiển thị đường thẳng đứt nét`);
}

// Run tests
async function runFullTest() {
  console.log(`🧪 FULL OSRM INTEGRATION TEST`);
  console.log(`============================`);

  const apiResult = await testWebRoutes();

  if (apiResult.success) {
    if (apiResult.hasRouteData) {
      console.log(`\n🎉 SUCCESS: API có trả về route data!`);
    } else {
      console.log(`\n⚠️ WARNING: API không có route data`);
    }
  } else {
    console.log(`\n❌ FAILED: Không thể test API`);
  }

  showTestInstructions();
}

if (require.main === module) {
  runFullTest();
}

module.exports = { testWebRoutes, showTestInstructions };

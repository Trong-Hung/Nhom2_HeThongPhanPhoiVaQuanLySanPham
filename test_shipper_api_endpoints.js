const axios = require("axios");

// Base URLs for testing
const BASE_URLS = {
  local: "http://localhost:3000",
  emulator: "http://10.0.2.2:3000",
  network: "http://192.168.1.21:3000",
};

const SHIPPER_ENDPOINTS = [
  // Order Management
  {
    method: "GET",
    path: "/shipper/api/pending-orders",
    desc: "Lấy đơn hàng đang sắp xếp",
  },
  {
    method: "GET",
    path: "/shipper/api/active-orders",
    desc: "Lấy đơn hàng đang vận chuyển",
  },
  {
    method: "GET",
    path: "/shipper/api/delivered-orders",
    desc: "Lấy đơn hàng đã giao",
  },
  {
    method: "GET",
    path: "/shipper/api/order/test123",
    desc: "Chi tiết đơn hàng",
  },
  {
    method: "POST",
    path: "/shipper/api/confirm/test123",
    desc: "Nhận đơn hàng",
  },
  {
    method: "POST",
    path: "/shipper/api/mark-delivered/test123",
    desc: "Đánh dấu đã giao",
  },
  {
    method: "GET",
    path: "/shipper/api/directions/test123",
    desc: "Lấy chỉ đường",
  },

  // Route Optimization
  {
    method: "POST",
    path: "/shipper/optimize-routes",
    desc: "Tối ưu lộ trình đơn hàng",
  },
  {
    method: "POST",
    path: "/shipper/api/my-routes/optimize",
    desc: "Tối ưu lộ trình cũ",
  },

  // Transfer Management
  {
    method: "GET",
    path: "/shipper/transfers/dang-sap-xep",
    desc: "Transfer đang sắp xếp",
  },
  {
    method: "GET",
    path: "/shipper/transfers/dang-van-chuyen",
    desc: "Transfer đang vận chuyển",
  },
  {
    method: "GET",
    path: "/shipper/transfers/da-giao",
    desc: "Transfer đã giao",
  },
  {
    method: "GET",
    path: "/shipper/transfers/test123",
    desc: "Chi tiết transfer",
  },
  {
    method: "POST",
    path: "/shipper/transfers/confirm/test123",
    desc: "Nhận transfer",
  },
  {
    method: "POST",
    path: "/shipper/transfer/mark-delivered/test123",
    desc: "Hoàn thành transfer",
  },
  {
    method: "POST",
    path: "/shipper/optimize-transfer-routes",
    desc: "Tối ưu lộ trình transfer",
  },

  // Debug
  { method: "GET", path: "/shipper/debug/transfers", desc: "Debug transfers" },
  {
    method: "GET",
    path: "/shipper/debug/reset-route-order",
    desc: "Reset route order",
  },
];

async function testEndpoints() {
  console.log("🧪 TESTING SHIPPER API ENDPOINTS");
  console.log("=====================================\n");

  const baseUrl = BASE_URLS.local;
  let sessionCookie = null;

  // Test basic connection
  try {
    console.log("📡 Testing server connection...");
    const homeResponse = await axios.get(baseUrl);
    console.log("✅ Server is running");

    // Extract session cookie if available
    if (homeResponse.headers["set-cookie"]) {
      sessionCookie = homeResponse.headers["set-cookie"][0];
      console.log("🍪 Session cookie obtained");
    }
  } catch (error) {
    console.log("❌ Server connection failed:", error.message);
    return;
  }

  console.log("\n📋 Testing Shipper API Endpoints:");
  console.log("----------------------------------\n");

  for (const endpoint of SHIPPER_ENDPOINTS) {
    const url = baseUrl + endpoint.path;
    const headers = {
      "Content-Type": "application/json",
    };

    if (sessionCookie) {
      headers["Cookie"] = sessionCookie;
    }

    try {
      let response;
      if (endpoint.method === "GET") {
        response = await axios.get(url, { headers, timeout: 5000 });
      } else {
        response = await axios.post(url, {}, { headers, timeout: 5000 });
      }

      console.log(`✅ ${endpoint.method} ${endpoint.path}`);
      console.log(`   ${endpoint.desc}`);
      console.log(`   Status: ${response.status}`);

      if (response.data && response.data.message) {
        console.log(`   Response: ${response.data.message}`);
      }
    } catch (error) {
      const status = error.response ? error.response.status : "No Response";
      const message = error.response?.data?.message || error.message;

      if (status === 403) {
        console.log(`⚠️  ${endpoint.method} ${endpoint.path}`);
        console.log(`   ${endpoint.desc}`);
        console.log(`   Status: ${status} (Authentication Required)`);
      } else if (status === 404) {
        console.log(`⚠️  ${endpoint.method} ${endpoint.path}`);
        console.log(`   ${endpoint.desc}`);
        console.log(`   Status: ${status} (Route Not Found)`);
      } else {
        console.log(`❌ ${endpoint.method} ${endpoint.path}`);
        console.log(`   ${endpoint.desc}`);
        console.log(`   Status: ${status}`);
        console.log(`   Error: ${message}`);
      }
    }
    console.log("");
  }

  console.log("\n🌐 Available Base URLs for Mobile Development:");
  console.log("==============================================");
  Object.keys(BASE_URLS).forEach((env) => {
    console.log(`${env.toUpperCase()}: ${BASE_URLS[env]}/shipper`);
  });

  console.log("\n📱 Mobile Development Notes:");
  console.log("============================");
  console.log("• Use http://10.0.2.2:3000 for Android Emulator");
  console.log("• All endpoints require session authentication");
  console.log("• Login first: POST /auth/login");
  console.log("• Include session cookie in all requests");
  console.log("• Content-Type: application/json");
}

// Run the test
if (require.main === module) {
  testEndpoints().catch(console.error);
}

module.exports = { testEndpoints, SHIPPER_ENDPOINTS, BASE_URLS };

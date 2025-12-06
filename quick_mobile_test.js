#!/usr/bin/env node

// Quick mobile connectivity test
const axios = require("axios");

const MOBILE_URLS = [
  "http://localhost:3000",
  "http://10.0.2.2:3000", // Android Emulator
  "http://192.168.1.21:3000", // WiFi Network
  "http://172.31.160.1:3000", // WSL
];

async function quickTest() {
  console.log("📱 MOBILE CONNECTIVITY TEST");
  console.log("============================\n");

  for (const url of MOBILE_URLS) {
    try {
      const startTime = Date.now();
      const response = await axios.get(url, { timeout: 3000 });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      console.log(`✅ ${url}`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Response Time: ${responseTime}ms`);

      if (url.includes("10.0.2.2")) {
        console.log(`   👍 RECOMMENDED FOR ANDROID EMULATOR`);
      }
      if (url.includes("192.168.1")) {
        console.log(`   📱 USE FOR REAL DEVICE ON WIFI`);
      }
    } catch (error) {
      console.log(`❌ ${url}`);
      console.log(`   Error: ${error.code || error.message}`);
    }
    console.log("");
  }

  console.log("🔧 QUICK API TEST:");
  console.log("===================");

  // Test một API endpoint
  try {
    const testUrl = "http://localhost:3000/shipper/api/pending-orders";
    const response = await axios.get(testUrl, {
      timeout: 3000,
      validateStatus: function (status) {
        return status < 500; // Accept 403 as valid response (auth required)
      },
    });

    if (response.status === 403) {
      console.log("✅ API Endpoint Working (Authentication Required)");
      console.log("   Ready for mobile integration!");
    } else {
      console.log(`✅ API Response: ${response.status}`);
    }
  } catch (error) {
    console.log("❌ API Test Failed:", error.message);
  }

  console.log("\n📋 NEXT STEPS FOR MOBILE DEV:");
  console.log("==============================");
  console.log("1. Use http://10.0.2.2:3000 in Flutter app");
  console.log("2. Implement login flow first");
  console.log("3. Store session cookie");
  console.log("4. Test with real device using WiFi IP");
  console.log("5. Refer to MOBILE_APP_DEVELOPMENT_GUIDE.md");
}

quickTest().catch(console.error);

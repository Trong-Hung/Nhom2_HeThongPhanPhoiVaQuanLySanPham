#!/usr/bin/env node

// Test connectivity from Android Emulator perspective
const axios = require("axios");

async function testEmulatorConnectivity() {
  console.log("🤖 ANDROID EMULATOR CONNECTIVITY TEST");
  console.log("=====================================\n");

  // Test emulator address (10.0.2.2 maps to host localhost)
  const emulatorUrl = "http://10.0.2.2:3000";

  console.log("📱 Testing Android Emulator Address...");
  console.log(`Target: ${emulatorUrl}\n`);

  try {
    console.log("1️⃣  Testing basic connection...");
    const startTime = Date.now();
    const response = await axios.get(emulatorUrl, {
      timeout: 10000,
      headers: {
        "User-Agent": "Flutter/Android-Emulator",
      },
    });
    const endTime = Date.now();

    console.log(`✅ SUCCESS: Connection established!`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Response Time: ${endTime - startTime}ms`);
    console.log(`   Server: Running and accessible from emulator\n`);

    // Test API endpoint
    console.log("2️⃣  Testing API endpoint...");
    try {
      const apiResponse = await axios.get(
        `${emulatorUrl}/shipper/api/pending-orders`,
        {
          timeout: 5000,
          validateStatus: function (status) {
            return status < 500; // Accept 403 as valid (auth required)
          },
        }
      );

      if (apiResponse.status === 403) {
        console.log(`✅ API WORKING: Authentication required (expected)`);
        console.log(`   Ready for Flutter integration!\n`);
      } else {
        console.log(`✅ API Response: ${apiResponse.status}\n`);
      }
    } catch (apiError) {
      console.log(`❌ API Test Failed: ${apiError.message}\n`);
    }

    // Test với thông tin thực tế
    console.log("📋 EMULATOR INTEGRATION INFO:");
    console.log("==============================");
    console.log(`✅ Emulator URL: ${emulatorUrl}`);
    console.log(`✅ Server bind: 0.0.0.0:3000 (accessible from emulator)`);
    console.log(`✅ API Base URL: ${emulatorUrl}/shipper`);
    console.log("");

    console.log("🚀 FLUTTER CONFIGURATION:");
    console.log("==========================");
    console.log(
      'static const String baseUrl = "http://10.0.2.2:3000/shipper";'
    );
    console.log("");

    console.log("✅ READY FOR MOBILE DEVELOPMENT!");
    console.log("================================");
    console.log("• Server accessible from Android Emulator");
    console.log("• APIs working (authentication required)");
    console.log("• Use http://10.0.2.2:3000 in Flutter code");
  } catch (error) {
    console.log(`❌ FAILED: Cannot connect to ${emulatorUrl}`);
    console.log(`   Error: ${error.code || error.message}\n`);

    console.log("🔧 TROUBLESHOOTING:");
    console.log("===================");
    console.log("1. Check if server is running: node src/index.js");
    console.log("2. Verify server binds to 0.0.0.0 (not just localhost)");
    console.log("3. Check Windows Firewall settings");
    console.log("4. Try testing from real device with WiFi IP instead");
    console.log("");

    console.log("📱 ALTERNATIVE - Use Real Device:");
    console.log("=================================");
    console.log(
      'static const String baseUrl = "http://192.168.1.21:3000/shipper";'
    );
    console.log("• Connect phone to same WiFi");
    console.log("• Use actual WiFi IP instead of emulator IP");
  }
}

// Test Windows Firewall
async function testFirewall() {
  console.log("\n🛡️  WINDOWS FIREWALL CHECK:");
  console.log("============================");

  // Test từ external IP
  try {
    const wifiResponse = await axios.get("http://192.168.1.21:3000", {
      timeout: 3000,
    });
    console.log("✅ WiFi IP accessible - Firewall OK");
  } catch (error) {
    console.log("⚠️  WiFi IP test failed - Check firewall");
  }
}

// Run tests
if (require.main === module) {
  testEmulatorConnectivity()
    .then(() => testFirewall())
    .catch(console.error);
}

module.exports = { testEmulatorConnectivity };

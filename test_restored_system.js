/**
 * 🔄 TEST RESTORED VIETNAM DB + MAPBOX SYSTEM
 * Kiểm tra hệ thống được khôi phục với độ chính xác cao
 */

const { geocodeAddress } = require("./src/util/mapService");
const { validateAndImproveGeocode } = require("./src/util/geocodingValidator");

async function testRestoredSystem() {
  console.log(`\n🔄 TESTING RESTORED VIETNAM DB + MAPBOX SYSTEM`);
  console.log(`=====================================`);

  const testAddresses = [
    // Vietnam specific addresses
    "123 Nguyễn Huệ, Quận 1, TP.HCM",
    "456 Lê Lợi, P.Bến Nghé, Q.1",
    "789 Trần Hưng Đạo, Quận 5",
    "100 Điện Biên Phủ, Bình Thạnh",

    // Difficult addresses
    "Chung cư Vinhomes Central Park",
    "Landmark 81 Vinhomes",
    "Trường Đại học Bách Khoa",
    "Bệnh viện Chợ Rẫy",

    // Incomplete addresses
    "Nguyễn Văn Linh",
    "Quận 7 TP.HCM",
    "Phường Tân Phú",
  ];

  let totalTests = 0;
  let successfulTests = 0;
  let vietnamDbResults = 0;
  let mapboxResults = 0;

  for (const address of testAddresses) {
    console.log(`\n🎯 Testing: "${address}"`);
    console.log(`-`.repeat(50));

    try {
      totalTests++;

      // Test basic geocoding
      const basicResult = await geocodeAddress(address);

      if (basicResult) {
        successfulTests++;

        // Count source types
        if (basicResult.source === "vietnam_db") {
          vietnamDbResults++;
          console.log(
            `✅ SUCCESS via Vietnam DB (${(basicResult.confidence * 100).toFixed(1)}%)`
          );
        } else if (basicResult.source === "mapbox") {
          mapboxResults++;
          console.log(
            `✅ SUCCESS via Mapbox (${(basicResult.confidence * 100).toFixed(1)}%)`
          );
        } else {
          console.log(
            `✅ SUCCESS via ${basicResult.source} (${(basicResult.confidence * 100).toFixed(1)}%)`
          );
        }

        console.log(
          `📍 Coordinates: ${basicResult.latitude.toFixed(6)}, ${basicResult.longitude.toFixed(6)}`
        );
        console.log(`📝 Display: ${basicResult.displayName}`);

        // Test enhanced validation
        const validationResult = await validateAndImproveGeocode(
          address,
          "Ho Chi Minh City"
        );

        if (validationResult.success) {
          console.log(`🔍 Validation: PASSED`);
          if (validationResult.improved) {
            console.log(`⚡ Enhanced with confidence boost`);
          }
        } else {
          console.log(`⚠️ Validation: ${validationResult.error}`);
        }
      } else {
        console.log(`❌ FAILED: No geocoding result`);
      }
    } catch (error) {
      console.log(`💥 ERROR: ${error.message}`);
    }
  }

  // Summary statistics
  console.log(`\n📊 TEST SUMMARY`);
  console.log(`=====================================`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(
    `Successful: ${successfulTests} (${((successfulTests / totalTests) * 100).toFixed(1)}%)`
  );
  console.log(`Failed: ${totalTests - successfulTests}`);
  console.log(`\n📈 SOURCE BREAKDOWN:`);
  console.log(
    `🇻🇳 Vietnam DB: ${vietnamDbResults} (${((vietnamDbResults / successfulTests) * 100).toFixed(1)}%)`
  );
  console.log(
    `🗺️ Mapbox: ${mapboxResults} (${((mapboxResults / successfulTests) * 100).toFixed(1)}%)`
  );

  // Success criteria
  if (successfulTests >= totalTests * 0.8) {
    console.log(
      `\n🎉 SYSTEM STATUS: EXCELLENT (${((successfulTests / totalTests) * 100).toFixed(1)}% success rate)`
    );
  } else if (successfulTests >= totalTests * 0.6) {
    console.log(
      `\n⚠️ SYSTEM STATUS: GOOD (${((successfulTests / totalTests) * 100).toFixed(1)}% success rate)`
    );
  } else {
    console.log(
      `\n❌ SYSTEM STATUS: NEEDS IMPROVEMENT (${((successfulTests / totalTests) * 100).toFixed(1)}% success rate)`
    );
  }

  console.log(`\n💰 COST ANALYSIS:`);
  console.log(`Vietnam DB: FREE (${vietnamDbResults} requests)`);
  console.log(
    `Mapbox: ${mapboxResults} requests used of 100,000 monthly limit`
  );
  console.log(`Total Cost: $0 (within free tiers)`);

  return {
    totalTests,
    successfulTests,
    successRate: (successfulTests / totalTests) * 100,
    vietnamDbResults,
    mapboxResults,
    systemStatus:
      successfulTests >= totalTests * 0.8
        ? "EXCELLENT"
        : successfulTests >= totalTests * 0.6
          ? "GOOD"
          : "NEEDS_IMPROVEMENT",
  };
}

// Run test if called directly
if (require.main === module) {
  testRestoredSystem()
    .then((results) => {
      console.log(`\n🏁 Testing completed successfully!`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(`\n💥 Testing failed:`, error);
      process.exit(1);
    });
}

module.exports = { testRestoredSystem };

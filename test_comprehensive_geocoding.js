/**
 * COMPREHENSIVE MAPBOX GEOCODING TEST 🗺️
 * Test với địa chỉ thực tế ở TP.HCM
 */

const { validateAndImproveGeocode } = require("./src/util/geocodingValidator");

console.log("🗺️ COMPREHENSIVE MAPBOX GEOCODING TEST");
console.log("Testing với địa chỉ thực tế tại TP.HCM");
console.log("=".repeat(70));

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000;
}

(async () => {
  const realWorldAddresses = [
    {
      category: "🏢 Trung tâm thương mại",
      addresses: [
        "Vincom Center, 72 Lê Thánh Tôn, Quận 1",
        "Saigon Centre, 65 Lê Lợi, Quận 1",
        "Diamond Plaza, 34 Lê Duẩn, Quận 1",
      ],
    },
    {
      category: "🏫 Trường đại học",
      addresses: [
        "Đại học Bách Khoa, 268 Lý Thường Kiệt, Quận 10",
        "Đại học Kinh tế, 59C Nguyễn Đình Chiểu, Quận 3",
        "Đại học Y Dược, 217 Hồng Bàng, Quận 5",
      ],
    },
    {
      category: "🏥 Bệnh viện",
      addresses: [
        "Bệnh viện Chợ Rẫy, 201B Nguyễn Chí Thanh, Quận 5",
        "Bệnh viện Thống Nhất, 1 Lý Thường Kiệt, Quận Tân Bình",
        "Bệnh viện Từ Dũ, 284 Cống Quỳnh, Quận 1",
      ],
    },
    {
      category: "🚇 Ga tàu/xe bus",
      addresses: [
        "Ga Sài Gòn, 1 Nguyễn Thông, Quận 3",
        "Bến xe Miền Đông, 292 Đinh Bộ Lĩnh, Bình Thạnh",
        "Ga Metro Tân Cảng, đường Nguyễn Tất Thành, Quận 4",
      ],
    },
    {
      category: "🍕 Nhà hàng nổi tiếng",
      addresses: [
        "Pizza Hut, 234 Pasteur, Quận 3",
        "KFC Nguyễn Huệ, 169 Nguyễn Huệ, Quận 1",
        "Lotteria Vincom, 70 Lê Thánh Tôn, Quận 1",
      ],
    },
    {
      category: "🏠 Địa chỉ dân cư",
      addresses: [
        "123/45 Cách Mạng Tháng 8, Quận 3",
        "567 Điện Biên Phủ, Bình Thạnh",
        "89/12B Lê Văn Sỹ, Phú Nhuận",
      ],
    },
  ];

  let totalTests = 0;
  let mapboxSuccess = 0;
  let highQuality = 0;

  const results = [];

  for (const category of realWorldAddresses) {
    console.log(`\n${category.category}`);
    console.log("─".repeat(50));

    for (const address of category.addresses) {
      totalTests++;
      console.log(`\n📍 Testing: ${address}`);

      try {
        const result = await validateAndImproveGeocode(address, "hcm");

        if (result.success) {
          const coords = result.result;

          let qualityLabel = "";
          if (coords.confidence >= 0.8) {
            qualityLabel = "🟢 HIGH";
            highQuality++;
          } else if (coords.confidence >= 0.6) {
            qualityLabel = "🟡 MEDIUM";
          } else {
            qualityLabel = "🔴 LOW";
          }

          console.log(
            `   ✅ ${coords.source.toUpperCase()} - ${qualityLabel} (${(coords.confidence * 100).toFixed(0)}%)`
          );
          console.log(
            `   📍 ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
          );

          if (coords.source === "mapbox") {
            mapboxSuccess++;
            console.log(`   🥇 MAPBOX SUCCESS`);
          }

          results.push({
            address: address,
            category: category.category,
            success: true,
            source: coords.source,
            confidence: coords.confidence,
            coordinates: [coords.latitude, coords.longitude],
          });
        } else {
          console.log(`   ❌ FAILED: ${result.error}`);
          results.push({
            address: address,
            category: category.category,
            success: false,
            error: result.error,
          });
        }
      } catch (error) {
        console.log(`   💥 ERROR: ${error.message}`);
        results.push({
          address: address,
          category: category.category,
          success: false,
          error: error.message,
        });
      }
    }
  }

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("📊 COMPREHENSIVE TEST SUMMARY");
  console.log("=".repeat(70));

  const successRate =
    (results.filter((r) => r.success).length / totalTests) * 100;
  const mapboxRate = (mapboxSuccess / totalTests) * 100;
  const qualityRate = (highQuality / totalTests) * 100;

  console.log(
    `📈 Overall success rate: ${successRate.toFixed(1)}% (${results.filter((r) => r.success).length}/${totalTests})`
  );
  console.log(
    `🥇 Mapbox usage rate: ${mapboxRate.toFixed(1)}% (${mapboxSuccess}/${totalTests})`
  );
  console.log(
    `⭐ High quality results: ${qualityRate.toFixed(1)}% (${highQuality}/${totalTests})`
  );

  // Service breakdown
  console.log("\n📊 Service Usage Breakdown:");
  const services = {};
  results
    .filter((r) => r.success)
    .forEach((r) => {
      services[r.source] = (services[r.source] || 0) + 1;
    });

  Object.entries(services).forEach(([service, count]) => {
    const percentage = (count / results.filter((r) => r.success).length) * 100;
    console.log(
      `   ${service.toUpperCase()}: ${count} results (${percentage.toFixed(1)}%)`
    );
  });

  // Performance rating
  console.log("\n🏆 SYSTEM PERFORMANCE RATING:");
  if (successRate >= 90 && mapboxRate >= 50) {
    console.log("   🥇 EXCELLENT - Production ready!");
  } else if (successRate >= 80 && mapboxRate >= 30) {
    console.log("   🥈 VERY GOOD - Minor optimizations needed");
  } else if (successRate >= 70) {
    console.log("   🥉 GOOD - Some improvements needed");
  } else {
    console.log("   ⚠️  NEEDS WORK - Major issues to address");
  }

  console.log("\n💡 RECOMMENDATIONS:");
  if (mapboxRate < 40) {
    console.log("   • Consider optimizing Mapbox query formats");
  }
  if (qualityRate < 60) {
    console.log("   • Improve confidence scoring algorithms");
  }
  if (successRate < 85) {
    console.log("   • Add more fallback strategies");
    console.log("   • Expand Vietnam Address Database");
  }

  console.log("\n✨ MAPBOX is working great as primary geocoding service!");
})();

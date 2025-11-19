/**
 * 🗺️ GOOGLE MAPS ONLY TEST
 * Test hệ thống chỉ với Google Maps API key
 * Key: AIzaSyBqA9agThQfCJtE54OzaufTKetrswFWOIk
 */

const { geocodeAddress } = require("./src/util/mapService");

console.log("🗺️ GOOGLE MAPS ONLY GEOCODING TEST");
console.log("Key: AIzaSyBqA9agThQfCJtE54OzaufTKetrswFWOIk");
console.log("All other services removed - Pure Google Maps");
console.log("=".repeat(60));

(async () => {
  const testAddresses = [
    // Specific addresses
    "908 Phạm Văn Đồng, Hiệp Bình Chánh",
    "123 Lê Lợi, Quận 1",
    "456 Nguyễn Trãi, Quận 5",

    // Landmarks
    "Vincom Center, 72 Lê Thánh Tôn, Quận 1",
    "Đại học Bách Khoa, 268 Lý Thường Kiệt, Quận 10",
    "Chợ Bến Thành, Quận 1",
    "Sân bay Tân Sơn Nhất",
    "Bitexco Financial Tower",

    // Different address formats
    "Quận 1, TP.HCM",
    "District 1, Ho Chi Minh City",
    "Saigon",
    "Ho Chi Minh City",
  ];

  let successCount = 0;
  let totalTests = testAddresses.length;
  let totalConfidence = 0;
  const results = [];

  console.log("\n📍 TESTING ADDRESSES WITH GOOGLE MAPS ONLY:");
  console.log("─".repeat(50));

  for (const [index, address] of testAddresses.entries()) {
    console.log(`\n${index + 1}. Testing: "${address}"`);

    try {
      const startTime = Date.now();
      const result = await geocodeAddress(address);
      const duration = Date.now() - startTime;

      if (result) {
        successCount++;
        totalConfidence += result.confidence;

        console.log(`   ✅ SUCCESS in ${duration}ms`);
        console.log(
          `   📊 Confidence: ${(result.confidence * 100).toFixed(1)}%`
        );
        console.log(
          `   📍 Coordinates: ${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)}`
        );
        console.log(`   🏷️ Type: ${result.locationType || "unknown"}`);
        console.log(
          `   📝 Display: ${result.displayName?.substring(0, 80)}...`
        );

        results.push({
          address,
          success: true,
          confidence: result.confidence,
          coordinates: [result.latitude, result.longitude],
          locationType: result.locationType,
          duration,
        });
      } else {
        console.log(`   ❌ FAILED in ${duration}ms`);
        console.log(`   💡 Google Maps không tìm thấy địa chỉ này`);

        results.push({
          address,
          success: false,
          duration,
        });
      }

      // Delay to be nice to Google's API
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`   💥 ERROR: ${error.message}`);
      results.push({
        address,
        success: false,
        error: error.message,
      });
    }
  }

  // Detailed Analysis
  console.log("\n" + "=".repeat(60));
  console.log("📊 GOOGLE MAPS ONLY - DETAILED ANALYSIS");
  console.log("=".repeat(60));

  const successRate = (successCount / totalTests) * 100;
  const avgConfidence = successCount > 0 ? totalConfidence / successCount : 0;

  console.log(`\n🎯 PERFORMANCE METRICS:`);
  console.log(
    `   Success Rate: ${successRate.toFixed(1)}% (${successCount}/${totalTests})`
  );
  console.log(`   Average Confidence: ${(avgConfidence * 100).toFixed(1)}%`);
  console.log(
    `   Average Response Time: ${results.filter((r) => r.success).reduce((sum, r) => sum + r.duration, 0) / Math.max(successCount, 1)}ms`
  );

  console.log(`\n📈 SUCCESS BREAKDOWN:`);
  const locationTypes = {};
  results
    .filter((r) => r.success)
    .forEach((r) => {
      const type = r.locationType || "unknown";
      locationTypes[type] = (locationTypes[type] || 0) + 1;
    });

  Object.entries(locationTypes).forEach(([type, count]) => {
    console.log(`   ${type.toUpperCase()}: ${count} results`);
  });

  console.log(`\n💰 COST ANALYSIS:`);
  console.log(`   Total Requests: ${totalTests}`);
  console.log(`   Successful Requests: ${successCount}`);
  console.log(`   Monthly Estimate (30 days): ${totalTests * 30} requests`);
  console.log(`   Google Maps Pricing:`);
  console.log(`     • First 40,000 requests/month: FREE`);
  console.log(`     • After 40,000: $5.00 per 1,000 requests`);

  const monthlyRequests = totalTests * 30;
  const monthlyCost =
    monthlyRequests > 40000 ? (monthlyRequests - 40000) * 0.005 : 0;
  console.log(`   Estimated Monthly Cost: $${monthlyCost.toFixed(2)}`);

  console.log(`\n❌ FAILED ADDRESSES:`);
  const failed = results.filter((r) => !r.success);
  if (failed.length === 0) {
    console.log(`   🎉 All addresses geocoded successfully!`);
  } else {
    failed.forEach((fail, idx) => {
      console.log(
        `   ${idx + 1}. "${fail.address}" - ${fail.error || "No results"}`
      );
    });
  }

  console.log(`\n🏆 OVERALL ASSESSMENT:`);
  if (successRate === 100) {
    console.log(`   🥇 EXCELLENT: Perfect success rate with Google Maps only!`);
  } else if (successRate >= 90) {
    console.log(`   🥈 VERY GOOD: High success rate, minor gaps`);
  } else if (successRate >= 75) {
    console.log(`   🥉 GOOD: Decent coverage, some improvements needed`);
  } else if (successRate >= 50) {
    console.log(`   ⚠️ MODERATE: Significant gaps in coverage`);
  } else {
    console.log(`   ❌ POOR: Major issues with Google Maps API or key`);
  }

  console.log(`\n🚀 RECOMMENDATIONS:`);
  if (successRate === 100) {
    console.log(`   ✅ Google Maps only setup is working perfectly!`);
    console.log(`   💰 Monitor usage to stay within free tier`);
  } else if (successCount === 0) {
    console.log(`   🔧 CRITICAL: Check API key authorization`);
    console.log(`   📋 Enable Geocoding API in Google Cloud Console`);
    console.log(`   💳 Setup billing account (free tier available)`);
  } else {
    console.log(`   🔍 Review failed addresses for patterns`);
    console.log(`   🛠️ Consider address format optimization`);
    console.log(
      `   📈 Current ${successRate.toFixed(1)}% success rate may be sufficient`
    );
  }

  console.log(`\n✨ FINAL STATUS:`);
  console.log(`   Service: Google Maps Geocoding API (Simplified)`);
  console.log(`   Key: AIzaSyBqA9agThQfCJtE54OzaufTKetrswFWOIk`);
  console.log(`   Approach: Single service, multiple query formats`);
  console.log(`   Result: ${successRate.toFixed(1)}% success rate`);
})().catch(console.error);

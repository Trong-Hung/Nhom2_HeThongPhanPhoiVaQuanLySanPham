/**
 * Script test đặt hàng và kiểm tra gán kho
 */

const mongoose = require("mongoose");
require("dotenv").config();

const { getRegionByProvince } = require("./src/util/regions");

async function testOrderAssignment() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/doan"
    );
    console.log("✅ Đã kết nối MongoDB");

    // Test với địa chỉ Hà Nội
    const testAddress = "Thành phố Hà Nội";
    const region = getRegionByProvince(testAddress);

    console.log(`📍 Test địa chỉ: ${testAddress}`);
    console.log(`🗺️ Vùng được xác định: ${region}`);

    // Kiểm tra kho có phù hợp không
    const Warehouse = require("./src/app/models/Warehouse");
    const warehouses = await Warehouse.find({ region: region });

    console.log(`🏪 Tìm thấy ${warehouses.length} kho trong vùng ${region}:`);
    for (const warehouse of warehouses) {
      console.log(
        `   • ${warehouse.name} - ${warehouse.province} (${warehouse.type})`
      );
    }

    // Test với một vài địa chỉ khác
    const testCases = [
      "Hà Nội",
      "Thành phố Hà Nội",
      "TP Hà Nội",
      "Thành phố Hồ Chí Minh",
      "TP.HCM",
      "Đà Nẵng",
    ];

    console.log("\n🧪 TEST NHIỀU ĐỊA CHỈ:");
    for (const addr of testCases) {
      const reg = getRegionByProvince(addr);
      console.log(`"${addr}" → ${reg}`);
    }
  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Đã đóng kết nối");
  }
}

testOrderAssignment();

/**
 * Script kiểm tra và sửa lỗi gán kho theo vùng địa lý
 * Chạy: node fix_warehouse_assignment.js
 */

const mongoose = require("mongoose");
require("dotenv").config();

const Warehouse = require("./src/app/models/Warehouse");
const DonHang = require("./src/app/models/DonHang");
const { getRegionByProvince } = require("./src/util/regions");

async function fixWarehouseAssignment() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/doan"
    );
    console.log("✅ Đã kết nối MongoDB");

    console.log("\n🔍 KIỂM TRA DANH SÁCH KHO HIỆN TẠI:");
    const warehouses = await Warehouse.find({});

    for (const warehouse of warehouses) {
      console.log(`📦 Kho: ${warehouse.name}`);
      console.log(`   - Tỉnh: ${warehouse.province}`);
      console.log(`   - Vùng trong DB: ${warehouse.region}`);

      // Kiểm tra vùng theo logic mới
      const calculatedRegion = getRegionByProvince(warehouse.province);
      console.log(`   - Vùng tính toán: ${calculatedRegion}`);

      if (
        warehouse.region !== calculatedRegion &&
        calculatedRegion !== "Không xác định"
      ) {
        console.log(
          `   ⚠️  KHÔNG KHỚP! Cần cập nhật từ "${warehouse.region}" → "${calculatedRegion}"`
        );
      } else {
        console.log(`   ✅ Khớp!`);
      }
      console.log("─".repeat(50));
    }

    console.log("\n🔍 KIỂM TRA ĐƠN HÀNG BỊ GÁN SAI:");
    // Tìm đơn hàng có vấn đề (đơn hàng Hà Nội gán kho TP.HCM)
    const problematicOrders = await DonHang.find({
      "addressDetail.province.name": { $regex: "Hà Nội", $options: "i" },
    })
      .populate("warehouseId")
      .limit(5);

    for (const order of problematicOrders) {
      if (order.warehouseId) {
        console.log(`📋 Đơn hàng: ${order._id}`);
        console.log(`   - Địa chỉ: ${order.address}`);
        console.log(
          `   - Tỉnh đơn hàng: ${order.addressDetail?.province?.name}`
        );
        console.log(`   - Kho được gán: ${order.warehouseId.name}`);
        console.log(`   - Tỉnh kho: ${order.warehouseId.province}`);

        const orderRegion = getRegionByProvince(
          order.addressDetail?.province?.name || ""
        );
        const warehouseRegion = getRegionByProvince(order.warehouseId.province);

        if (orderRegion !== warehouseRegion) {
          console.log(
            `   ❌ VẤN ĐỀ: Đơn hàng ${orderRegion} được gán kho ${warehouseRegion}!`
          );
        } else {
          console.log(`   ✅ OK: Cùng vùng`);
        }
        console.log("─".repeat(50));
      }
    }

    console.log("\n🎯 TEST LOGIC TÌM KHO MỚI:");
    // Test với một số địa chỉ mẫu
    const testAddresses = [
      { province: "Hà Nội", expected: "Miền Bắc" },
      { province: "Thành phố Hà Nội", expected: "Miền Bắc" },
      { province: "Thành phố Hồ Chí Minh", expected: "Miền Nam" },
      { province: "TP Hồ Chí Minh", expected: "Miền Nam" },
      { province: "Đà Nẵng", expected: "Miền Trung" },
    ];

    for (const addr of testAddresses) {
      const result = getRegionByProvince(addr.province);
      console.log(
        `📍 "${addr.province}" → ${result} ${result === addr.expected ? "✅" : "❌"}`
      );
    }

    console.log("\n📊 THỐNG KÊ KHO THEO VÙNG:");
    const warehouseStats = await Warehouse.aggregate([
      {
        $group: {
          _id: "$region",
          count: { $sum: 1 },
          warehouses: { $push: "$name" },
        },
      },
    ]);

    for (const stat of warehouseStats) {
      console.log(`🏪 ${stat._id}: ${stat.count} kho`);
      for (const name of stat.warehouses) {
        console.log(`   • ${name}`);
      }
    }
  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Đã đóng kết nối");
  }
}

fixWarehouseAssignment();

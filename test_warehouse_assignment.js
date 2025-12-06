/**
 * Test script để kiểm tra thuật toán gán shipper theo kho và vùng địa lý
 * Chạy lệnh: node test_warehouse_assignment.js
 */

const mongoose = require("mongoose");
require("dotenv").config();

// Import models
const User = require("./src/app/models/User");
const DonHang = require("./src/app/models/DonHang");
const Warehouse = require("./src/app/models/Warehouse");
const DonHangController = require("./src/app/controllers/DonHangController");

async function testWarehouseAssignment() {
  try {
    // Kết nối database
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/doan",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("✅ Đã kết nối MongoDB");

    // Test case 1: Kiểm tra khả năng gán shipper cho đơn hàng
    console.log("\n🧪 TEST CASE 1: Kiểm tra gán shipper theo vùng địa lý");

    const testOrders = await DonHang.find({
      assignedShipper: null,
      status: "Chờ xác nhận",
    })
      .populate("warehouseId")
      .limit(3);

    if (testOrders.length === 0) {
      console.log("ℹ️ Không có đơn hàng nào để test");
      return;
    }

    for (const order of testOrders) {
      console.log(`\n📦 Đang test đơn hàng ${order._id}:`);
      console.log(`- Địa chỉ: ${order.address}`);
      console.log(`- Tỉnh: ${order.addressDetail?.province?.name || "N/A"}`);
      console.log(`- Kho được gán: ${order.warehouseId?.name || "N/A"}`);
      console.log(`- Tỉnh kho: ${order.warehouseId?.province || "N/A"}`);

      // Kiểm tra tồn kho
      const hasStock = await DonHangController.checkWarehouseStock(
        order.warehouseId._id,
        order.items
      );
      console.log(
        `- Trạng thái tồn kho: ${hasStock ? "✅ Đủ hàng" : "❌ Không đủ hàng"}`
      );

      if (hasStock) {
        // Tìm shipper khả dụng
        const availableShippers =
          await DonHangController.findShippersByLocation(
            order.addressDetail?.province?.name || "",
            order.addressDetail?.district?.name || "",
            order.warehouseId.province
          );

        console.log(`- Shipper khả dụng: ${availableShippers.length}`);

        if (availableShippers.length > 0) {
          console.log(`- Danh sách shipper:`);
          for (const shipper of availableShippers.slice(0, 3)) {
            console.log(
              `  • ${shipper.name} (${shipper.province}) - Trạng thái: ${shipper.status}`
            );
          }

          // Gợi ý shipper tốt nhất
          const bestShipper = await DonHangController.suggestBestShipper(
            order._id
          );
          if (bestShipper) {
            console.log(
              `🎯 Shipper được gợi ý: ${bestShipper.name} (${bestShipper.province})`
            );
          }
        }
      }

      console.log("─".repeat(50));
    }

    // Test case 2: Thống kê tổng quan
    console.log("\n📊 THỐNG KÊ TỔNG QUAN:");

    const totalOrders = await DonHang.countDocuments();
    const pendingOrders = await DonHang.countDocuments({
      assignedShipper: null,
      status: { $in: ["Chờ xác nhận", "Chờ thanh toán"] },
    });
    const activeShippers = await User.countDocuments({
      role: "shipper",
      status: "Hoạt động",
    });
    const warehouses = await Warehouse.countDocuments();

    console.log(`- Tổng số đơn hàng: ${totalOrders}`);
    console.log(`- Đơn hàng chưa gán shipper: ${pendingOrders}`);
    console.log(`- Shipper đang hoạt động: ${activeShippers}`);
    console.log(`- Số kho hàng: ${warehouses}`);

    // Test case 3: Kiểm tra phân bố shipper theo tỉnh
    console.log("\n🗺️ PHÂN BỐ SHIPPER THEO TỈNH:");
    const shippersByProvince = await User.aggregate([
      { $match: { role: "shipper", status: "Hoạt động" } },
      { $group: { _id: "$province", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    for (const item of shippersByProvince) {
      console.log(`- ${item._id}: ${item.count} shipper`);
    }

    console.log("\n✅ Hoàn thành test!");
  } catch (error) {
    console.error("❌ Lỗi trong quá trình test:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Đã đóng kết nối MongoDB");
  }
}

// Chạy test
testWarehouseAssignment();

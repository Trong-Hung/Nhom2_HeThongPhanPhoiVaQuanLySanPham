// 🔍 QUICK DEBUG SCRIPT - Kiểm tra routeOrder
const mongoose = require("mongoose");

// Import models
const DonHang = require("./src/app/models/DonHang.js");

async function quickDebug() {
  try {
    // Connect to MongoDB
    await mongoose.connect("mongodb://localhost:27017/blog");
    console.log("✅ Connected to MongoDB\n");

    // Find shipping orders with problematic routeOrder
    const shippingOrders = await DonHang.find({
      status: "Đang vận chuyển",
    }).populate("assignedShipper", "hoTen");

    console.log(`📦 Đơn hàng đang vận chuyển: ${shippingOrders.length}`);

    // Group by shipper
    const byShipper = {};
    shippingOrders.forEach((order) => {
      const shipperId = order.assignedShipper?._id?.toString() || "undefined";
      if (!byShipper[shipperId]) {
        byShipper[shipperId] = [];
      }
      byShipper[shipperId].push(order);
    });

    // Check each shipper
    Object.entries(byShipper).forEach(([shipperId, orders]) => {
      const shipperName = orders[0]?.assignedShipper?.hoTen || "Unknown";
      console.log(`\n👤 ${shipperName} (${shipperId.slice(-6)}):`);

      orders.forEach((order) => {
        const orderId = order._id.toString().slice(-6);
        const routeOrder = order.routeOrder || "null";
        console.log(`  📦 ${orderId}: routeOrder=${routeOrder}`);
      });

      // Check if single order has wrong routeOrder
      if (
        orders.length === 1 &&
        orders[0].routeOrder &&
        orders[0].routeOrder !== 1
      ) {
        console.log(
          `  🚨 BUG: Chỉ 1 đơn nhưng routeOrder = ${orders[0].routeOrder}`
        );
      }
    });

    console.log("\n📋 SUMMARY:");
    console.log(`- Total shipping orders: ${shippingOrders.length}`);
    console.log(`- Shippers with orders: ${Object.keys(byShipper).length}`);

    await mongoose.disconnect();
    console.log("\n✅ Debug complete");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

quickDebug();

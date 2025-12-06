// 🔍 SIMPLE DEBUG - Kiểm tra routeOrder issue
const mongoose = require("mongoose");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/blog");

// Simple debug function
async function checkRouteOrders() {
  console.log("\n🔍 CHECKING ROUTE ORDER ISSUE\n");

  try {
    // Direct mongoose query
    const DonHang = mongoose.model("DonHang");

    // Find orders with problematic routeOrder
    const shippingOrders = await DonHang.find({
      status: "Đang vận chuyển",
    }).select("_id assignedShipper status routeOrder diaChiGiaoHang");

    console.log(`📦 Tổng đơn hàng đang vận chuyển: ${shippingOrders.length}`);

    // Group by shipper
    const ordersByShipper = {};
    shippingOrders.forEach((order) => {
      const shipperId = order.assignedShipper?.toString() || "undefined";
      if (!ordersByShipper[shipperId]) {
        ordersByShipper[shipperId] = [];
      }
      ordersByShipper[shipperId].push(order);
    });

    // Check each shipper
    Object.entries(ordersByShipper).forEach(([shipperId, orders]) => {
      console.log(`\n👤 Shipper ${shipperId}:`);

      orders.forEach((order) => {
        const orderId = order._id.toString().slice(-6);
        const routeOrder = order.routeOrder || "null";
        console.log(
          `  - ${orderId}: routeOrder=${routeOrder} (${order.diaChiGiaoHang?.slice(0, 50)}...)`
        );
      });

      // Check for issues
      if (orders.length === 1 && orders[0].routeOrder !== 1) {
        console.log(
          `  🚨 ISSUE: Chỉ có 1 đơn nhưng routeOrder = ${orders[0].routeOrder}!`
        );
      }
    });

    // Quick fix function
    console.log("\n🔧 FIXING ROUTE ORDERS...");

    for (const [shipperId, orders] of Object.entries(ordersByShipper)) {
      // Reset all first
      await DonHang.updateMany(
        { assignedShipper: shipperId },
        { $unset: { routeOrder: 1 } }
      );

      // Reassign sequential numbers
      for (let i = 0; i < orders.length; i++) {
        await DonHang.updateOne(
          { _id: orders[i]._id },
          {
            routeOrder: i + 1,
            optimizedAt: new Date(),
          }
        );
      }

      console.log(`✅ Fixed ${orders.length} orders for shipper ${shipperId}`);
    }

    console.log("\n🎉 Route order fix completed!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the check
checkRouteOrders();

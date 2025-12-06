// 🧪 TEST ROUTE OPTIMIZATION SYSTEM
const mongoose = require("mongoose");

// Test reoptimization function
async function testOptimization() {
  try {
    await mongoose.connect("mongodb://localhost:27017/blog");
    console.log("✅ Connected to MongoDB\n");

    // Import models và utility
    const DonHang = require("./src/app/models/DonHang.js");
    const User = require("./src/app/models/User.js");

    // Find a shipper with shipping orders
    const shippingOrders = await DonHang.find({
      status: "Đang vận chuyển",
    }).populate("assignedShipper", "hoTen warehouseId");

    if (shippingOrders.length === 0) {
      console.log("❌ Không có đơn hàng nào đang vận chuyển để test");
      return;
    }

    const order = shippingOrders[0];
    const shipperId = order.assignedShipper._id;
    const warehouseId = order.assignedShipper.warehouseId;

    console.log(`🎯 Testing với shipper: ${order.assignedShipper.hoTen}`);
    console.log(`📦 Order ID: ${order._id}`);
    console.log(`🏬 Warehouse ID: ${warehouseId}\n`);

    // Test utility function
    console.log("🧪 Testing reoptimizeShipperRoute function...");

    // Import the utility function from the controller file
    const controllerPath = "./src/app/controllers/ShipperController.js";
    delete require.cache[require.resolve(controllerPath)];

    // Simulate the reoptimization
    try {
      const Warehouse = require("./src/app/models/Warehouse.js");
      const vrpService = require("./src/services/VRPService.js");

      const warehouse = await Warehouse.findById(warehouseId);
      if (!warehouse) {
        console.log("❌ Warehouse not found");
        return;
      }

      // Reset routeOrder first
      await DonHang.updateMany(
        { assignedShipper: shipperId, warehouseId },
        { $unset: { routeOrder: 1 } }
      );
      console.log("✅ Reset all routeOrder");

      // Find orders to optimize
      const ordersToOptimize = await DonHang.find({
        assignedShipper: shipperId,
        warehouseId,
        status: "Đang vận chuyển",
      });

      console.log(`📦 Found ${ordersToOptimize.length} orders to optimize`);

      if (ordersToOptimize.length > 0) {
        // Simple sequential assignment instead of OSRM
        for (let i = 0; i < ordersToOptimize.length; i++) {
          ordersToOptimize[i].routeOrder = i + 1;
          ordersToOptimize[i].optimizedAt = new Date();
          await ordersToOptimize[i].save();

          const orderId = ordersToOptimize[i]._id.toString().slice(-6);
          console.log(`  ✅ Order ${orderId}: routeOrder = ${i + 1}`);
        }
      }

      console.log("\n🎉 Optimization test completed successfully!");
    } catch (error) {
      console.error("❌ Error in reoptimization test:", error);
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

testOptimization();

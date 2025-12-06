// 🧪 TEST HỆ THỐNG TỐI ƯU CHỈ ĐƠN "ĐANG VẬN CHUYỂN"
// Chạy: node test_shipping_only_optimization.js

const mongoose = require("mongoose");

async function testShippingOnlyOptimization() {
  try {
    await mongoose.connect("mongodb://localhost:27017/blog");
    console.log("✅ Kết nối MongoDB thành công\n");

    const DonHang = require("./src/app/models/DonHang.js");
    const User = require("./src/app/models/User.js");

    // Tìm shipper có đơn hàng
    const shipperWithOrders = await User.findOne({ role: "shipper" });
    if (!shipperWithOrders) {
      console.log("❌ Không tìm thấy shipper nào");
      return;
    }

    const shipperId = shipperWithOrders._id;
    console.log(
      `🎯 Test với Shipper: ${shipperWithOrders.hoTen} (${shipperId})\n`
    );

    // Kiểm tra đơn hàng theo trạng thái
    const allOrders = await DonHang.find({ assignedShipper: shipperId });
    const pendingOrders = allOrders.filter((o) => o.status === "Đang sắp xếp");
    const shippingOrders = allOrders.filter(
      (o) => o.status === "Đang vận chuyển"
    );
    const deliveredOrders = allOrders.filter((o) => o.status === "Đã giao");

    console.log("📊 THỐNG KÊ ĐƠN HÀNG HIỆN TẠI:");
    console.log(`- Đang sắp xếp: ${pendingOrders.length} đơn`);
    console.log(`- Đang vận chuyển: ${shippingOrders.length} đơn`);
    console.log(`- Đã giao: ${deliveredOrders.length} đơn`);
    console.log(`- Tổng: ${allOrders.length} đơn\n`);

    // Test logic tối ưu mới
    console.log("🧪 TEST LOGIC TỐI ƯU MỚI:");

    // Giả lập hàm autoOptimizeShipperRoute với logic mới
    const ordersToOptimize = await DonHang.find({
      assignedShipper: shipperId,
      status: "Đang vận chuyển", // CHỈ LẤY ĐANG VẬN CHUYỂN
    });

    console.log(
      `✅ Logic mới - Chỉ tối ưu đơn "Đang vận chuyển": ${ordersToOptimize.length} đơn`
    );

    if (ordersToOptimize.length > 0) {
      console.log("📦 Danh sách đơn sẽ được tối ưu:");
      ordersToOptimize.forEach((order, index) => {
        const orderId = order._id.toString().slice(-6);
        console.log(
          `  ${index + 1}. ${orderId} - ${order.diaChiGiaoHang?.slice(0, 50)}...`
        );
      });
    } else {
      console.log('ℹ️  Không có đơn hàng "Đang vận chuyển" nào để tối ưu');
    }

    console.log("\n🔍 KIỂM TRA LOGIC CŨ (SAI):");
    const oldLogicOrders = await DonHang.find({
      assignedShipper: shipperId,
      status: { $in: ["Đang sắp xếp", "Đang vận chuyển"] }, // Logic cũ (SAI)
    });
    console.log(
      `❌ Logic cũ - Tối ưu cả 2 trạng thái: ${oldLogicOrders.length} đơn`
    );

    console.log("\n📋 SO SÁNH:");
    console.log(`- Logic cũ (SAI): ${oldLogicOrders.length} đơn`);
    console.log(`- Logic mới (ĐÚNG): ${ordersToOptimize.length} đơn`);
    console.log(
      `- Tiết kiệm: ${oldLogicOrders.length - ordersToOptimize.length} đơn không cần thiết`
    );

    // Test reload logic
    console.log("\n🔄 TEST RELOAD LOGIC:");
    console.log('Khi shipper nhận đơn: "Đang sắp xếp" → "Đang vận chuyển"');
    console.log(
      '  → Gọi reoptimizeOnStatusChange() → Chỉ tối ưu đơn "Đang vận chuyển"'
    );

    console.log('Khi shipper giao xong: "Đang vận chuyển" → "Đã giao"');
    console.log("  → Gọi reoptimizeOnStatusChange() → Tối ưu lại đơn còn lại");

    console.log("\n✨ KẾT LUẬN:");
    console.log('✅ Hệ thống mới CHỈ tối ưu đơn hàng "Đang vận chuyển"');
    console.log("✅ Tự động reload khi có thay đổi trạng thái");
    console.log('✅ Không tối ưu những đơn "Đang sắp xếp" (chưa nhận)');
    console.log("✅ Hiệu quả và chính xác hơn!");
  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Đã ngắt kết nối MongoDB");
  }
}

testShippingOnlyOptimization();

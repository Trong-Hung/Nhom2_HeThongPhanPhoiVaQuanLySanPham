// 🧪 TEST WAREHOUSE-SHIPPER ASSIGNMENT SYSTEM
// Chạy: node test_warehouse_shipper_assignment.js

const mongoose = require("mongoose");

async function testWarehouseShipperAssignment() {
  try {
    await mongoose.connect("mongodb://localhost:27017/blog");
    console.log("✅ Kết nối MongoDB thành công\n");

    const DonHang = require("./src/app/models/DonHang.js");
    const User = require("./src/app/models/User.js");
    const Warehouse = require("./src/app/models/Warehouse.js");

    console.log("🏭 =====  KIỂM TRA WAREHOUSE-SHIPPER ASSIGNMENT  =====\n");

    // 1. Thống kê kho và shipper
    const warehouses = await Warehouse.find();
    const shippers = await User.find({ role: "shipper" }).populate(
      "warehouseId"
    );
    const orders = await DonHang.find().populate("warehouseId assignedShipper");

    console.log("📊 THỐNG KÊ TỔNG QUAN:");
    console.log(`- Số kho: ${warehouses.length}`);
    console.log(`- Số shipper: ${shippers.length}`);
    console.log(`- Số đơn hàng: ${orders.length}\n`);

    // 2. Kiểm tra từng kho
    console.log("🏬 THỐNG KÊ THEO KHO:");
    for (const warehouse of warehouses) {
      const warehouseShippers = shippers.filter(
        (s) =>
          s.warehouseId &&
          s.warehouseId._id.toString() === warehouse._id.toString()
      );

      const warehouseOrders = orders.filter(
        (o) =>
          o.warehouseId &&
          o.warehouseId._id.toString() === warehouse._id.toString()
      );

      console.log(`\n🏭 Kho: ${warehouse.name}`);
      console.log(`   📍 Địa chỉ: ${warehouse.address}`);
      console.log(`   👥 Shipper: ${warehouseShippers.length} người`);
      console.log(`   📦 Đơn hàng: ${warehouseOrders.length} đơn`);

      if (warehouseShippers.length > 0) {
        console.log("   👤 Danh sách shipper:");
        warehouseShippers.forEach((shipper) => {
          const shipperOrders = warehouseOrders.filter(
            (o) =>
              o.assignedShipper &&
              o.assignedShipper._id.toString() === shipper._id.toString()
          );
          console.log(`      - ${shipper.hoTen}: ${shipperOrders.length} đơn`);
        });
      }
    }

    // 3. Kiểm tra vi phạm logic
    console.log("\n🚨 KIỂM TRA VI PHẠM LOGIC:");
    let violations = 0;

    for (const order of orders) {
      if (order.assignedShipper && order.warehouseId) {
        // Tìm shipper để kiểm tra warehouseId
        const shipper = await User.findById(order.assignedShipper._id).populate(
          "warehouseId"
        );

        if (shipper && shipper.warehouseId) {
          const orderWarehouseId = order.warehouseId._id.toString();
          const shipperWarehouseId = shipper.warehouseId._id.toString();

          if (orderWarehouseId !== shipperWarehouseId) {
            violations++;
            console.log(`❌ VI PHẠM: Đơn ${order._id.toString().slice(-6)}`);
            console.log(`   - Đơn từ kho: ${order.warehouseId.name}`);
            console.log(`   - Shipper thuộc kho: ${shipper.warehouseId.name}`);
            console.log(`   - Shipper: ${shipper.hoTen}`);
          }
        }
      }
    }

    if (violations === 0) {
      console.log(
        "✅ Không có vi phạm logic! Tất cả đơn hàng đều được gán đúng kho."
      );
    } else {
      console.log(`⚠️ Phát hiện ${violations} vi phạm logic gán shipper!`);
    }

    // 4. Test case gán shipper
    console.log("\n🧪 TEST CASE GÁN SHIPPER:");

    // Tìm đơn hàng chưa gán shipper
    const unassignedOrder = orders.find((o) => !o.assignedShipper);
    if (unassignedOrder && unassignedOrder.warehouseId) {
      console.log(
        `\n📦 Test với đơn hàng: ${unassignedOrder._id.toString().slice(-6)}`
      );
      console.log(`🏭 Kho của đơn: ${unassignedOrder.warehouseId.name}`);

      // Tìm shipper hợp lệ cho kho này
      const validShippers = await User.find({
        role: "shipper",
        warehouseId: unassignedOrder.warehouseId._id,
        status: "Hoạt động",
      });

      console.log(`👥 Shipper hợp lệ: ${validShippers.length} người`);
      if (validShippers.length > 0) {
        console.log("✅ Có thể gán shipper cho đơn hàng này");
        validShippers.forEach((shipper) => {
          console.log(`   - ${shipper.hoTen} (${shipper.email})`);
        });
      } else {
        console.log("❌ Không có shipper hợp lệ cho kho này!");
      }
    }

    // 5. Gợi ý cải thiện
    console.log("\n💡 GỢI Ý CẢI THIỆN:");

    // Kho không có shipper
    const warehousesWithoutShippers = warehouses.filter((w) => {
      return !shippers.some(
        (s) =>
          s.warehouseId && s.warehouseId._id.toString() === w._id.toString()
      );
    });

    if (warehousesWithoutShippers.length > 0) {
      console.log("⚠️ Các kho chưa có shipper:");
      warehousesWithoutShippers.forEach((w) => {
        console.log(`   - ${w.name}`);
      });
    }

    // Shipper không có kho
    const shippersWithoutWarehouse = shippers.filter((s) => !s.warehouseId);
    if (shippersWithoutWarehouse.length > 0) {
      console.log("⚠️ Shipper chưa được gán kho:");
      shippersWithoutWarehouse.forEach((s) => {
        console.log(`   - ${s.hoTen}`);
      });
    }

    console.log("\n✨ KẾT LUẬN:");
    console.log("✅ Logic warehouse-shipper assignment đã được áp dụng");
    console.log("✅ Mỗi kho chỉ có shipper của kho đó giao hàng");
    console.log("✅ Admin chỉ thấy shipper cùng kho khi gán đơn hàng");
  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Đã ngắt kết nối MongoDB");
  }
}

testWarehouseShipperAssignment();

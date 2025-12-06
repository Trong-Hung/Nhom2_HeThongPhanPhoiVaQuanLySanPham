// Kiểm tra Warehouse trong database
const mongoose = require("mongoose");

async function checkWarehouse() {
  try {
    await mongoose.connect("mongodb://localhost:27017/blog");
    console.log("✅ Kết nối MongoDB thành công");

    const Warehouse = require("./src/app/models/Warehouse.js");
    const DonHang = require("./src/app/models/DonHang.js");

    // Kiểm tra warehouses
    const warehouses = await Warehouse.find();
    console.log(`📦 Số warehouse: ${warehouses.length}`);

    if (warehouses.length > 0) {
      console.log("Warehouses:");
      warehouses.forEach((w) => {
        console.log(`- ${w.name} (${w._id})`);
      });
    } else {
      console.log("❌ Không có warehouse nào trong database!");

      // Tạo warehouse mẫu
      const sampleWarehouse = new Warehouse({
        name: "Kho Hà Nội",
        address: "Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội",
        province: "Hà Nội",
        district: "Hai Bà Trưng",
        ward: "Bách Khoa",
        region: "Bắc",
        type: "central",
        location: {
          latitude: 21.0285,
          longitude: 105.8542,
        },
      });

      await sampleWarehouse.save();
      console.log("✅ Đã tạo warehouse mẫu");
    }

    // Kiểm tra đơn hàng có warehouseId
    const ordersWithWarehouse = await DonHang.countDocuments({
      warehouseId: { $exists: true },
    });
    const ordersWithoutWarehouse = await DonHang.countDocuments({
      warehouseId: { $exists: false },
    });

    console.log(`📋 Đơn hàng có warehouseId: ${ordersWithWarehouse}`);
    console.log(`📋 Đơn hàng không có warehouseId: ${ordersWithoutWarehouse}`);

    // Nếu có đơn hàng không có warehouseId, gán cho warehouse đầu tiên
    if (ordersWithoutWarehouse > 0 && warehouses.length > 0) {
      await DonHang.updateMany(
        { warehouseId: { $exists: false } },
        { warehouseId: warehouses[0]._id }
      );
      console.log(
        `✅ Đã gán ${ordersWithoutWarehouse} đơn hàng cho warehouse: ${warehouses[0].name}`
      );
    }

    // Test populate
    const testOrder = await DonHang.findOne().populate("warehouseId");
    if (testOrder) {
      console.log(
        `✅ Test populate thành công: ${testOrder.warehouseId?.name || "Không có warehouse"}`
      );
    }
  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await mongoose.disconnect();
  }
}

checkWarehouse();

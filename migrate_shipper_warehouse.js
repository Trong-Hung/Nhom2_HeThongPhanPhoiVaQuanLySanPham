// Migration: Gán warehouseId cho các shipper hiện có
const mongoose = require("mongoose");

async function migrateShipperWarehouse() {
  try {
    await mongoose.connect("mongodb://localhost:27017/blog");
    console.log("✅ Kết nối MongoDB thành công");

    const User = require("./src/app/models/User.js");
    const Warehouse = require("./src/app/models/Warehouse.js");

    // Lấy tất cả warehouses
    const warehouses = await Warehouse.find();
    console.log(`📦 Tìm thấy ${warehouses.length} warehouses`);

    // Tạo mapping region -> warehouse
    const regionWarehouseMap = {
      "Miền Bắc": warehouses.find((w) => w.region === "Bắc"),
      "Miền Trung": warehouses.find((w) => w.region === "Trung"),
      "Miền Nam": warehouses.find((w) => w.region === "Nam"),
    };

    console.log("🗺️ Region-Warehouse mapping:");
    Object.entries(regionWarehouseMap).forEach(([region, warehouse]) => {
      console.log(`- ${region}: ${warehouse?.name || "Không tìm thấy"}`);
    });

    // Lấy tất cả shipper
    const shippers = await User.find({ role: "shipper" });
    console.log(`👥 Tìm thấy ${shippers.length} shippers`);

    let updated = 0;
    for (const shipper of shippers) {
      if (!shipper.warehouseId && shipper.region) {
        const warehouse = regionWarehouseMap[shipper.region];
        if (warehouse) {
          await User.findByIdAndUpdate(shipper._id, {
            warehouseId: warehouse._id,
          });
          console.log(
            `✅ Gán ${shipper.email} (${shipper.region}) -> ${warehouse.name}`
          );
          updated++;
        } else {
          console.log(
            `❌ Không tìm thấy warehouse cho region: ${shipper.region}`
          );
        }
      } else if (shipper.warehouseId) {
        console.log(`⏭️ ${shipper.email} đã có warehouseId`);
      }
    }

    console.log(`\n🎉 Migration hoàn thành! Đã cập nhật ${updated} shippers`);

    // Kiểm tra kết quả
    const updatedShippers = await User.find({ role: "shipper" }).populate(
      "warehouseId"
    );
    console.log("\n📋 KẾT QUẢ SAU MIGRATION:");
    updatedShippers.forEach((shipper) => {
      console.log(
        `- ${shipper.email}: ${shipper.warehouseId?.name || "CHƯA CÓ WAREHOUSE"}`
      );
    });
  } catch (error) {
    console.error("❌ Lỗi migration:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Đã ngắt kết nối MongoDB");
  }
}

migrateShipperWarehouse();

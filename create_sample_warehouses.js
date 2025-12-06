/**
 * Script tạo kho mẫu cho hệ thống
 * Chạy: node create_sample_warehouses.js
 */

const mongoose = require("mongoose");
require("dotenv").config();

const Warehouse = require("./src/app/models/Warehouse");
const Sanpham = require("./src/app/models/Sanpham");

async function createSampleWarehouses() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/doan"
    );
    console.log("✅ Đã kết nối MongoDB");

    // Lấy danh sách sản phẩm để thêm vào kho
    const products = await Sanpham.find({}).limit(10);
    if (products.length === 0) {
      console.log(
        "⚠️ Không có sản phẩm nào trong database. Vui lòng tạo sản phẩm trước."
      );
      return;
    }

    console.log(`📦 Tìm thấy ${products.length} sản phẩm để thêm vào kho`);

    // Tạo danh sách sản phẩm cho kho
    const warehouseProducts = products.map((product) => ({
      productId: product._id,
      quantity: Math.floor(Math.random() * 100) + 50, // Random từ 50-150
    }));

    // Danh sách kho cần tạo
    const warehousesToCreate = [
      {
        name: "Kho Miền Bắc - Hà Nội",
        address: "123 Đường Láng, Đống Đa, Hà Nội",
        province: "Hà Nội",
        district: "Đống Đa",
        ward: "Láng Thượng",
        region: "Miền Bắc",
        type: "regional",
        location: {
          latitude: 21.0285,
          longitude: 105.8542,
        },
        products: warehouseProducts,
      },
      {
        name: "Kho Miền Nam - TP.HCM",
        address: "456 Nguyễn Văn Cừ, Quận 5, TP.HCM",
        province: "Thành phố Hồ Chí Minh",
        district: "Quận 5",
        ward: "Phường 1",
        region: "Miền Nam",
        type: "regional",
        location: {
          latitude: 10.7769,
          longitude: 106.7009,
        },
        products: warehouseProducts,
      },
      {
        name: "Kho Miền Trung - Đà Nẵng",
        address: "789 Lê Duẩn, Hải Châu, Đà Nẵng",
        province: "Đà Nẵng",
        district: "Hải Châu",
        ward: "Hải Châu I",
        region: "Miền Trung",
        type: "regional",
        location: {
          latitude: 16.0471,
          longitude: 108.2068,
        },
        products: warehouseProducts,
      },
      {
        name: "HUB Trung tâm",
        address: "999 Quốc lộ 1A, Biên Hòa, Đồng Nai",
        province: "Đồng Nai",
        district: "Biên Hòa",
        ward: "Trung Dũng",
        region: "Miền Nam",
        type: "central",
        location: {
          latitude: 10.951,
          longitude: 106.8439,
        },
        products: warehouseProducts.map((p) => ({
          ...p,
          quantity: p.quantity * 3,
        })), // Kho trung tâm nhiều hàng hơn
      },
    ];

    // Xóa kho cũ nếu có
    await Warehouse.deleteMany({});
    console.log("🗑️ Đã xóa kho cũ");

    // Tạo kho mới
    for (const warehouseData of warehousesToCreate) {
      const warehouse = new Warehouse(warehouseData);
      await warehouse.save();
      console.log(`✅ Đã tạo kho: ${warehouse.name} (${warehouse.region})`);
    }

    console.log("\n📊 THỐNG KÊ KHO ĐÃ TẠO:");
    const warehouses = await Warehouse.find({});
    for (const warehouse of warehouses) {
      console.log(`🏪 ${warehouse.name}`);
      console.log(`   - Địa chỉ: ${warehouse.address}`);
      console.log(`   - Vùng: ${warehouse.region} (${warehouse.type})`);
      console.log(`   - Sản phẩm: ${warehouse.products.length}`);
      console.log("─".repeat(50));
    }

    console.log("\n🎉 Hoàn thành tạo kho mẫu!");
  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Đã đóng kết nối");
  }
}

createSampleWarehouses();

// Kiểm tra dữ liệu warehouse và tạo shipper test
const mongoose = require("mongoose");

async function checkAndCreateTestData() {
  try {
    await mongoose.connect("mongodb://localhost:27017/blog");
    console.log("✅ Kết nối MongoDB thành công");

    const User = require("./src/app/models/User.js");
    const Warehouse = require("./src/app/models/Warehouse.js");

    // Kiểm tra warehouses hiện có
    const warehouses = await Warehouse.find();
    console.log("\n📦 WAREHOUSES HIỆN CÓ:");
    warehouses.forEach((w) => {
      console.log(`- ${w.name} | Region: "${w.region}" | Type: ${w.type}`);
    });

    // Kiểm tra users
    const users = await User.find({ role: "shipper" });
    console.log(`\n👥 Số shippers hiện có: ${users.length}`);

    if (users.length === 0) {
      console.log("\n🚀 Tạo shipper test...");

      // Tạo shipper test cho từng warehouse
      for (let i = 0; i < Math.min(3, warehouses.length); i++) {
        const warehouse = warehouses[i];
        const testShipper = new User({
          email: `shipper${i + 1}@test.com`,
          password: "hashedpassword",
          role: "shipper",
          status: "Hoạt động",
          phone: `090000000${i + 1}`,
          region:
            warehouse.region === "Bắc"
              ? "Miền Bắc"
              : warehouse.region === "Trung"
                ? "Miền Trung"
                : warehouse.region === "Nam"
                  ? "Miền Nam"
                  : "Miền Bắc",
          warehouseId: warehouse._id,
        });

        await testShipper.save();
        console.log(
          `✅ Tạo shipper: ${testShipper.email} -> ${warehouse.name}`
        );
      }
    }

    // Hiển thị kết quả cuối
    const finalShippers = await User.find({ role: "shipper" }).populate(
      "warehouseId"
    );
    console.log("\n📋 SHIPPER SAU KHI XỬ LÝ:");
    finalShippers.forEach((shipper) => {
      console.log(
        `- ${shipper.email}: ${shipper.warehouseId?.name || "CHƯA CÓ WAREHOUSE"}`
      );
    });
  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Đã ngắt kết nối MongoDB");
  }
}

checkAndCreateTestData();

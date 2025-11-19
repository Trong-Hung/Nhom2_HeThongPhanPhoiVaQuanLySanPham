const mongoose = require("mongoose");
const DonHang = require("./src/app/models/DonHang");

// MongoDB connection
mongoose
  .connect("mongodb://localhost:27017/f8_education_dev")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

(async () => {
  try {
    console.log("=== KIỂM TRA CẤU TRÚC DỮ LIỆU ĐƠN HÀNG ===");

    // Lấy một vài đơn hàng gần nhất
    const orders = await DonHang.find({}).limit(5).sort({ createdAt: -1 });

    console.log("Tìm thấy", orders.length, "đơn hàng");

    for (const order of orders) {
      console.log("\n--- Đơn hàng:", order._id.toString());
      console.log("customerAddress:", order.customerAddress);
      console.log("customerLocation type:", typeof order.customerLocation);
      console.log(
        "customerLocation value:",
        JSON.stringify(order.customerLocation, null, 2)
      );

      if (order.customerLocation) {
        console.log("Has lat?", "lat" in order.customerLocation);
        console.log("Has lng?", "lng" in order.customerLocation);
        console.log("Has latitude?", "latitude" in order.customerLocation);
        console.log("Has longitude?", "longitude" in order.customerLocation);

        // Check all properties
        console.log("All properties:", Object.keys(order.customerLocation));
      }
    }

    console.log("\n=== KIỂM TRA SCHEMA ===");
    const schema = DonHang.schema.paths.customerLocation;
    if (schema) {
      console.log("customerLocation schema:", schema);
    } else {
      console.log("Không tìm thấy customerLocation trong schema");
    }

    mongoose.disconnect();
  } catch (error) {
    console.error("Lỗi:", error);
    mongoose.disconnect();
  }
})();

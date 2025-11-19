const mongoose = require("mongoose");
const DonHang = require("./src/app/models/DonHang");

// MongoDB connection
mongoose
  .connect("mongodb://localhost:27017/f8_education_dev")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

(async () => {
  try {
    console.log("=== KIỂM TRA TỌA ĐỘ ĐƠN HÀNG ===");

    // Lấy tất cả đơn hàng có customerLocation
    const orders = await DonHang.find({
      customerLocation: { $exists: true, $ne: null },
    })
      .limit(15)
      .sort({ createdAt: -1 })
      .select("customerAddress customerLocation createdAt status");

    console.log("Tìm thấy", orders.length, "đơn hàng có tọa độ");

    if (orders.length === 0) {
      console.log("Không tìm thấy đơn hàng nào có tọa độ");
      console.log("\nKiểm tra tất cả đơn hàng...");

      const allOrders = await DonHang.find({})
        .limit(10)
        .select("customerAddress customerLocation createdAt");

      console.log("Tổng số đơn hàng:", allOrders.length);

      for (const order of allOrders) {
        console.log("--- Đơn hàng:", order._id.toString().substr(-6));
        console.log("Địa chỉ:", order.customerAddress);
        console.log("Có tọa độ:", order.customerLocation ? "Có" : "Không");
        if (order.customerLocation) {
          console.log(
            "Tọa độ:",
            order.customerLocation.lat,
            order.customerLocation.lng
          );
        }
        console.log("");
      }

      mongoose.disconnect();
      return;
    }

    // Tọa độ kho 908 PVD để so sánh
    const warehouseLat = 10.835067828591106;
    const warehouseLng = 106.73007578112086;

    function calculateDistance(lat1, lng1, lat2, lng2) {
      const R = 6371000; // Earth radius in meters
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLng = ((lng2 - lng1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    console.log("Tọa độ kho (908 PVD):", warehouseLat, warehouseLng);
    console.log("");

    let accurateCount = 0;
    let inaccurateCount = 0;

    for (const order of orders) {
      if (
        !order.customerLocation ||
        (!order.customerLocation.lat && !order.customerLocation.latitude)
      ) {
        console.log("--- Đơn hàng:", order._id.toString().substr(-6));
        console.log("Không có tọa độ hợp lệ");
        console.log("");
        continue;
      }

      const loc = order.customerLocation;
      // Support both lat/lng and latitude/longitude formats
      const lat = loc.lat || loc.latitude;
      const lng = loc.lng || loc.longitude;
      const distance = calculateDistance(warehouseLat, warehouseLng, lat, lng);

      console.log("--- Đơn hàng:", order._id.toString().substr(-6));
      console.log("Địa chỉ:", order.customerAddress);
      console.log("Tọa độ:", lat, lng);
      console.log("Khoảng cách từ kho:", Math.round(distance), "meters");
      console.log("Status:", order.status);

      if (distance > 50000) {
        // > 50km
        console.log("⚠️  CẢNH BÁO: Quá xa kho hàng! (Có thể sai tọa độ)");
        inaccurateCount++;
      } else if (distance > 30000) {
        // > 30km
        console.log("⚠️  Khá xa kho hàng (có thể cần kiểm tra)");
        inaccurateCount++;
      } else if (distance > 15000) {
        // > 15km
        console.log("ℹ️  Trong khu vực giao hàng rộng");
        accurateCount++;
      } else {
        console.log("✅ Gần kho hàng - tọa độ chính xác");
        accurateCount++;
      }
      console.log("");
    }

    console.log("=== THỐNG KÊ ===");
    console.log("Tọa độ chính xác:", accurateCount);
    console.log("Tọa độ cần kiểm tra:", inaccurateCount);
    console.log(
      "Tỷ lệ chính xác:",
      ((accurateCount / (accurateCount + inaccurateCount)) * 100).toFixed(1) +
        "%"
    );

    mongoose.disconnect();
  } catch (error) {
    console.error("Lỗi:", error);
    mongoose.disconnect();
  }
})();

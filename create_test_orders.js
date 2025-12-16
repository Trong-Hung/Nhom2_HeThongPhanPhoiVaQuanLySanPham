const mongoose = require("mongoose");
const DonHang = require("./src/app/models/DonHang");
const User = require("./src/app/models/User");
const Warehouse = require("./src/app/models/Warehouse");

// Kết nối MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/f8_education_dev", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createTestOrders() {
  try {
    // Tìm một user và warehouse để test
    const user = await User.findOne({ role: "user" });
    const warehouse = await Warehouse.findOne();

    if (!user || !warehouse) {
      console.log("❌ Không tìm thấy user hoặc warehouse để test");
      return;
    }

    console.log("👤 User test:", user.name);
    console.log("🏬 Warehouse test:", warehouse.name);

    // Tạo 3 đơn hàng mẫu với thời gian khác nhau
    const testOrders = [
      {
        userId: user._id,
        warehouseId: warehouse._id,
        name: user.name || "Nguyễn Văn A",
        phone: user.phone || "0123456789",
        email: user.email || "test@example.com",
        address: "123 Đường Test, Quận 1, TP.HCM",
        region: warehouse.region,
        items: [
          {
            _id: new mongoose.Types.ObjectId(),
            name: "Sản phẩm test 1",
            price: 150000,
            quantity: 2,
          },
          {
            _id: new mongoose.Types.ObjectId(),
            name: "Sản phẩm test 2",
            price: 200000,
            quantity: 1,
          },
        ],
        totalQuantity: 3,
        totalPrice: 500000,
        status: "Chờ xác nhận",
        paymentMethod: "cash",
        createdAt: new Date(), // Vừa tạo
      },
      {
        userId: user._id,
        warehouseId: warehouse._id,
        name: "Trần Thị B",
        phone: "0987654321",
        email: "tranb@example.com",
        address: "456 Đường Test 2, Quận 3, TP.HCM",
        region: warehouse.region,
        items: [
          {
            _id: new mongoose.Types.ObjectId(),
            name: "Sản phẩm premium",
            price: 800000,
            quantity: 1,
          },
        ],
        totalQuantity: 1,
        totalPrice: 800000,
        status: "Chờ xác nhận",
        paymentMethod: "momo",
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 phút trước
      },
      {
        userId: user._id,
        warehouseId: warehouse._id,
        name: "Lê Văn C",
        phone: "0333444555",
        email: "lec@example.com",
        address: "789 Đường Test 3, Quận 7, TP.HCM",
        region: warehouse.region,
        items: [
          {
            _id: new mongoose.Types.ObjectId(),
            name: "Combo sản phẩm",
            price: 300000,
            quantity: 2,
          },
          {
            _id: new mongoose.Types.ObjectId(),
            name: "Phụ kiện đi kèm",
            price: 100000,
            quantity: 3,
          },
        ],
        totalQuantity: 5,
        totalPrice: 900000,
        status: "Chờ xác nhận",
        paymentMethod: "cash",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 giờ trước
      },
    ];

    // Xóa đơn hàng test cũ nếu có
    await DonHang.deleteMany({
      name: { $in: ["Nguyễn Văn A", "Trần Thị B", "Lê Văn C"] },
      status: "Chờ xác nhận",
    });

    // Tạo đơn hàng mới
    const createdOrders = await DonHang.insertMany(testOrders);

    console.log(`✅ Đã tạo ${createdOrders.length} đơn hàng test thành công!`);
    createdOrders.forEach((order, index) => {
      console.log(
        `📦 Đơn ${index + 1}: ${order.name} - ${order.totalPrice.toLocaleString("vi-VN")}đ`
      );
    });

    console.log("\n🔔 Bây giờ bạn có thể test notification:");
    console.log("1. Đăng nhập bằng tài khoản admin");
    console.log("2. Xem icon chuông thông báo có chấm đỏ");
    console.log("3. Click vào chuông để xem modal đơn hàng mới");
  } catch (error) {
    console.error("❌ Lỗi tạo đơn hàng test:", error);
  } finally {
    mongoose.disconnect();
  }
}

// Chạy script
console.log("🚀 Bắt đầu tạo đơn hàng test...\n");
createTestOrders();

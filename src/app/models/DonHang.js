const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DonHangSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // 🔥 Liên kết với tài khoản người dùng
  assignedShipper: { type: Schema.Types.ObjectId, ref: "User", required: false }, // ✅ Nếu bắt buộc shipper, đặt `required: true`
  warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true }, // 🔥 Thêm kho xuất hàng
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  region: { type: String, required: true }, // 🔥 Xác định vùng miền để tối ưu vận chuyển
  items: [
    {
      _id: { type: Schema.Types.ObjectId, ref: "Sanpham", required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
    },
  ],
  totalQuantity: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ["Chờ thanh toán", "Chờ xác nhận", "Đang sắp xếp", "Đang vận chuyển", "Đã giao", "Đã hủy", "Hoàn thành"],
    default: "Chờ thanh toán", // 🔥 Đảm bảo trạng thái đúng khi vừa đặt hàng
  },
  cancelReason: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }, // ✅ Theo dõi cập nhật đơn hàng
});

module.exports = mongoose.model("DonHang", DonHangSchema);

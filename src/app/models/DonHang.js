const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DonHangSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // 🔥 Thêm userId để liên kết với tài khoản
   assignedShipper: { type: Schema.Types.ObjectId, ref: "User" },
  name: String,
  phone: String,
  address: String,
  region: { type: String, required: true },
  items: [
    {
      _id: { type: Schema.Types.ObjectId, ref: "Sanpham" },
      name: String,
      price: Number,
      quantity: Number,
    },
  ],
  totalQuantity: Number,
  totalPrice: Number,
  status: {
    type: String,
    enum: ["Chờ xác nhận", "Đang sắp xếp", "Đang vận chuyển", "Đã giao", "Đã hủy", "Hoàn thành"],
    default: "Chờ xác nhận",
  },
  cancelReason: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("DonHang", DonHangSchema);

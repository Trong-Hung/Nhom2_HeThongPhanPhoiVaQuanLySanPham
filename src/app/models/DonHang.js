const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DonHangSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, 
  assignedShipper: { type: Schema.Types.ObjectId, ref: "User", required: false },
  warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true }, 
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  region: { type: String, required: true }, 
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
    default: "Chờ thanh toán", 
  },
  estimatedDelivery: { type: Date },
  cancelReason: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }, 
});

module.exports = mongoose.model("DonHang", DonHangSchema);

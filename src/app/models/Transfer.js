const mongoose = require("mongoose");

const TransferSchema = new mongoose.Schema({
  transferId: { type: String, unique: true },
  sourceWarehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warehouse",
    required: true,
  },
  destinationWarehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warehouse",
    required: true,
  },

  // Thêm tọa độ destination để tối ưu route giống đơn hàng
  destinationLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
  },

  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sanpham",
        required: true,
      },
      quantity: { type: Number, required: true },
    },
  ],

  assignedShipper: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // === FIELDS CHO TỐI ƯU LỘ TRÌNH GIỐNG ĐƠN HÀNG ===
  routeOrder: {
    type: Number,
    default: 0, // 0 = chưa optimize, 1,2,3... = thứ tự trong lộ trình
  },
  optimizedAt: {
    type: Date, // Timestamp khi được tối ưu
  },

  // Cập nhật status để khớp với đơn hàng
  status: {
    type: String,
    enum: ["Đang sắp xếp", "Đang vận chuyển", "Đã giao"],
    default: "Đang sắp xếp",
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deliveredAt: { type: Date }, // Thời điểm hoàn thành transfer
});

module.exports = mongoose.model("Transfer", TransferSchema);

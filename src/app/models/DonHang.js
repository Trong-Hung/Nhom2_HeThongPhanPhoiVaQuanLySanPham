const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DonHangSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  assignedShipper: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  warehouseId: {
    type: Schema.Types.ObjectId,
    ref: "Warehouse",
    required: true,
  },
  // === FIELDS CHO TỐI ƯU LỘ TRÌNH ===
  routeOrder: {
    type: Number,
    default: 0, // 0 = chưa optimize, 1,2,3... = thứ tự trong lộ trình
  },
  optimizedAt: {
    type: Date, // Timestamp khi được tối ưu
  },
  // =====================================
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: false },
  address: { type: String, required: true },
  addressDetail: {
    province: {
      code: { type: String },
      name: { type: String },
    },
    district: {
      code: { type: String },
      name: { type: String },
    },
    ward: {
      code: { type: String },
      name: { type: String },
    },
    detail: { type: String },
  },
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
    enum: [
      "Chờ thanh toán",
      "Chờ xác nhận",
      "Đang sắp xếp",
      "Đang vận chuyển",
      "Đã giao",
      "Đã hủy",
      "Hoàn thành",
    ],
    default: "Chờ thanh toán",
  },
  paymentMethod: { type: String, enum: ["cash", "momo"], required: true },
  estimatedDelivery: { type: Date },
  cancelReason: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  customerLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  // === THÔNG TIN GEOCODING ===
  geocodingInfo: {
    confidence: { type: Number }, // Độ tin cậy 0-1
    source: { type: String }, // nominatim, opencage, mapbox
    improved: { type: Boolean, default: false }, // Có được cải thiện không
    originalConfidence: { type: Number }, // Confidence ban đầu (nếu được cải thiện)
    displayName: { type: String }, // Địa chỉ được format từ geocoding service
    validatedAt: { type: Date, default: Date.now }, // Thời điểm validate
  },
});

module.exports = mongoose.model("DonHang", DonHangSchema);

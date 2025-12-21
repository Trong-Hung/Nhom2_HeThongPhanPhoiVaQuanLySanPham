const mongoose = require("mongoose");
const slug = require("mongoose-slug-updater");

mongoose.plugin(slug);

const sanphamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  slug: { type: String, slug: "name", unique: true },
  image: { type: String },
  price: { type: Number, required: true },
  category: { type: String, required: true }, 
  sku: { type: String, required: true, unique: true }, 
  stockTotal: { type: Number, default: 0 },
  warehouses: [{
    warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
    stock: { type: Number, required: true, default: 0 }
  }],
  // Thêm các trường sau:
  length: { type: Number, required: true },   // cm
  width: { type: Number, required: true },    // cm
  height: { type: Number, required: true },   // cm
  weight: { type: Number, required: true },   // kg
  volume: { type: Number },                   // m3, có thể tự động tính từ kích thước

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Tự động tính thể tích trước khi lưu (nếu chưa có)
sanphamSchema.pre("save", function(next) {
  if (!this.volume && this.length && this.width && this.height) {
    // Đổi từ cm sang m: (cm^3) / 1,000,000 = m^3
    this.volume = (this.length * this.width * this.height) / 1000000;
  }
  next();
});

module.exports = mongoose.model("Sanpham", sanphamSchema);
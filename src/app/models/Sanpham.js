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
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Sanpham", sanphamSchema);






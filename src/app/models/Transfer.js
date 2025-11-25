const mongoose = require("mongoose");

const transferSchema = new mongoose.Schema({
  sourceWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
  destinationWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Sanpham", required: true },
    quantity: { type: Number, required: true },
  }],
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Transfer", transferSchema);
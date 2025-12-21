const mongoose = require("mongoose");

const truckSchema = new mongoose.Schema({
  licensePlate: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  maxWeight: { type: Number, required: true },
  boxLength: { type: Number, required: true },
  boxWidth: { type: Number, required: true },
  boxHeight: { type: Number, required: true },
  boxVolumeM3: { type: Number },
  operatingHours: { type: String }, 
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // tài xế
});

module.exports = mongoose.model("Truck", truckSchema);
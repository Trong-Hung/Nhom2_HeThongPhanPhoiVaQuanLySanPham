const mongoose = require("mongoose");

const warehouseSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Tên kho
    address: { type: String, required: true }, // Địa chỉ kho
    province: { type: String, required: true }, // Tỉnh/Thành phố
    district: { type: String, required: true }, // Quận/Huyện
    ward: { type: String, required: true }, // Phường/Xã
    region: { type: String, required: true }, // Vùng miền (Bắc, Trung, Nam)
    type: { type: String, enum: ["central", "regional"], required: true }, // Loại kho
    parentWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" }, // Kho cha (chỉ áp dụng cho regional)
    location: { 
        latitude: { type: Number, required: true, default: 0 }, // Tọa độ GPS
        longitude: { type: Number, required: true, default: 0 }
    },
    products: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Sanpham", required: true }, // Sản phẩm trong kho
        quantity: { type: Number, required: true, default: 0 } // Số lượng sản phẩm
    }]
}, { timestamps: true });

module.exports = mongoose.model("Warehouse", warehouseSchema);
const mongoose = require("mongoose");

const warehouseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    province: { type: String, required: true }, 
    district: { type: String, required: true },
    ward: { type: String, required: true },
    region: { type: String, required: true },
    location: { 
        latitude: { type: Number, required: true, default: 0 }, 
        longitude: { type: Number, required: true, default: 0 }
    },
    products: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Sanpham", required: true },
        quantity: { type: Number, required: true, default: 0 }
        
    }]
}, { timestamps: true });

module.exports = mongoose.model("Warehouse", warehouseSchema);

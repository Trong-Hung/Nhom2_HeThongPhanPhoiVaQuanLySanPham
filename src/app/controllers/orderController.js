const Warehouse = require("../models/Warehouse");
const Product = require("../models/Product");
const axios = require("axios");

// ✅ Chọn kho gần nhất có hàng để giao đơn
exports.findNearestWarehouse = async (req, res) => {
    try {
        const { productId, latitude, longitude } = req.body;

        // Tìm kho có hàng tồn
        const warehouses = await Warehouse.find({ "products.productId": productId });
        if (warehouses.length === 0) return res.status(404).json({ message: "Không có kho nào có hàng!" });

        // Tìm kho gần nhất bằng Mapbox API
        let nearestWarehouse = null;
        let shortestDistance = Infinity;

        for (const warehouse of warehouses) {
            const warehouseLat = warehouse.location.latitude;
            const warehouseLon = warehouse.location.longitude;
            const response = await axios.get(`https://api.mapbox.com/directions/v5/mapbox/driving/${warehouseLon},${warehouseLat};${longitude},${latitude}?access_token=YOUR_ACCESS_TOKEN`);
            
            if (response.data.routes.length > 0) {
                const distance = response.data.routes[0].distance;
                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    nearestWarehouse = warehouse;
                }
            }
        }

        if (!nearestWarehouse) return res.status(404).json({ message: "Không tìm thấy tuyến đường!" });

        res.status(200).json({ message: "Kho hàng gần nhất tìm thấy!", warehouse: nearestWarehouse });
    } catch (err) {
        console.error("💥 Lỗi khi tìm kho gần nhất:", err);
        res.status(500).json({ message: "Lỗi hệ thống!" });
    }
};

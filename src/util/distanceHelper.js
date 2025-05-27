const axios = require("axios");

async function getDistance(origin, destination) {
    // Log tọa độ kho (origin) và tọa độ khách hàng (destination)
    console.log("📍 Vị trí kho (Origin):", origin);
    console.log("📍 Vị trí khách hàng (Destination):", destination);

    if (!origin || !destination || !origin.latitude || !origin.longitude || !destination.latitude || !destination.longitude) {
        console.error("❌ Lỗi: Tọa độ không hợp lệ!");
        return null;
    }

    const apiKey = "5b3ce3597851110001cf62485ab14955136c4f3fa2fff3fcf0cc8110";
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${origin.longitude},${origin.latitude}&end=${destination.longitude},${destination.latitude}`;

    try {
        console.log(`📡 Gửi yêu cầu OpenRouteService: ${url}`);
        const response = await axios.get(url);

        if (!response.data.routes || response.data.routes.length === 0) {
            console.error("❌ Không tìm thấy lộ trình! Kiểm tra địa chỉ nhập vào.");
            return null;
        }

        const distanceInMeters = response.data.routes[0].summary.distance;
        const distanceInKm = distanceInMeters / 1000;
        console.log(`📏 Khoảng cách: ${distanceInKm} km`);
        return distanceInKm;
    } catch (err) {
        console.error("❌ Lỗi khi gọi OpenRouteService API:", err.message);
        return null;
    }
}

module.exports = { getDistance };

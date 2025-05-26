const axios = require("axios");

async function getDistance(origin, destination) {
    if (!origin || !destination || origin.latitude === 0 || origin.longitude === 0) {
        console.error("❌ Lỗi: Tọa độ không hợp lệ!");
        return null;
    }

    const apiKey = "5b3ce3597851110001cf62485ab14955136c4f3fa2fff3fcf0cc8110"; // 🔥 API Key của bạn
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${origin.longitude},${origin.latitude}&end=${destination.longitude},${destination.latitude}`;

    try {
        const response = await axios.get(url);
        return response.data.routes[0].summary.distance / 1000; // 🔥 Đổi từ mét → km
    } catch (err) {
        console.error("❌ Lỗi khi gọi OpenRouteService API:", err);
        return null;
    }
}






module.exports = { getDistance };

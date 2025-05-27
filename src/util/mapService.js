const axios = require("axios");

const OPENROUTESERVICE_API_KEY = "5b3ce3597851110001cf62485ab14955136c4f3fa2fff3fcf0cc8110"; 
const GRAPHHOPPER_API_KEY = "59892466-e5b1-41c1-9bfb-d161b6eababb"; 


async function geocode(address) {
    try {
        if (!OPENROUTESERVICE_API_KEY) throw new Error("API Key OpenRouteService không hợp lệ!");

        const response = await axios.get(`https://api.openrouteservice.org/geocode/search`, {
            params: { api_key: OPENROUTESERVICE_API_KEY, text: address }
        });

        const location = response.data.features[0]?.geometry.coordinates;
        if (!location) throw new Error("Không tìm thấy tọa độ.");

        return { latitude: location[1], longitude: location[0] };
    } catch (error) {
        console.error(" Lỗi khi lấy tọa độ:", error.message);
        return null;
    }
}


async function getRoute(startCoords, endCoords) {
    try {
        if (!GRAPHHOPPER_API_KEY) throw new Error("API Key GraphHopper không hợp lệ!");

        console.log(" Tọa độ kho xuất hàng:", startCoords);
        console.log(" Tọa độ điểm giao hàng:", endCoords);

        const response = await axios.get(`https://graphhopper.com/api/1/route`, {
            params: {
                key: GRAPHHOPPER_API_KEY,
                vehicle: "car",
                locale: "vi",
                points: `${startCoords.longitude},${startCoords.latitude}|${endCoords.longitude},${endCoords.latitude}`,
                instructions: true
            }
        });

        const route = response.data.paths[0];
        if (!route) throw new Error("Không tìm thấy tuyến đường.");

        return {
            distance: (route.distance / 1000).toFixed(2) + " km",
            duration: Math.round(route.time / 60000) + " phút",
            geometry: route.points.coordinates.map(coord => ({ latitude: coord[1], longitude: coord[0] })),
            instructions: route.instructions.map(step => step.text)
        };
    } catch (error) {
        console.error(" Lỗi khi lấy tuyến đường:", error.message);
        return null;
    }
}
async function geocodeAddress(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;

    try {
        const response = await axios.get(url);
        if (response.data.length === 0) {
            console.error(" Không tìm thấy tọa độ! Thử thay đổi địa chỉ.");
            return null;
        }

        const { lat, lon } = response.data[0];
        console.log(`📍 Địa chỉ: ${address} → GPS: (${lat}, ${lon})`);
        return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
    } catch (err) {
        console.error(" Lỗi khi gọi Geocoding API:", err);
        return null;
    }
}


module.exports = { geocodeAddress, geocode, getRoute };

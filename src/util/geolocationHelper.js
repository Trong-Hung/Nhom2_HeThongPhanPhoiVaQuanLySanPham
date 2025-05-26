const axios = require("axios");

async function geocodeAddress(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;

    try {
        const response = await axios.get(url);
        if (response.data.length === 0) {
            console.error("❌ Không tìm thấy tọa độ! Thử thay đổi địa chỉ.");
            return null;
        }

        const { lat, lon } = response.data[0];
        console.log(`📍 Địa chỉ: ${address} → GPS: (${lat}, ${lon})`);
        return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
    } catch (err) {
        console.error("❌ Lỗi khi gọi Geocoding API:", err);
        return null;
    }
}
module.exports = { geocodeAddress };
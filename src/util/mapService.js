const axios = require("axios");

/**
 * Hàm chuyển địa chỉ thành tọa độ (lat,lon) bằng Nominatim (OpenStreetMap)
 * @param {string} address - Địa chỉ cần chuyển
 * @returns {Promise<{lat: number, lon: number} | null>}
 */
async function geocode(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    try {
        console.log(`🔍 Gửi request geocode: ${url}`);
        const res = await axios.get(url, { headers: { "User-Agent": "YourApp" } });

        if (res.data?.length > 0) {
            return { lat: parseFloat(res.data[0].lat), lon: parseFloat(res.data[0].lon) };
        }

        console.error(`❌ Không tìm thấy tọa độ cho địa chỉ: ${address}`);
        return null;
    } catch (error) {
        console.error(`❌ Lỗi khi geocode địa chỉ: ${address}`, error.message);
        return null;
    }
}

/**
 * Lấy chỉ đường từ OpenStreetMap OSRM API
 * @param {string} origin - Địa chỉ hoặc tọa độ "lat,lon"
 * @param {string} destination - Địa chỉ hoặc tọa độ "lat,lon"
 * @returns {Promise<Object|null>}
 */
async function getRoute(origin, destination) {
    // 📌 Nếu origin hoặc destination là địa chỉ, chuyển thành tọa độ
    const originCoords = /^[\d.-]+,[\d.-]+$/.test(origin) ? parseLatLon(origin) : await geocode(origin);
    const destinationCoords = /^[\d.-]+,[\d.-]+$/.test(destination) ? parseLatLon(destination) : await geocode(destination);

    if (!originCoords || !destinationCoords) {
        console.error("❌ Không thể chuyển đổi địa chỉ thành tọa độ.");
        return null;
    }

    const url = `https://router.project-osrm.org/route/v1/driving/${originCoords.lon},${originCoords.lat};${destinationCoords.lon},${destinationCoords.lat}?overview=full&geometries=geojson`;

    try {
        console.log(`🚀 Gửi request tìm đường: ${url}`);
        const response = await axios.get(url);

        if (!response.data?.routes?.length) {
            console.error("❌ Không tìm thấy tuyến đường.");
            return null;
        }

        return response.data.routes[0];
    } catch (error) {
        console.error("❌ Lỗi khi tìm tuyến đường:", error.message);
        return null;
    }
}

/**
 * Chuyển đổi chuỗi "lat,lon" thành object {lat, lon}
 * @param {string} latLon - Chuỗi tọa độ "lat,lon"
 * @returns {{lat: number, lon: number}}
 */
function parseLatLon(latLon) {
    const [lat, lon] = latLon.split(",").map(Number);
    return { lat, lon };
}

module.exports = { getRoute, geocode };

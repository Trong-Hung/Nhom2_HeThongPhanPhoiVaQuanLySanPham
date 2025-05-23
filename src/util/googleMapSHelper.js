const axios = require("axios");

async function getDirectionsAPI(warehouseLocation, destinationLocation) {
  const apiKey = "AIzaSyC6vntdcrVhQ4VvUXFTv5QPo5cbn1EgPi4"; // Thay bằng API key của bạn
  const origin = encodeURIComponent(warehouseLocation);
  const destination = encodeURIComponent(destinationLocation);

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${apiKey}`;

  try {
    console.log(`gửi request tìm đường: ${url}`);
    const response = await axios.get(url);

    // Log toàn bộ response để debug chi tiết
    console.log("esponse data:", JSON.stringify(response.data, null, 2));

    if (!response.data || response.data.status !== "OK") {
      console.error("lỗi từ Google Maps API:");
      console.error("  - status:", response.data?.status);
      console.error("  - error_message:", response.data?.error_message);
      console.error("  - full response:", JSON.stringify(response.data, null, 2));
      return null;
    }

    const route = response.data.routes[0];
    if (!route) {
      console.log("Không tìm thấy tuyến đường.");
      return null;
    }

    console.log("✅ Lộ trình tốt nhất:", route.summary);
    return route;
  } catch (error) {
    console.error("Lỗi khi gọi API tìm đường:", error.message);
    if (error.response) {
      console.error("  - status code:", error.response.status);
      console.error("  - response data:", JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

module.exports = { getDirectionsAPI };
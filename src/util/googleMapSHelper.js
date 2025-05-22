const axios = require("axios");

async function getDirectionsAPI(warehouseLocation, destinationLocation) {
 const apiKey = "AIzaSyA5PPIbdl1rM3U6uIT3IDQ8DjA2Bnb-oEc"; // 🔥 Cập nhật API key đúng
const url = `https://routes.googleapis.com/directions/v2:computeRoutes?origin=10.762622,106.660172&destination=31/8/7/10 Đường số 17, Phường Hiệp Bình Chánh, Thành phố Thủ Đức, Thành phố Hồ Chí Minh&key=${apiKey}`;

  try {
    console.log(`📌 Gửi request tìm đường: ${url}`);
    const response = await axios.get(url);

    if (!response.data || response.data.status !== "OK") {
      console.error(`❌ Lỗi từ Google Maps API: ${response.data?.error_message || "Không rõ nguyên nhân"}`);
      return null;
    }

    const route = response.data.routes[0];
    if (!route) {
      console.log("❌ Không tìm thấy tuyến đường.");
      return null;
    }

    console.log("✅ Lộ trình tốt nhất:", route.summary);
    return route;
  } catch (error) {
    console.error(`❌ Lỗi khi gọi API tìm đường: ${error.message}`);
    return null;
  }
}

module.exports = { getDirectionsAPI };

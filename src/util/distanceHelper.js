const axios = require("axios");

async function getDistanceUsingHere(origin, destination) {
  // Kiểm tra dữ liệu đầu vào
  if (
  !origin ||
  !destination ||
  origin.latitude == null ||
  origin.longitude == null ||
  destination.latitude == null ||
  destination.longitude == null
) {
  console.error("❌ Lỗi: Tọa độ không hợp lệ!");
  return null;
}


  // Log tọa độ để debug
  console.log("HERE API - Vị trí kho (Origin):", origin);
  console.log("HERE API - Vị trí khách hàng (Destination):", destination);

  // Thay YOUR_HERE_API_KEY bằng API key hợp lệ của bạn
  const apiKey = "nJ2hIx9AoLMf3ba0VXmNq1KrMukOYi5sf_xVvCeh9pM";
  const url = `https://router.hereapi.com/v8/routes?transportMode=car&origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&return=summary&apiKey=${apiKey}`;

  try {
    console.log(`📡 Đang gửi yêu cầu HERE Routing API: ${url}`);
    const response = await axios.get(url);

    if (
      !response.data.routes ||
      response.data.routes.length === 0 ||
      !response.data.routes[0].sections ||
      response.data.routes[0].sections.length === 0
    ) {
      console.error("❌ Không tìm thấy lộ trình từ HERE API. Kiểm tra lại địa chỉ hoặc API key.");
      return null;
    }

    // Lấy thông tin khoảng cách từ summary.
    // Cấu trúc trả về thường là: routes -> sections -> summary -> length (đơn vị là mét)
    const summary = response.data.routes[0].sections[0].summary;
    const distanceInKm = summary.length / 1000;
    console.log(`📏 Khoảng cách (HERE): ${distanceInKm} km`);

    return distanceInKm;
  } catch (err) {
    console.error("❌ Lỗi khi gọi HERE Routing API:", err.message);
    return null;
  }
}

module.exports = { getDistanceUsingHere };

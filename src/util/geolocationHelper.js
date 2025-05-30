const axios = require("axios");

async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;

  try {
    const response = await axios.get(url);
    if (response.data.length === 0) {
      console.error(" Không tìm thấy tọa độ! Thử thay đổi địa chỉ.");
      return null;
    }

    const { lat, lon } = response.data[0];
    console.log(` Địa chỉ: ${address} → GPS: (${lat}, ${lon})`);
    return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
  } catch (err) {
    console.error(" Lỗi khi gọi Geocoding API:", err);
    return null;
  }
}
// function calculateEstimatedDelivery(distance) {
//     try {
//         const avgSpeed = 40; // km/h
//         const travelTime = distance / avgSpeed; // Thời gian di chuyển theo giờ
//         const estimatedDate = new Date();
//         estimatedDate.setHours(estimatedDate.getHours() + travelTime);

//         return estimatedDate.toISOString().split("T")[0]; // Trả về dạng `YYYY-MM-DD`
//     } catch (err) {
//         console.error("❌ Lỗi khi tính toán ngày giao:", err);
//         return null;
//     }
// }

// src/app/utils/deliveryHelpers.js
const moment = require("moment-timezone");

/**
 * Cộng thêm số ngày vào một ngày đã cho.
 * @param {Date} date - Ngày ban đầu.
 * @param {number} days - Số ngày cần cộng.
 * @returns {Date} - Ngày sau khi cộng thêm.
 */
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Tính thời gian di chuyển (travelTime) theo đơn vị ngày, dựa trên quãng đường (km)
 * và vận tốc (km/h).
 * @param {number} distance - Quãng đường (km)
 * @param {number} speed - Vận tốc (km/h)
 * @returns {number} - Thời gian di chuyển (số ngày dưới dạng số thực)
 */
function computeTravelTimeInDays(distance, speed) {
  const hours = distance / speed;
  return hours / 24;
}

/**
 * Tính ngày giao dự kiến và chuyển về giờ Việt Nam.
 *
 * Công thức chung:
 *    estimatedDelivery = shippingStartDate + (distance / speed) (đổi ra số ngày)
 *
 * Trong đó:
 * - Nếu đơn hàng có trạng thái "Chờ xác nhận": shippingStartDate = orderCreationDate + 1 ngày.
 * - Nếu đơn hàng có trạng thái "Đang giao hàng": shippingStartDate = statusChangedTime.
 *
 * Sau khi tính được ngày giao theo UTC, chúng ta chuyển nó sang múi giờ "Asia/Ho_Chi_Minh"
 * và trả về một chuỗi định dạng theo mẫu "YYYY-MM-DD HH:mm:ssZ".
 *
 * @param {number} distance - Quãng đường (km)
 * @param {number} speed - Vận tốc (km/h)
 * @param {string} orderStatus - Trạng thái đơn hàng ("Chờ xác nhận" hoặc "Đang giao hàng")
 * @param {Date} orderCreationDate - Ngày đơn hàng được tạo.
 * @param {Date|null} statusChangedTime - Ngày chuyển sang "Đang giao hàng" (nếu có).
 * @returns {string} - Ngày giao dự kiến dưới dạng chuỗi theo giờ Việt Nam.
 */
function calculateEstimatedDelivery(
  distance,
  speed,
  orderStatus,
  orderCreationDate,
  statusChangedTime
) {
  // Tính travelTime dưới dạng số ngày (số thực)
  const travelTimeDays = computeTravelTimeInDays(distance, speed);

  let shippingStartDate;
  if (orderStatus === "Chờ xác nhận") {
    // Khi đơn hàng chưa xác nhận, bắt đầu tính giao từ ngày tạo đơn + 1 ngày.
    shippingStartDate = addDays(orderCreationDate, 1);
  } else if (orderStatus === "Đang giao hàng") {
    // Khi đơn hàng đang giao, chia lấy thời điểm chuyển sang "Đang giao hàng"
    shippingStartDate = statusChangedTime
      ? new Date(statusChangedTime)
      : new Date();
  } else {
    shippingStartDate = orderCreationDate;
  }

  // Tính ngày giao dự kiến theo UTC
  const estimatedDeliveryUTC = new Date(
    shippingStartDate.getTime() + travelTimeDays * 24 * 3600000
  );

  // Chuyển đổi thời gian từ UTC sang giờ Việt Nam (Asia/Ho_Chi_Minh)
  // và định dạng chuỗi "YYYY-MM-DD HH:mm:ssZ" (ví dụ: 2025-05-29 03:45:54+07:00)
  const vietnamTime = moment(estimatedDeliveryUTC)
    .tz("Asia/Ho_Chi_Minh")
    .format("YYYY-MM-DD HH:mm:ssZ");

  return vietnamTime;
}

module.exports = {
  geocodeAddress,
  calculateEstimatedDelivery,
  addDays,
  computeTravelTimeInDays,
};

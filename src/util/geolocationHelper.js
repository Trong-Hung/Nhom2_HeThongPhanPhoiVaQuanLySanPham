const axios = require("axios");

async function geocodeAddress(address) {
  console.log("🔍 Đang tìm tọa độ cho địa chỉ:", address);

  const geocodingServices = [
 
    {
      name: "Nominatim",
      url: `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=vn`,
      parseResponse: (data) =>
        data.length > 0 ? { lat: data[0].lat, lon: data[0].lon } : null,
    },
    
    {
      name: "Nominatim-Simple",
      url: `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(getSimplifiedAddress(address))}&limit=1&countrycodes=vn`,
      parseResponse: (data) =>
        data.length > 0 ? { lat: data[0].lat, lon: data[0].lon } : null,
    },
  ];

  // Thử từng API một cách tuần tự
  for (const service of geocodingServices) {
    try {
      console.log(`🌐 Thử ${service.name}:`, service.url);

      const response = await axios.get(service.url, {
        headers: {
          "User-Agent": "EcommerceDemoApp/1.0",
        },
        timeout: 5000,
      });

      const result = service.parseResponse(response.data);
      if (result) {
        const { lat, lon } = result;
        console.log(
          `✅ ${service.name} thành công! Địa chỉ: ${address} → GPS: (${lat}, ${lon})`
        );
        return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
      }
    } catch (err) {
      console.error(`❌ ${service.name} lỗi:`, err.message);
      continue; // Thử service tiếp theo
    }
  }

  // Nếu tất cả API đều fail, thử với tọa độ mặc định của các tỉnh/thành phố lớn
  const fallbackCoordinates = getFallbackCoordinates(address);
  if (fallbackCoordinates) {
    console.log(`🏠 Sử dụng tọa độ mặc định cho: ${address}`);
    return fallbackCoordinates;
  }

  console.error(
    "❌ Không tìm thấy tọa độ từ tất cả các nguồn! Địa chỉ:",
    address
  );
  return null;
}

// Hàm tạo địa chỉ đơn giản hơn để tăng khả năng tìm thấy
function getSimplifiedAddress(fullAddress) {
  const parts = fullAddress.split(",").map((part) => part.trim());
  // Chỉ lấy phần cuối (thường là tỉnh/thành phố) + "Vietnam"
  const province = parts[parts.length - 1];
  return `${province}, Vietnam`;
}

// Tọa độ mặc định cho các tỉnh/thành phố lớn của Việt Nam
function getFallbackCoordinates(address) {
  const defaultCoords = {
    "Hồ Chí Minh": { latitude: 10.8231, longitude: 106.6297 },
    "TP. Hồ Chí Minh": { latitude: 10.8231, longitude: 106.6297 },
    "Hà Nội": { latitude: 21.0285, longitude: 105.8542 },
    "Đà Nẵng": { latitude: 16.0471, longitude: 108.2068 },
    "Hải Phòng": { latitude: 20.8449, longitude: 106.6881 },
    "Cần Thơ": { latitude: 10.0452, longitude: 105.7469 },
    "Biên Hòa": { latitude: 10.9465, longitude: 106.842 },
    Huế: { latitude: 16.4637, longitude: 107.5909 },
    "Nha Trang": { latitude: 12.2388, longitude: 109.1967 },
    "Buôn Ma Thuột": { latitude: 12.6667, longitude: 108.05 },
  };

  // Tìm kiếm trong địa chỉ
  for (const [city, coords] of Object.entries(defaultCoords)) {
    if (address.includes(city)) {
      return coords;
    }
  }

  return null;
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
    shippingStartDate = addDays(orderCreationDate, 1);
  } else if (orderStatus === "Đang giao hàng") {
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

const axios = require("axios");

// Cache để tránh gọi API nhiều lần
const addressCache = new Map();

async function getProvinceName(code) {
  const cacheKey = `province_${code}`;
  if (addressCache.has(cacheKey)) {
    return addressCache.get(cacheKey);
  }

  try {
    console.log(`🌐 Đang lấy tên tỉnh cho mã: ${code}`);
    const res = await axios.get(`https://provinces.open-api.vn/api/p/${code}`, {
      timeout: 5000,
    });

    const name = res.data.name || "Không xác định";
    addressCache.set(cacheKey, name);
    console.log(`✅ Tỉnh ${code} → ${name}`);
    return name;
  } catch (err) {
    console.error(`❌ Lỗi lấy tên tỉnh ${code}:`, err.message);

    // Fallback với một số tỉnh/thành phố phổ biến
    const fallbackProvinces = {
      1: "TP. Hồ Chí Minh",
      2: "Hà Nội",
      48: "Đà Nẵng",
      31: "Hải Phòng",
      92: "Cần Thơ",
    };

    const fallbackName = fallbackProvinces[code] || "Không xác định";
    addressCache.set(cacheKey, fallbackName);
    return fallbackName;
  }
}

async function getDistrictName(code) {
  const cacheKey = `district_${code}`;
  if (addressCache.has(cacheKey)) {
    return addressCache.get(cacheKey);
  }

  try {
    console.log(`🌐 Đang lấy tên quận/huyện cho mã: ${code}`);
    const res = await axios.get(`https://provinces.open-api.vn/api/d/${code}`, {
      timeout: 5000,
    });

    const name = res.data.name || "Không xác định";
    addressCache.set(cacheKey, name);
    console.log(`✅ Quận/Huyện ${code} → ${name}`);
    return name;
  } catch (err) {
    console.error(`❌ Lỗi lấy tên quận/huyện ${code}:`, err.message);

    // Fallback với một số quận/huyện phổ biến ở TP.HCM
    const fallbackDistricts = {
      1: "Quận 1",
      2: "Quận 2",
      3: "Quận 3",
      4: "Quận 4",
      5: "Quận 5",
    };

    const fallbackName = fallbackDistricts[code] || "Không xác định";
    addressCache.set(cacheKey, fallbackName);
    return fallbackName;
  }
}

async function getWardName(wardCode, districtCode) {
  const cacheKey = `ward_${wardCode}_${districtCode}`;
  if (addressCache.has(cacheKey)) {
    return addressCache.get(cacheKey);
  }

  try {
    console.log(
      `🌐 Đang lấy tên phường/xã cho mã: ${wardCode} trong quận/huyện: ${districtCode}`
    );
    const res = await axios.get(
      `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`,
      {
        timeout: 5000,
      }
    );

    const wards = res.data.wards || [];
    const ward = wards.find((w) => w.code === parseInt(wardCode));
    const name = ward ? ward.name : "Không xác định";

    addressCache.set(cacheKey, name);
    console.log(`✅ Phường/Xã ${wardCode} → ${name}`);
    return name;
  } catch (err) {
    console.error(`❌ Lỗi lấy tên phường/xã ${wardCode}:`, err.message);

    // Fallback với một số phường phổ biến
    const fallbackWards = {
      76: "Phường Bến Nghé",
      77: "Phường Bến Thành",
      78: "Phường Cầu Kho",
      79: "Phường Cầu Ông Lãnh",
    };

    const fallbackName = fallbackWards[wardCode] || "Không xác định";
    addressCache.set(cacheKey, fallbackName);
    return fallbackName;
  }
}

module.exports = {
  getProvinceName,
  getDistrictName,
  getWardName,
};

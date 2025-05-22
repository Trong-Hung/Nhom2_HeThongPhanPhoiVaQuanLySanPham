const axios = require("axios");

async function getProvinceName(code) {
  try {
    const res = await axios.get(`https://provinces.open-api.vn/api/p/${code}`);
    return res.data.name || "Không xác định";
  } catch (err) {
    console.error("❌ Lỗi lấy tên tỉnh:", err.message);
    return "Không xác định";
  }
}

async function getDistrictName(code) {
  try {
    const res = await axios.get(`https://provinces.open-api.vn/api/d/${code}`);
    return res.data.name || "Không xác định";
  } catch (err) {
    console.error("❌ Lỗi lấy tên huyện:", err.message);
    return "Không xác định";
  }
}

async function getWardName(wardCode, districtCode) {


  try {
    const res = await axios.get(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
    const wards = res.data.wards || [];

    const ward = wards.find(w => w.code === parseInt(wardCode));
    return ward ? ward.name : "Không xác định";
  } catch (err) {
    console.error("❌ Lỗi lấy tên xã:", err.message);
    return "Không xác định";
  }
}

module.exports = {
  getProvinceName,
  getDistrictName,
  getWardName,
};

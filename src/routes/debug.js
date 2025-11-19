const express = require("express");
const router = express.Router();
const { geocodeAddress } = require("../util/geolocationHelper");
const {
  getProvinceName,
  getDistrictName,
  getWardName,
} = require("../util/addressHelper");

// Test geocoding endpoint
router.post("/test-geocoding", async (req, res) => {
  try {
    const { province, district, ward, detail } = req.body;

    console.log("🧪 [DEBUG] Test geocoding với dữ liệu:", req.body);

    // Lấy tên địa chỉ từ mã
    const provinceName = await getProvinceName(province);
    const districtName = await getDistrictName(district);
    const wardName = await getWardName(ward, district);

    // Tạo địa chỉ đầy đủ
    const fullAddress = `${detail}, ${wardName}, ${districtName}, ${provinceName}`;
    const simplifiedAddress = `${provinceName}, Việt Nam`;

    console.log("📍 [DEBUG] Địa chỉ được tạo:", {
      full: fullAddress,
      simplified: simplifiedAddress,
    });

    // Test geocoding
    const location1 = await geocodeAddress(fullAddress);
    const location2 = await geocodeAddress(simplifiedAddress);

    res.json({
      success: true,
      input: { province, district, ward, detail },
      addresses: {
        provinceName,
        districtName,
        wardName,
        fullAddress,
        simplifiedAddress,
      },
      geocoding: {
        fullAddress: {
          address: fullAddress,
          result: location1,
        },
        simplifiedAddress: {
          address: simplifiedAddress,
          result: location2,
        },
      },
      recommendation:
        location1 || location2
          ? "✅ Geocoding thành công!"
          : "❌ Geocoding thất bại",
    });
  } catch (error) {
    console.error("❌ [DEBUG] Lỗi test geocoding:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
});

// Test với địa chỉ cụ thể
router.get("/test-address/:address", async (req, res) => {
  try {
    const address = decodeURIComponent(req.params.address);
    console.log("🧪 [DEBUG] Test địa chỉ:", address);

    const result = await geocodeAddress(address);

    res.json({
      success: !!result,
      input: address,
      result: result,
      message: result ? "✅ Tìm thấy tọa độ!" : "❌ Không tìm thấy tọa độ",
    });
  } catch (error) {
    console.error("❌ [DEBUG] Lỗi:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;

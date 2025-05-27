const regions = {
  "Miền Bắc": ["Thành phố Hà Nội", "Bắc Ninh", "Hải Phòng", "Quảng Ninh", "Lào Cai"],
  "Miền Trung": ["Thanh Hóa", "Tỉnh Nghệ An", "Huế", "Đà Nẵng", "Khánh Hòa"],
  "Miền Nam": ["Thành phố Hồ Chí Minh", "Bình Dương", "Đồng Nai", "Cần Thơ", "An Giang"]
};

function getRegionByProvince(provinceName) {
  for (const [region, provinces] of Object.entries(regions)) {
    if (provinces.includes(provinceName)) {
      return region;
    }
  }
  return "Không xác định";
}

module.exports = { getRegionByProvince };

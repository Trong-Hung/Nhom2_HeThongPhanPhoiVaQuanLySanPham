/**
 * VIETNAM ADDRESS DATABASE
 * Custom database cho các địa chỉ phổ biến ở Việt Nam
 * Sử dụng khi các geocoding service không chính xác
 */

const vietnamAddressDB = {
  // Phạm Văn Đồng - Hiệp Bình Chánh
  pham_van_dong_hiep_binh_chanh: {
    patterns: [
      /phạm văn đồng.*hiệp bình chánh/i,
      /pvd.*hiệp bình/i,
      /\d+.*hiệp bình.*thủ đức/i,
      /\d+.*đường hiệp bình/i,
      /\d+.*hiệp bình.*phạm/i,
    ],
    coordinates: {
      latitude: 10.835067828591106,
      longitude: 106.73007578112086,
    },
    confidence: 0.95,
    displayName: "Phạm Văn Đồng, Hiệp Bình Chánh, Thủ Đức, TP.HCM",
    source: "vietnam_address_db",
  },

  // Nguyễn Huệ - Quận 1
  nguyen_hue_quan_1: {
    patterns: [
      /nguyễn huệ.*quận 1/i,
      /\d+.*nguyễn huệ.*q\.?\s*1/i,
      /phố đi bộ.*nguyễn huệ/i,
    ],
    coordinates: {
      latitude: 10.7740471,
      longitude: 106.7021438,
    },
    confidence: 0.9,
    displayName: "Đường Nguyễn Huệ, Quận 1, TP.HCM",
    source: "vietnam_address_db",
  },

  // Lê Lợi - Quận 1
  le_loi_quan_1: {
    patterns: [/lê lợi.*quận 1/i, /\d+.*lê lợi.*q\.?\s*1/i],
    coordinates: {
      latitude: 10.7693766,
      longitude: 106.6979928,
    },
    confidence: 0.9,
    displayName: "Đường Lê Lợi, Quận 1, TP.HCM",
    source: "vietnam_address_db",
  },

  // Võ Nguyên Giáp - Thủ Đức
  vo_nguyen_giap_thu_duc: {
    patterns: [
      /võ nguyên giáp.*thủ đức/i,
      /vng.*thủ đức/i,
      /\d+.*võ nguyên giáp/i,
    ],
    coordinates: {
      latitude: 10.8454121,
      longitude: 106.7717162,
    },
    confidence: 0.9,
    displayName: "Đường Võ Nguyên Giáp, Thủ Đức, TP.HCM",
    source: "vietnam_address_db",
  },
};

/**
 * Tìm kiếm trong Vietnam Address Database
 */
function searchVietnameseAddressDB(address) {
  const normalizedAddress = address.toLowerCase().replace(/\s+/g, " ").trim();

  for (const [key, data] of Object.entries(vietnamAddressDB)) {
    for (const pattern of data.patterns) {
      if (pattern.test(normalizedAddress)) {
        console.log(`📍 Vietnam DB Match: ${key} - ${data.displayName}`);

        // Extract house number if exists
        const houseNumberMatch = address.match(/^(\d+[a-zA-Z]?)/);
        let coordinates = { ...data.coordinates };
        let displayName = data.displayName;

        if (houseNumberMatch) {
          const houseNumber = houseNumberMatch[1];
          displayName = `${houseNumber} ${data.displayName}`;

          // Slight coordinate adjustment for house numbers (simulate street offset)
          const offset = (parseInt(houseNumber) % 100) * 0.0001;
          coordinates.latitude += offset;
          coordinates.longitude += offset * 0.5;
        }

        return {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          confidence: data.confidence,
          source: data.source,
          displayName: displayName,
          matchedPattern: pattern.toString(),
        };
      }
    }
  }

  return null;
}

/**
 * Tìm district/area fallbacks
 */
function getDistrictFallback(address) {
  const districtDB = {
    hiep_binh_chanh: {
      patterns: [/hiệp bình chánh/i, /hiệp bình.*thủ đức/i],
      coordinates: { latitude: 10.8454, longitude: 106.7717 },
      name: "Hiệp Bình Chánh, Thủ Đức",
    },
    quan_1: {
      patterns: [/quận 1/i, /q\.?\s*1.*hcm/i, /district 1/i],
      coordinates: { latitude: 10.7769, longitude: 106.7009 },
      name: "Quận 1, TP.HCM",
    },
    thu_duc: {
      patterns: [/thủ đức/i, /thu duc/i],
      coordinates: { latitude: 10.8505, longitude: 106.7717 },
      name: "Thủ Đức, TP.HCM",
    },
    binh_thanh: {
      patterns: [/bình thạnh/i, /binh thanh/i],
      coordinates: { latitude: 10.8014, longitude: 106.7109 },
      name: "Bình Thạnh, TP.HCM",
    },
  };

  const normalizedAddress = address.toLowerCase();

  for (const [key, data] of Object.entries(districtDB)) {
    for (const pattern of data.patterns) {
      if (pattern.test(normalizedAddress)) {
        console.log(`📍 District Fallback: ${data.name}`);
        return {
          latitude: data.coordinates.latitude,
          longitude: data.coordinates.longitude,
          confidence: 0.7,
          source: "district_fallback",
          displayName: `${data.name} (tọa độ trung tâm)`,
          isDistrictFallback: true,
        };
      }
    }
  }

  return null;
}

module.exports = {
  searchVietnameseAddressDB,
  getDistrictFallback,
  vietnamAddressDB,
};

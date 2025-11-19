/**
 * 🔍 GEOCODING VALIDATOR & AUTO-CORRECTION
 * Tự động kiểm tra và cải thiện độ chính xác địa chỉ khách hàng
 * Hệ thống ưu tiên theo độ chính xác:
 * 🥇 Vietnam Address Database (95%+ confidence) - FREE
 * 🥈 Mapbox Geocoding (80-95% confidence) - 100K req/month
 */

const { geocodeAddress } = require("./mapService");
const { searchVietnameseAddressDB } = require("./vietnamAddressDB");

/**
 * Validate và cải thiện geocoding cho địa chỉ
 */
async function validateAndImproveGeocode(address, expectedRegion = null) {
  console.log(`🔍 Validating geocoding cho: ${address}`);

  let result = await geocodeAddress(address);

  if (!result) {
    console.log(`❌ Không tìm thấy địa chỉ với geocoding chính`);

    // Fallback: Thử tìm trong Vietnam Address Database
    try {
      const vnResult = await searchVietnameseAddressDB(address);
      if (vnResult && vnResult.length > 0) {
        console.log(
          `🇻🇳 Vietnam DB backup: Tìm thấy ${vnResult.length} kết quả`
        );
        const bestMatch = vnResult[0];

        return {
          success: true,
          result: {
            latitude: bestMatch.latitude,
            longitude: bestMatch.longitude,
            confidence: 0.95,
            source: "vietnam_db_fallback",
            displayName: bestMatch.displayName || address,
            backupSource: true,
          },
          message: "Sử dụng Vietnam Address Database as fallback",
          originalAddress: address,
        };
      }
    } catch (vnErr) {
      console.log(`⚠️ Vietnam DB fallback failed: ${vnErr.message}`);
    }

    return {
      success: false,
      error: "Không thể geocode địa chỉ này với tất cả các dịch vụ",
      suggestions: await suggestAddressCorrections(address),
    };
  }

  // Kiểm tra có nằm trong khu vực mong đợi không (trước khi kiểm tra confidence)
  const regionCheck = expectedRegion
    ? isInExpectedRegion(result, expectedRegion)
    : true;
  const distanceCheck = expectedRegion
    ? isReasonableDistance(result, address, expectedRegion)
    : true;

  if (expectedRegion && (!regionCheck || !distanceCheck)) {
    if (!regionCheck) {
      console.log(`⚠️ Địa chỉ không nằm trong bounds của ${expectedRegion}`);
    }
    if (!distanceCheck) {
      console.log(`⚠️ Địa chỉ quá xa so với khu vực được nhắc đến`);
    }
    console.log(`📍 Tọa độ tìm thấy: ${result.latitude}, ${result.longitude}`);

    // Thử tìm alternatives trong khu vực đúng
    const alternatives = await tryAlternativeFormats(address);
    const validAlternatives = alternatives.filter((alt) => {
      const regionOK = isInExpectedRegion(alt, expectedRegion);
      const distanceOK = isReasonableDistance(alt, address, expectedRegion);
      return alt.confidence > 0.3 && regionOK && distanceOK; // Giảm threshold confidence
    });

    if (validAlternatives.length > 0) {
      // Ưu tiên khoảng cách hợp lý hơn confidence cao
      const bestAlternative = validAlternatives.sort((a, b) => {
        const distanceA = getDistanceFromExpected(a, address);
        const distanceB = getDistanceFromExpected(b, address);

        // Nếu cả hai đều gần (< 5km), ưu tiên confidence
        if (distanceA < 5000 && distanceB < 5000) {
          return b.confidence - a.confidence;
        }

        // Nếu không, ưu tiên khoảng cách gần hơn
        return distanceA - distanceB;
      })[0];

      console.log(
        `✅ Tìm thấy địa chỉ tốt hơn - Distance: ${getDistanceFromExpected(bestAlternative, address).toFixed(0)}m, Confidence: ${bestAlternative.confidence}`
      );
      return {
        success: true,
        result: bestAlternative,
        improved: true,
        originalConfidence: result.confidence,
      };
    } else {
      // Accept Google Maps result even if outside expected region
      console.log(
        `⚠️ Địa chỉ nằm ngoài khu vực ${expectedRegion} nhưng vẫn chấp nhận (Google Maps only)`
      );
      return {
        success: true,
        result: result,
        improved: false,
        warning: `Địa chỉ có thể nằm ngoài khu vực ${expectedRegion}`,
      };
    }
  }

  // Kiểm tra confidence
  if (result.confidence < 0.6) {
    console.log(`⚠️ Confidence thấp: ${result.confidence}`);

    const alternatives = await tryAlternativeFormats(address);
    let bestAlternative = alternatives.find(
      (alt) => alt.confidence > result.confidence
    );

    // Nếu có expectedRegion, ưu tiên alternatives trong khu vực đúng
    if (expectedRegion) {
      const validAlternatives = alternatives.filter(
        (alt) =>
          alt.confidence > result.confidence &&
          isInExpectedRegion(alt, expectedRegion)
      );
      if (validAlternatives.length > 0) {
        bestAlternative = validAlternatives.sort(
          (a, b) => b.confidence - a.confidence
        )[0];
      }
    }

    if (bestAlternative) {
      console.log(
        `✅ Tìm thấy địa chỉ tốt hơn với confidence: ${bestAlternative.confidence}`
      );
      return {
        success: true,
        result: bestAlternative,
        improved: true,
        originalConfidence: result.confidence,
      };
    }
  }

  return {
    success: true,
    result: result,
    improved: false,
  };
}

/**
 * Thử các format địa chỉ khác nhau
 */
async function tryAlternativeFormats(originalAddress) {
  const alternatives = [];

  // 🇻🇳 Priority 1: Vietnam Address Database với alternative formats
  try {
    const vnFormats = [
      originalAddress,
      originalAddress
        .replace(/phường|p\./gi, "")
        .replace(/quận|q\./gi, "")
        .trim(),
      standardizeVietnameseAddress(originalAddress),
      extractMainAddress(originalAddress),
      smartCompleteAddress(originalAddress),
    ];

    for (const format of vnFormats) {
      if (!format || format.length < 3) continue;

      try {
        const vnResults = await searchVietnameseAddressDB(format);
        if (vnResults && vnResults.length > 0) {
          console.log(`🇻🇳 Vietnam DB alternative found: ${format}`);
          alternatives.push(
            ...vnResults.map((r) => ({
              latitude: r.latitude,
              longitude: r.longitude,
              confidence: 0.95,
              source: "vietnam_db_alternative",
              displayName: r.displayName || format,
              alternativeFormat: format,
            }))
          );
        }
      } catch (err) {
        continue;
      }
    }
  } catch (vnErr) {
    console.log(`⚠️ Vietnam DB alternatives failed: ${vnErr.message}`);
  }

  // 🗺️ Priority 2: Mapbox với multiple formats
  const mapboxFormats = [
    `${originalAddress}, Hồ Chí Minh, Việt Nam`,
    `${originalAddress}, TP.HCM`,
    `${originalAddress}, Ho Chi Minh City, Vietnam`,

    // Format 2: Rút gọn
    originalAddress
      .replace(/phường|p\./gi, "")
      .replace(/quận|q\./gi, "")
      .trim(),

    // Format 3: Chuẩn hóa
    standardizeVietnameseAddress(originalAddress),

    // Format 4: Chỉ lấy số nhà và tên đường
    extractMainAddress(originalAddress),

    // Format 5: Xử lý địa chỉ thiếu thông tin
    fixIncompleteAddress(originalAddress),

    // Format 6: Fallback về khu vực/quận
    fallbackToDistrict(originalAddress),

    // Format 7: Smart completion
    smartCompleteAddress(originalAddress),
  ];

  for (const format of mapboxFormats) {
    if (format && format !== originalAddress) {
      console.log(`🔄 Thử Mapbox format: ${format}`);

      const result = await geocodeAddress(format);
      if (result && result.confidence > 0.5) {
        alternatives.push({
          ...result,
          formatUsed: format,
        });
      }

      // Delay để không spam API
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // Sắp xếp theo confidence
  return alternatives.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Chuẩn hóa địa chỉ Việt Nam
 */
function standardizeVietnameseAddress(address) {
  return address
    .replace(/phường|p\./gi, "P.")
    .replace(/quận|q\./gi, "Q.")
    .replace(/thành phố|tp\./gi, "TP.")
    .replace(/hồ chí minh|hcm/gi, "Ho Chi Minh City")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Trích xuất địa chỉ chính (số nhà + tên đường)
 */
function extractMainAddress(address) {
  // Regex để tìm số nhà và tên đường
  const match = address.match(
    /^(\d+[a-zA-Z]?)\s+(.+?)(?:,|\s+(?:phường|p\.|quận|q\.))/i
  );

  if (match) {
    return `${match[1]} ${match[2]}`.trim();
  }

  // Fallback: lấy phần đầu trước dấu phẩy đầu tiên
  return address.split(",")[0].trim();
}

/**
 * Kiểm tra có nằm trong khu vực mong đợi không
 */
function isInExpectedRegion(result, expectedRegion) {
  // Định nghĩa các vùng địa lý
  const regions = {
    hcm: {
      name: "Hồ Chí Minh",
      bounds: {
        north: 11.2,
        south: 10.3,
        east: 107.0,
        west: 106.3,
      },
      // Tọa độ trung tâm các quận/huyện
      districts: {
        hiep_binh_chanh: {
          lat: 10.8454,
          lon: 106.7717,
          name: "Hiệp Bình Chánh",
        },
        thu_duc: { lat: 10.8505, lon: 106.7717, name: "Thủ Đức" },
        quan_1: { lat: 10.7769, lon: 106.7009, name: "Quận 1" },
        quan_3: { lat: 10.7829, lon: 106.6926, name: "Quận 3" },
        binh_thanh: { lat: 10.8014, lon: 106.7109, name: "Bình Thạnh" },
      },
    },
    hanoi: {
      name: "Hà Nội",
      bounds: {
        north: 21.4,
        south: 20.8,
        east: 105.9,
        west: 105.3,
      },
    },
    danang: {
      name: "Đà Nẵng",
      bounds: {
        north: 16.2,
        south: 15.8,
        east: 108.4,
        west: 107.9,
      },
    },
  };

  const region = regions[expectedRegion.toLowerCase()];
  if (!region) return true; // Không có định nghĩa vùng -> accept

  const { latitude, longitude } = result;
  const bounds = region.bounds;

  return (
    latitude >= bounds.south &&
    latitude <= bounds.north &&
    longitude >= bounds.west &&
    longitude <= bounds.east
  );
}

/**
 * Kiểm tra khoảng cách có hợp lý không dựa trên địa chỉ
 */
function isReasonableDistance(result, address, expectedRegion) {
  const lowerAddr = address.toLowerCase();

  // Định nghĩa tọa độ trung tâm các khu vực
  const centralPoints = {
    hiep_binh_chanh: { lat: 10.8454, lon: 106.7717 },
    thu_duc: { lat: 10.8505, lon: 106.7717 },
    quan_1: { lat: 10.7769, lon: 106.7009 },
    quan_3: { lat: 10.7829, lon: 106.6926 },
  };

  // Tìm khu vực được nhắc đến trong địa chỉ
  let expectedPoint = null;
  if (lowerAddr.includes("hiep binh") || lowerAddr.includes("hiệp bình")) {
    expectedPoint = centralPoints.hiep_binh_chanh;
  } else if (lowerAddr.includes("thu duc") || lowerAddr.includes("thủ đức")) {
    expectedPoint = centralPoints.thu_duc;
  } else if (lowerAddr.includes("quan 1") || lowerAddr.includes("quận 1")) {
    expectedPoint = centralPoints.quan_1;
  } else if (lowerAddr.includes("quan 3") || lowerAddr.includes("quận 3")) {
    expectedPoint = centralPoints.quan_3;
  }

  if (expectedPoint) {
    const distance = calculateDistance(
      expectedPoint.lat,
      expectedPoint.lon,
      result.latitude,
      result.longitude
    );

    // Khoảng cách > 10km là không hợp lý
    const isReasonable = distance < 10000;
    console.log(
      `📏 Khoảng cách từ khu vực mong đợi: ${distance.toFixed(0)}m - ${isReasonable ? "Hợp lý" : "Quá xa"}`
    );

    return isReasonable;
  }

  return true; // Không xác định được khu vực -> accept
}

/**
 * Helper function tính khoảng cách
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // meters
}

/**
 * Lấy khoảng cách từ khu vực mong đợi
 */
function getDistanceFromExpected(result, address) {
  const lowerAddr = address.toLowerCase();

  const centralPoints = {
    hiep_binh_chanh: { lat: 10.8454, lon: 106.7717 },
    thu_duc: { lat: 10.8505, lon: 106.7717 },
    quan_1: { lat: 10.7769, lon: 106.7009 },
  };

  let expectedPoint = null;
  if (lowerAddr.includes("hiep binh") || lowerAddr.includes("hiệp bình")) {
    expectedPoint = centralPoints.hiep_binh_chanh;
  } else if (lowerAddr.includes("thu duc") || lowerAddr.includes("thủ đức")) {
    expectedPoint = centralPoints.thu_duc;
  } else if (lowerAddr.includes("quan 1") || lowerAddr.includes("quận 1")) {
    expectedPoint = centralPoints.quan_1;
  }

  if (expectedPoint) {
    return calculateDistance(
      expectedPoint.lat,
      expectedPoint.lon,
      result.latitude,
      result.longitude
    );
  }

  return 0; // Không xác định được -> coi như gần
}

/**
 * Lấy tọa độ fallback cho khu vực cụ thể
 */
function getRegionalFallback(address, expectedRegion) {
  const lowerAddr = address.toLowerCase();

  const regions = {
    hcm: {
      districts: {
        hiep_binh_chanh: {
          lat: 10.8454,
          lon: 106.7717,
          name: "Hiệp Bình Chánh",
        },
        thu_duc: { lat: 10.8505, lon: 106.7717, name: "Thủ Đức" },
        quan_1: { lat: 10.7769, lon: 106.7009, name: "Quận 1" },
        quan_3: { lat: 10.7829, lon: 106.6926, name: "Quận 3" },
        binh_thanh: { lat: 10.8014, lon: 106.7109, name: "Bình Thạnh" },
      },
    },
  };

  const region = regions[expectedRegion.toLowerCase()];
  if (!region) return null;

  // Kiểm tra từ khóa trong địa chỉ
  if (lowerAddr.includes("hiep binh") || lowerAddr.includes("hiệp bình")) {
    return {
      latitude: region.districts.hiep_binh_chanh.lat,
      longitude: region.districts.hiep_binh_chanh.lon,
      confidence: 0.7, // Medium confidence cho fallback
      source: "regional_fallback",
      displayName: "Hiệp Bình Chánh, Thủ Đức, Hồ Chí Minh (tọa độ trung tâm)",
      isFallback: true,
    };
  }

  if (lowerAddr.includes("thu duc") || lowerAddr.includes("thủ đức")) {
    return {
      latitude: region.districts.thu_duc.lat,
      longitude: region.districts.thu_duc.lon,
      confidence: 0.7,
      source: "regional_fallback",
      displayName: "Thủ Đức, Hồ Chí Minh (tọa độ trung tâm)",
      isFallback: true,
    };
  }

  if (lowerAddr.includes("quan 1") || lowerAddr.includes("quận 1")) {
    return {
      latitude: region.districts.quan_1.lat,
      longitude: region.districts.quan_1.lon,
      confidence: 0.7,
      source: "regional_fallback",
      displayName: "Quận 1, Hồ Chí Minh (tọa độ trung tâm)",
      isFallback: true,
    };
  }

  // Default fallback cho HCM
  if (expectedRegion.toLowerCase() === "hcm") {
    return {
      latitude: 10.7769, // Quận 1 center
      longitude: 106.7009,
      confidence: 0.5,
      source: "regional_fallback",
      displayName: "Hồ Chí Minh (tọa độ trung tâm)",
      isFallback: true,
    };
  }

  return null;
}

/**
 * Sửa địa chỉ thiếu thông tin
 */
function fixIncompleteAddress(address) {
  // Nếu chỉ có "đường hiệp bình" -> thêm thông tin cụ thể
  if (
    address.toLowerCase().includes("hiệp bình") &&
    !address.toLowerCase().includes("phạm văn đồng")
  ) {
    return address.replace(
      /đường hiệp bình/gi,
      "Phạm Văn Đồng, Hiệp Bình Chánh"
    );
  }

  // Nếu thiếu từ "đường"
  if (!/đường|phố|street/i.test(address) && /\d+\s+\w+/.test(address)) {
    const parts = address.split(",");
    if (parts[0]) {
      parts[0] = parts[0].replace(/(\d+\s+)(.+)/, "$1đường $2");
      return parts.join(",");
    }
  }

  return address;
}

/**
 * Fallback về quận/huyện khi không tìm thấy địa chỉ cụ thể
 */
function fallbackToDistrict(address) {
  // Tìm thông tin quận/phường trong address
  const districtMatch = address.match(
    /(phường [^,]+|quận [^,]+|thành phố thủ đức)/i
  );
  const provinceMatch = address.match(/(thành phố hồ chí minh|tp\.?\s*hcm)/i);

  if (districtMatch) {
    let fallback = districtMatch[1];
    if (provinceMatch) {
      fallback += ", " + provinceMatch[1];
    } else {
      fallback += ", Hồ Chí Minh";
    }
    return fallback;
  }

  return "Thủ Đức, Hồ Chí Minh"; // Default fallback
}

/**
 * Smart completion cho địa chỉ dựa trên patterns phổ biến
 */
function smartCompleteAddress(address) {
  const lowerAddr = address.toLowerCase();

  // Pattern: "39 ,đường hiệp bình" -> "39 Phạm Văn Đồng, Hiệp Bình Chánh"
  if (lowerAddr.includes("hiệp bình") || lowerAddr.includes("hiep binh")) {
    const numberMatch = address.match(/^\d+/);
    const number = numberMatch ? numberMatch[0] : "";
    return `${number} Phạm Văn Đồng, Hiệp Bình Chánh, Thủ Đức, Hồ Chí Minh`;
  }

  // Pattern: Các khu vực phổ biến khác
  const commonAreas = {
    "bình thạnh": "Bình Thạnh, Hồ Chí Minh",
    "quận 1": "Quận 1, Hồ Chí Minh",
    "quận 3": "Quận 3, Hồ Chí Minh",
    "tân bình": "Tân Bình, Hồ Chí Minh",
    "gò vấp": "Gò Vấp, Hồ Chí Minh",
  };

  for (const [area, fullAddress] of Object.entries(commonAreas)) {
    if (lowerAddr.includes(area)) {
      const numberMatch = address.match(/^\d+/);
      const number = numberMatch ? numberMatch[0] + " " : "";
      return number + fullAddress;
    }
  }

  return address;
}

/**
 * Gợi ý sửa địa chỉ khi geocoding thất bại
 */
async function suggestAddressCorrections(address) {
  const suggestions = [];

  // Suggestion 1: Thêm thành phố
  if (
    !address.toLowerCase().includes("hồ chí minh") &&
    !address.toLowerCase().includes("hcm")
  ) {
    suggestions.push(`${address}, TP. Hồ Chí Minh`);
  }

  // Suggestion 2: Sửa lỗi chính tả phổ biến
  const corrected = address
    .replace(/phạm văn đồng/gi, "Phạm Văn Đồng")
    .replace(/lê lợi/gi, "Lê Lợi")
    .replace(/nguyễn huệ/gi, "Nguyễn Huệ")
    .replace(/trần hưng đạo/gi, "Trần Hưng Đạo")
    .replace(/hiệp bình/gi, "Hiệp Bình Chánh"); // Cải thiện cho trường hợp này

  if (corrected !== address) {
    suggestions.push(corrected);
  }

  // Suggestion 3: Smart completion
  const smartAddress = smartCompleteAddress(address);
  if (smartAddress !== address) {
    suggestions.push(smartAddress);
  }

  // Suggestion 4: Fallback district
  const districtFallback = fallbackToDistrict(address);
  if (districtFallback !== address) {
    suggestions.push(districtFallback);
  }

  // Suggestion 5: Format khác
  suggestions.push(standardizeVietnameseAddress(address));

  return [...new Set(suggestions)]; // Remove duplicates
}

/**
 * Batch validate addresses (cho nhiều đơn hàng)
 */
async function batchValidateAddresses(addresses, batchSize = 5) {
  const results = [];

  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize);

    console.log(
      `🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(addresses.length / batchSize)}`
    );

    const batchPromises = batch.map(async (addr, index) => {
      const result = await validateAndImproveGeocode(
        addr.address,
        addr.expectedRegion
      );
      return {
        originalIndex: i + index,
        address: addr.address,
        ...result,
      };
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Delay giữa các batch để không spam API
    if (i + batchSize < addresses.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}

module.exports = {
  validateAndImproveGeocode,
  tryAlternativeFormats,
  suggestAddressCorrections,
  batchValidateAddresses,
  standardizeVietnameseAddress,
};

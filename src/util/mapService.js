const axios = require("axios");

// 1. "BỘ NÃO" OSRM CỦA BẠN
const OSRM_SERVER_URL = "http://127.0.0.1:5000"; // Phải đảm bảo Docker OSRM đang chạy!

/**
 * HÀM 1: LẤY TỌA ĐỘ TỪ ĐỊA CHỈ - MULTIPLE FALLBACK STRATEGIES
 * Sử dụng nhiều geocoding service để đảm bảo độ chính xác cao
 * @param {string} address - Địa chỉ (ví dụ: "123 Lê Lợi, P. Bến Thành, Q.1, TP.HCM")
 * @returns {Promise<object|null>} { latitude, longitude, confidence, source }
 */
const { searchVietnameseAddressDB } = require("./vietnamAddressDB");

/**
 * OPTIMIZED GEOCODING - VIETNAM DB + MAPBOX
 * Ưu tiên độ chính xác: Vietnam DB (95%+) → Mapbox (80-95%)
 */
async function geocodeAddress(address) {
  console.log(`🔍 Geocoding địa chỉ: ${address}`);

  // Priority 1: 🇻🇳 Vietnam Address Database (Highest accuracy - 95%+ confidence)
  const vietnamDBResult = searchVietnameseAddressDB(address);
  if (vietnamDBResult) {
    console.log(
      `🥇 Vietnam DB SUCCESS: ${vietnamDBResult.displayName} - Confidence: ${(vietnamDBResult.confidence * 100).toFixed(1)}%`
    );
    return vietnamDBResult;
  }

  // Priority 2: 🗺️ Mapbox Geocoding (High accuracy - 80-95% confidence)
  const mapboxResult = await tryMapboxGeocoding(address);
  if (mapboxResult && mapboxResult.confidence > 0.5) {
    console.log(
      `🥈 Mapbox SUCCESS: ${mapboxResult.displayName} - Confidence: ${(mapboxResult.confidence * 100).toFixed(1)}%`
    );
    return mapboxResult;
  }

  console.error(`❌ Không tìm thấy tọa độ cho địa chỉ: ${address}`);
  console.log(
    `💡 Gợi ý: Kiểm tra lại định dạng địa chỉ hoặc thêm vào Vietnam Address Database`
  );
  return null;
}

/**
 * GOOGLE MAPS GEOCODING - SIMPLIFIED SINGLE SERVICE
 * API Key: AIzaSyBqA9agThQfCJtE54OzaufTKetrswFWOIk
 */
async function tryGoogleMapsGeocoding(address) {
  const GOOGLE_MAPS_API_KEY = "AIzaSyBqA9agThQfCJtE54OzaufTKetrswFWOIk";

  // Multiple query strategies for better coverage
  const queries = [
    address + ", Vietnam",
    address + ", Ho Chi Minh City, Vietnam",
    address + ", TP.HCM, Vietnam",
    address, // Raw address
  ];

  for (const query of queries) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}&region=vn&language=vi`;

      console.log(`🗺️ Google Maps query: ${query}`);
      const response = await axios.get(url, { timeout: 15000 });

      if (response.data.status === "OK" && response.data.results.length > 0) {
        const result = response.data.results[0];

        // Enhanced confidence calculation
        let confidence = 0.3; // Lower base for better acceptance

        // Location type scoring
        switch (result.geometry.location_type) {
          case "ROOFTOP":
            confidence = 0.95; // Exact address
            break;
          case "RANGE_INTERPOLATED":
            confidence = 0.85; // Interpolated address
            break;
          case "GEOMETRIC_CENTER":
            confidence = 0.7; // Center of area
            break;
          case "APPROXIMATE":
            confidence = 0.5; // Approximate location
            break;
          default:
            confidence = 0.4;
        }

        // Type bonuses
        if (result.types.includes("street_address")) confidence += 0.05;
        if (result.types.includes("premise")) confidence += 0.05;
        if (result.types.includes("subpremise")) confidence += 0.05;
        if (result.types.includes("establishment")) confidence += 0.03;

        // Vietnam context bonus
        if (
          result.formatted_address.toLowerCase().includes("vietnam") ||
          result.formatted_address.toLowerCase().includes("việt nam")
        ) {
          confidence += 0.02;
        }

        // Penalty for too general
        if (
          result.types.includes("country") ||
          result.types.includes("administrative_area_level_1")
        ) {
          confidence -= 0.3;
        }

        confidence = Math.min(Math.max(confidence, 0), 1.0);

        console.log(
          `✅ Google Maps SUCCESS: (${result.geometry.location.lat}, ${result.geometry.location.lng})`
        );
        console.log(
          `   📊 Confidence: ${confidence.toFixed(3)} | Type: ${result.geometry.location_type}`
        );
        console.log(`   📍 Address: ${result.formatted_address}`);

        return {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          confidence: confidence,
          source: "google_maps",
          displayName: result.formatted_address,
          locationType: result.geometry.location_type,
          types: result.types,
        };
      }

      // Try next query if this one failed
      console.log(`   ⏭️ No results, trying next query...`);
    } catch (err) {
      console.log(`   ⚠️ Query failed: ${err.message}`);
      continue; // Try next query
    }

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  // Handle common error cases
  try {
    const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=Saigon&key=${GOOGLE_MAPS_API_KEY}`;
    const testResponse = await axios.get(testUrl);

    if (testResponse.data.status === "REQUEST_DENIED") {
      console.log(`❌ CRITICAL: Google Maps API key bị từ chối`);
      console.log(`   💡 Cần enable Geocoding API và setup billing account`);
      console.log(`   🔗 https://console.cloud.google.com/`);
    } else if (testResponse.data.status === "OVER_QUERY_LIMIT") {
      console.log(`❌ QUOTA: Google Maps đã vượt quota`);
    } else {
      console.log(
        `❌ NO RESULTS: Không tìm thấy địa chỉ "${address}" với Google Maps`
      );
    }
  } catch (err) {
    console.log(`❌ CONNECTION: Không thể kết nối Google Maps API`);
  }

  return null;
}

/**
 * 🇻🇳 VIETNAMESE ADDRESS PROCESSING HELPERS
 */

function cleanVietnameseAddress(address) {
  if (!address || typeof address !== "string") return "";

  return address
    .replace(
      /[^\w\s,.\-àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ]/g,
      " "
    )
    .replace(/\s+/g, " ")
    .replace(/\b(số|s)\b/gi, "")
    .replace(/\b(phường|p\.?)\s*(\d+|\w+)/gi, "Ward $2")
    .replace(/\b(quận|q\.?)\s*(\d+|\w+)/gi, "District $2")
    .replace(/\b(đường|đ\.?)\s*/gi, "")
    .replace(/tp\.?\s*hcm|ho\s*chi\s*minh/gi, "Ho Chi Minh City")
    .trim();
}

function enhanceStreetAddress(address) {
  if (!address) return address;

  // Extract house number and street
  const match = address.match(/(\d+[a-z]?)\s*(.+)/i);
  if (match) {
    return `${match[1]} ${match[2]}`.trim();
  }
  return address;
}

function extractStreetName(address) {
  if (!address) return address;

  // Remove specific components, keep main street
  return address
    .replace(/\b(số|phường|quận|p\.|q\.)\s*[\w\d]+/gi, "")
    .replace(/\b(ward|district)\s*[\w\d]+/gi, "")
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractDistrictFromAddress(address) {
  if (!address) return "";

  const districtMatch = address.match(/\b(quận|q\.?|district)\s*([^,\s]+)/i);
  if (districtMatch) {
    return `District ${districtMatch[2]}, Ho Chi Minh City`;
  }

  const wardMatch = address.match(/\b(phường|p\.?|ward)\s*([^,\s]+)/i);
  if (wardMatch) {
    return `Ward ${wardMatch[2]}, Ho Chi Minh City`;
  }

  return "Ho Chi Minh City";
}

/**
 * 🗺️ MAPBOX GEOCODING - Enhanced for Vietnam Addresses
 * Multiple query strategies for maximum accuracy
 */
async function tryMapboxGeocoding(address) {
  const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || null;

  if (!MAPBOX_ACCESS_TOKEN) {
    console.log(`⚠️ Mapbox: Access token không được cấu hình`);
    return null;
  }

  // Clean and normalize address
  const cleanAddress = cleanVietnameseAddress(address);

  // Multiple query formats optimized for Vietnam
  const queryFormats = [
    // Format 1: Original + Vietnam context
    cleanAddress + ", Ho Chi Minh City, Vietnam",
    cleanAddress + ", TP.HCM, Vietnam",
    cleanAddress + ", Vietnam",

    // Format 2: Enhanced street address
    enhanceStreetAddress(cleanAddress) + ", Ho Chi Minh City, Vietnam",

    // Format 3: Street-focused
    extractStreetName(cleanAddress) + ", Ho Chi Minh City, Vietnam",

    // Format 4: District fallback
    extractDistrictFromAddress(cleanAddress) + ", Ho Chi Minh City, Vietnam",

    // Format 5: Simplified clean
    cleanAddress.replace(/phường|p\.|quận|q\.|đường/gi, "").trim() +
      ", Vietnam",
  ];

  for (const query of queryFormats) {
    if (!query || query.includes("undefined") || query.length < 5) continue;

    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=vn&limit=3&types=address,poi,place`;

      const response = await axios.get(url, { timeout: 8000 });

      if (response.data.features && response.data.features.length > 0) {
        // Find best result based on relevance and context
        const bestResult = response.data.features
          .filter((f) => f.relevance > 0.4) // Filter low quality
          .sort((a, b) => b.relevance - a.relevance)[0];

        if (bestResult) {
          let confidence = bestResult.relevance;

          // Accuracy boosts
          if (bestResult.properties && bestResult.properties.address) {
            confidence += 0.1; // Has specific address number
          }

          // Vietnam context boost
          if (bestResult.context) {
            const hasVietnamContext = bestResult.context.some(
              (c) =>
                c.text &&
                (c.text.includes("Vietnam") || c.text.includes("Ho Chi Minh"))
            );
            if (hasVietnamContext) confidence += 0.1;
          }

          // Street address type boost
          if (
            bestResult.place_type &&
            bestResult.place_type.includes("address")
          ) {
            confidence += 0.05;
          }

          confidence = Math.min(confidence, 1.0);

          console.log(
            `🗺️ Mapbox found: ${query} → Confidence: ${(confidence * 100).toFixed(1)}%`
          );

          return {
            latitude: bestResult.center[1],
            longitude: bestResult.center[0],
            confidence: confidence,
            source: "mapbox",
            displayName: bestResult.place_name,
            address: bestResult.properties?.address || null,
            types: bestResult.place_type || [],
          };
        }
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log(`⚠️ Mapbox: Invalid access token`);
        return null; // Stop if token invalid
      }
      console.log(`⚠️ Mapbox query failed: ${query.substring(0, 40)}...`);
      continue;
    }

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`❌ Mapbox: No results found for "${address}"`);
  return null;
}

/**
 * Làm sạch địa chỉ Việt Nam
 */
function cleanVietnameseAddress(address) {
  return address
    .replace(/,\s*,/g, ",") // Bỏ dấu phẩy thừa
    .replace(/\s+,/g, ",") // Bỏ khoảng trắng trước dấu phẩy
    .replace(/,\s*/g, ", ") // Chuẩn hóa khoảng trắng sau dấu phẩy
    .replace(/\s+/g, " ") // Bỏ khoảng trắng thừa
    .replace(/^,\s*/, "") // Bỏ dấu phẩy ở đầu
    .replace(/\s*,$/, "") // Bỏ dấu phẩy ở cuối
    .trim();
}

/**
 * Trích xuất tên đường từ địa chỉ
 */
function extractStreetName(address) {
  // Regex để tìm tên đường
  const streetPatterns = [
    /\d+\s*,?\s*(.+?(?:đường|phố|street).*?)(?:,|$)/i,
    /(?:số\s*)?\d+\s+(.+?)(?:,|$)/i,
    /(.+?(?:đường|phố|street).*?)(?:,|phường|quận)/i,
  ];

  for (const pattern of streetPatterns) {
    const match = address.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Fallback: lấy phần đầu
  const parts = address.split(",");
  return parts[0] ? parts[0].trim() : address;
}

/**
 * Trích xuất thông tin quận/huyện từ địa chỉ
 */
function extractDistrictFromAddress(address) {
  const districtPattern =
    /(thành phố thủ đức|quận \d+|quận [^,]+|huyện [^,]+|thị xã [^,]+)/i;
  const match = address.match(districtPattern);
  return match ? match[1] : "";
}

/**
 * Enhance street address với context thông tin
 */
function enhanceStreetAddress(address) {
  const lowerAddr = address.toLowerCase();

  // Map specific areas to their main streets
  const areaEnhancements = {
    "hiệp bình chánh": "Pham Van Dong, Hiep Binh Chanh",
    "hiệp bình phước": "Pham Van Dong, Hiep Binh Phuoc",
    "hiệp bình": "Pham Van Dong, Hiep Binh Chanh",
    "thủ đức": "Thu Duc City",
    "quận 1": "District 1",
    "quận 3": "District 3",
    "bình thạnh": "Binh Thanh District",
  };

  for (const [area, enhancement] of Object.entries(areaEnhancements)) {
    if (lowerAddr.includes(area)) {
      // If address already has street number, preserve it
      const numberMatch = address.match(/^\d+/);
      const number = numberMatch ? numberMatch[0] + " " : "";
      return number + enhancement;
    }
  }

  return address;
}

/**
 * Dịch tên đường sang tiếng Anh (cho một số tên phổ biến)
 */
function translateStreetToEnglish(address) {
  const translations = {
    "hiệp bình chánh": "Hiep Binh Chanh",
    "hiệp bình": "Hiep Binh",
    "phạm văn đồng": "Pham Van Dong",
    "võ nguyên giáp": "Vo Nguyen Giap",
    "lê lợi": "Le Loi",
    "nguyễn huệ": "Nguyen Hue",
    "trần hưng đạo": "Tran Hung Dao",
    "thủ đức": "Thu Duc",
    quận: "District",
    phường: "Ward",
    đường: "Street",
    phố: "Street",
  };

  let result = address.toLowerCase();

  Object.entries(translations).forEach(([vietnamese, english]) => {
    const regex = new RegExp(vietnamese, "gi");
    result = result.replace(regex, english);
  });

  return result;
}

/**
 * HÀM 2: LẤY ĐƯỜNG ĐI CHI TIẾT (A -> B) - Dùng OSRM
 * (Dùng để VẼ đường đi cho shipper xem)
 * @param {object} startCoords - { latitude, longitude }
 * @param {object} endCoords - { latitude, longitude }
 * @returns {Promise<object|null>} Chi tiết đường đi
 */
async function getRoute(startCoords, endCoords) {
  // OSRM dùng format: {lon},{lat}
  const coords = `${startCoords.longitude},${startCoords.latitude};${endCoords.longitude},${endCoords.latitude}`;
  const url = `${OSRM_SERVER_URL}/route/v1/driving/${coords}?steps=true&geometries=geojson`;

  try {
    const response = await axios.get(url);
    const route = response.data.routes[0];

    if (!route) throw new Error("Không tìm thấy tuyến đường.");

    return {
      distance: (route.distance / 1000).toFixed(2) + " km", // km
      duration: Math.round(route.duration / 60) + " phút", // phút
      geometry: route.geometry.coordinates.map((coord) => ({
        latitude: coord[1],
        longitude: coord[0],
      })),
      // Lấy hướng dẫn (nếu cần)
      instructions: route.legs[0].steps.map(
        (step) => step.maneuver.instruction
      ),
    };
  } catch (error) {
    console.error("Lỗi khi lấy tuyến đường OSRM:", error.message);
    return null;
  }
}

/**
 * HÀM 3: LẤY MA TRẬN KHOẢNG CÁCH (N x N) - Dùng OSRM
 * (ĐẦU VÀO cho thuật toán VRP)
 * @param {array} points - Mảng các tọa độ [{ latitude, longitude }, ...]
 * @returns {Promise<array|null>} Ma trận 2 chiều (NxN) chứa khoảng cách (mét)
 */
async function getDistanceMatrix(points) {
  // OSRM dùng format: {lon},{lat};{lon},{lat};...
  const coordinatesString = points
    .map((p) => `${p.longitude},${p.latitude}`)
    .join(";");

  // API 'table' của OSRM
  const url = `${OSRM_SERVER_URL}/table/v1/driving/${coordinatesString}?annotations=distance`;

  try {
    const response = await axios.get(url);

    if (!response.data || response.data.code !== "Ok") {
      throw new Error("Không thể lấy ma trận OSRM.");
    }

    const matrix = response.data.distances;
    console.log(
      `✅ Lấy ma trận OSRM ${matrix.length}x${matrix.length} thành công.`
    );
    // Matrix trả về khoảng cách bằng mét (meters)
    return matrix;
  } catch (error) {
    console.error("Lỗi khi lấy Ma trận OSRM:", error.message);
    return null;
  }
}

module.exports = {
  geocodeAddress, // Step 1: Lấy tọa độ
  getDistanceMatrix, // Step 2: Lấy ma trận cho VRP
  getRoute, // Step 3: Vẽ đường đi (nếu cần)
};

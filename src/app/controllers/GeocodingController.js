/**
 * GEOCODING MANAGEMENT API
 * API để quản lý và cải thiện geocoding cho các đơn hàng
 */

const DonHang = require("../models/DonHang");
const {
  validateAndImproveGeocode,
  batchValidateAddresses,
  standardizeVietnameseAddress,
} = require("../../util/geocodingValidator");

class GeocodingController {
  /**
   * Kiểm tra geocoding quality của tất cả đơn hàng
   */
  async analyzeGeocodingQuality(req, res) {
    try {
      console.log("🔍 Phân tích chất lượng geocoding...");

      const orders = await DonHang.find({
        customerLocation: { $exists: true },
        status: { $nin: ["Đã hủy"] },
      }).select("address customerLocation geocodingInfo createdAt");

      const stats = {
        totalOrders: orders.length,
        withGeocoding: 0,
        highConfidence: 0, // >= 0.8
        mediumConfidence: 0, // 0.6-0.8
        lowConfidence: 0, // < 0.6
        noConfidenceData: 0,
        improved: 0,
        bySource: {},
      };

      const problemOrders = [];

      orders.forEach((order) => {
        if (order.customerLocation) {
          stats.withGeocoding++;

          const geocodingInfo = order.geocodingInfo;

          if (geocodingInfo) {
            const confidence = geocodingInfo.confidence || 0;

            if (confidence >= 0.8) stats.highConfidence++;
            else if (confidence >= 0.6) stats.mediumConfidence++;
            else stats.lowConfidence++;

            if (geocodingInfo.improved) stats.improved++;

            // Stats by source
            const source = geocodingInfo.source || "unknown";
            stats.bySource[source] = (stats.bySource[source] || 0) + 1;

            // Thu thập orders có vấn đề
            if (confidence < 0.6) {
              problemOrders.push({
                orderId: order._id,
                address: order.address,
                confidence: confidence,
                source: source,
                createdAt: order.createdAt,
              });
            }
          } else {
            stats.noConfidenceData++;
            // Orders không có thông tin confidence cũng là vấn đề
            problemOrders.push({
              orderId: order._id,
              address: order.address,
              confidence: null,
              source: "legacy",
              createdAt: order.createdAt,
            });
          }
        }
      });

      // Tính percentage
      stats.percentages = {
        withGeocoding: (
          (stats.withGeocoding / stats.totalOrders) *
          100
        ).toFixed(1),
        highConfidence: (
          (stats.highConfidence / stats.withGeocoding) *
          100
        ).toFixed(1),
        mediumConfidence: (
          (stats.mediumConfidence / stats.withGeocoding) *
          100
        ).toFixed(1),
        lowConfidence: (
          (stats.lowConfidence / stats.withGeocoding) *
          100
        ).toFixed(1),
      };

      res.json({
        success: true,
        stats,
        problemOrders: problemOrders.slice(0, 20), // Chỉ show 20 orders đầu
        recommendations: generateRecommendations(stats, problemOrders.length),
      });
    } catch (error) {
      console.error("Lỗi phân tích geocoding:", error);
      res.status(500).json({
        success: false,
        error: "Lỗi server khi phân tích geocoding",
      });
    }
  }

  /**
   * Batch fix geocoding cho các orders có vấn đề
   */
  async batchFixGeocode(req, res) {
    try {
      const { orderIds, confidence_threshold = 0.6 } = req.body;

      let ordersToFix;

      if (orderIds && orderIds.length > 0) {
        // Fix specific orders
        ordersToFix = await DonHang.find({
          _id: { $in: orderIds },
        }).select("address customerLocation geocodingInfo region");
      } else {
        // Fix all low confidence orders
        ordersToFix = await DonHang.find({
          $or: [
            { "geocodingInfo.confidence": { $lt: confidence_threshold } },
            { geocodingInfo: { $exists: false } },
          ],
          status: { $nin: ["Đã hủy"] },
        })
          .select("address customerLocation geocodingInfo region")
          .limit(50); // Limit để tránh overload
      }

      if (ordersToFix.length === 0) {
        return res.json({
          success: true,
          message: "Không tìm thấy orders cần fix geocoding",
          processed: 0,
        });
      }

      console.log(
        `🔧 Bắt đầu fix geocoding cho ${ordersToFix.length} orders...`
      );

      const results = [];
      const batchSize = 5; // Process 5 at a time to avoid API rate limits

      for (let i = 0; i < ordersToFix.length; i += batchSize) {
        const batch = ordersToFix.slice(i, i + batchSize);

        const batchPromises = batch.map(async (order) => {
          try {
            const result = await validateAndImproveGeocode(
              order.address,
              order.region
            );

            if (result.success) {
              // Update order với geocoding mới
              await DonHang.findByIdAndUpdate(order._id, {
                customerLocation: {
                  latitude: result.result.latitude,
                  longitude: result.result.longitude,
                },
                geocodingInfo: {
                  confidence: result.result.confidence,
                  source: result.result.source,
                  improved: result.improved || false,
                  originalConfidence: result.originalConfidence,
                  displayName: result.result.displayName,
                  validatedAt: new Date(),
                },
              });

              return {
                orderId: order._id,
                success: true,
                newConfidence: result.result.confidence,
                source: result.result.source,
                improved: result.improved || false,
              };
            } else {
              return {
                orderId: order._id,
                success: false,
                error: result.error,
                suggestions: result.suggestions,
              };
            }
          } catch (error) {
            return {
              orderId: order._id,
              success: false,
              error: error.message,
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Delay between batches
        if (i + batchSize < ordersToFix.length) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const improvedCount = results.filter(
        (r) => r.success && r.improved
      ).length;

      console.log(
        `✅ Hoàn thành batch fix: ${successCount}/${ordersToFix.length} thành công`
      );

      res.json({
        success: true,
        processed: ordersToFix.length,
        successful: successCount,
        improved: improvedCount,
        results: results,
      });
    } catch (error) {
      console.error("Lỗi batch fix geocoding:", error);
      res.status(500).json({
        success: false,
        error: "Lỗi server khi fix geocoding",
      });
    }
  }

  /**
   * Test geocoding cho một địa chỉ cụ thể
   */
  async testGeocode(req, res) {
    try {
      const { address, region } = req.body;

      if (!address) {
        return res.status(400).json({
          success: false,
          error: "Thiếu địa chỉ để test",
        });
      }

      console.log(`🧪 Test geocoding cho: ${address}`);

      const result = await validateAndImproveGeocode(address, region);

      res.json({
        success: true,
        address: address,
        result: result,
      });
    } catch (error) {
      console.error("Lỗi test geocoding:", error);
      res.status(500).json({
        success: false,
        error: "Lỗi server khi test geocoding",
      });
    }
  }
}

/**
 * Tạo recommendations dựa trên stats
 */
function generateRecommendations(stats, problemCount) {
  const recommendations = [];

  if (stats.percentages.lowConfidence > 20) {
    recommendations.push({
      type: "warning",
      message: `${stats.percentages.lowConfidence}% đơn hàng có geocoding confidence thấp (<0.6)`,
      action: "Nên chạy batch fix để cải thiện độ chính xác",
    });
  }

  if (stats.noConfidenceData > 0) {
    recommendations.push({
      type: "info",
      message: `${stats.noConfidenceData} đơn hàng không có thông tin confidence (legacy)`,
      action: "Chạy batch fix để thêm metadata geocoding",
    });
  }

  if (problemCount > 10) {
    recommendations.push({
      type: "action",
      message: `Phát hiện ${problemCount} đơn hàng có vấn đề geocoding`,
      action: "Khuyến nghị chạy batch fix ngay",
    });
  }

  // Recommendations về API keys
  if (!process.env.OPENCAGE_API_KEY && !process.env.MAPBOX_ACCESS_TOKEN) {
    recommendations.push({
      type: "enhancement",
      message: "Chỉ đang sử dụng Nominatim (miễn phí)",
      action: "Thêm OpenCage hoặc Mapbox API key để tăng độ chính xác",
    });
  }

  return recommendations;
}

module.exports = new GeocodingController();

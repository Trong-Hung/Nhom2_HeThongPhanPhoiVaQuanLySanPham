const express = require("express");
const router = express.Router();
const RouteOptimizationController = require("../app/controllers/RouteOptimizationController");
const { authenticateJWT, requireRole } = require("../middlewares/role");

/**
 * Route optimization endpoints
 * Yêu cầu authentication và role admin/shipper manager
 */

// @route   GET /api/routes/optimize
// @desc    Optimize delivery routes for active orders
// @access  Public (for testing)
router.get("/optimize", RouteOptimizationController.optimizeActiveRoutes);

// @route   GET /api/routes/shipper/:shipperId
// @desc    Get optimized route for specific shipper
// @access  Admin, Shipper Manager, Shipper (own route only)
router.get(
  "/shipper/:shipperId",
  authenticateJWT,
  requireRole(["admin", "shipper_manager", "shipper"]),
  (req, res, next) => {
    // Shipper can only view their own route
    if (req.user.role === "shipper" && req.user.id !== req.params.shipperId) {
      return res.status(403).json({
        success: false,
        message: "Bạn chỉ có thể xem tuyến đường của mình",
      });
    }
    next();
  },
  RouteOptimizationController.getShipperRoute
);

// @route   POST /api/routes/manual-assign
// @desc    Manually assign orders to shipper
// @access  Admin, Shipper Manager
router.post(
  "/manual-assign",
  authenticateJWT,
  requireRole(["admin", "shipper_manager"]),
  async (req, res) => {
    try {
      const { shipperId, orderIds } = req.body;

      if (!shipperId || !orderIds || !Array.isArray(orderIds)) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin shipperId hoặc orderIds",
        });
      }

      const DonHang = require("../app/models/DonHang");

      // Update orders
      await DonHang.updateMany(
        { _id: { $in: orderIds } },
        {
          shipperId: shipperId,
          status: "processing",
          assignedAt: new Date(),
          assignedBy: req.user.id,
        }
      );

      res.json({
        success: true,
        message: `Đã gán ${orderIds.length} đơn hàng cho shipper`,
        data: { shipperId, orderIds },
      });
    } catch (error) {
      console.error("❌ Manual assign error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi gán đơn hàng",
        error: error.message,
      });
    }
  }
);

// @route   GET /api/routes/dashboard
// @desc    Get route optimization dashboard data
// @access  Admin, Shipper Manager
router.get(
  "/dashboard",
  authenticateJWT,
  requireRole(["admin", "shipper_manager"]),
  async (req, res) => {
    try {
      const { date = new Date().toISOString().split("T")[0] } = req.query;

      const DonHang = require("../app/models/DonHang");
      const User = require("../app/models/User");

      const queryDate = new Date(date);

      // Get statistics
      const totalOrders = await DonHang.countDocuments({
        deliveryDate: queryDate,
      });

      const assignedOrders = await DonHang.countDocuments({
        deliveryDate: queryDate,
        shipperId: { $ne: null },
      });

      const completedOrders = await DonHang.countDocuments({
        deliveryDate: queryDate,
        status: "delivered",
      });

      const activeShippers = await User.countDocuments({
        role: "shipper",
        isActive: true,
      });

      // Get shipper performance
      const shipperPerformance = await DonHang.aggregate([
        {
          $match: {
            deliveryDate: queryDate,
            shipperId: { $ne: null },
          },
        },
        {
          $group: {
            _id: "$shipperId",
            totalOrders: { $sum: 1 },
            completedOrders: {
              $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
            },
            totalDistance: { $sum: "$estimatedDeliveryTime" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "shipper",
          },
        },
        {
          $unwind: "$shipper",
        },
        {
          $project: {
            name: "$shipper.fullname",
            totalOrders: 1,
            completedOrders: 1,
            completionRate: {
              $multiply: [
                { $divide: ["$completedOrders", "$totalOrders"] },
                100,
              ],
            },
            totalDistance: 1,
          },
        },
      ]);

      res.json({
        success: true,
        data: {
          overview: {
            date: date,
            totalOrders,
            assignedOrders,
            unassignedOrders: totalOrders - assignedOrders,
            completedOrders,
            activeShippers,
            assignmentRate:
              ((assignedOrders / totalOrders) * 100).toFixed(1) + "%",
            completionRate:
              ((completedOrders / totalOrders) * 100).toFixed(1) + "%",
          },
          shipperPerformance: shipperPerformance,
        },
      });
    } catch (error) {
      console.error("❌ Dashboard error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi tải dashboard",
        error: error.message,
      });
    }
  }
);

// @route   GET /api/routes/test-osrm
// @desc    Test OSRM connection and distance calculation
// @access  Public (for testing)
router.get("/test-osrm", async (req, res) => {
  try {
    const axios = require("axios");

    // Test points in Ho Chi Minh City
    const testPoints = [
      {
        lat: 10.835067828591106,
        lng: 106.73007578112086,
        name: "Warehouse (908 Phạm Văn Đồng)",
      },
      { lat: 10.8231, lng: 106.6297, name: "District 1" },
      { lat: 10.7769, lng: 106.7009, name: "District 7" },
    ];

    const coordinates = testPoints.map((p) => `${p.lng},${p.lat}`).join(";");
    const osrmUrl = `http://localhost:5000/table/v1/driving/${coordinates}?annotations=distance,duration`;

    console.log("Testing OSRM:", osrmUrl);

    const response = await axios.get(osrmUrl, { timeout: 5000 });

    if (response.data.code === "Ok") {
      const distances = response.data.distances;
      const durations = response.data.durations;

      const results = [];
      for (let i = 0; i < testPoints.length; i++) {
        for (let j = 0; j < testPoints.length; j++) {
          if (i !== j) {
            results.push({
              from: testPoints[i].name,
              to: testPoints[j].name,
              distance: `${(distances[i][j] / 1000).toFixed(2)} km`,
              duration: `${(durations[i][j] / 60).toFixed(1)} phút`,
            });
          }
        }
      }

      res.json({
        success: true,
        message: "OSRM server hoạt động bình thường",
        data: {
          osrmStatus: "Connected",
          serverUrl: "http://localhost:5000",
          testResults: results,
        },
      });
    } else {
      throw new Error(`OSRM returned code: ${response.data.code}`);
    }
  } catch (error) {
    console.error("❌ OSRM test error:", error);

    let message = "OSRM server không khả dụng";
    if (error.code === "ECONNREFUSED") {
      message = "Không thể kết nối OSRM server tại localhost:5000";
    } else if (error.code === "ETIMEDOUT") {
      message = "OSRM server timeout";
    }

    res.status(500).json({
      success: false,
      message: message,
      error: error.message,
      suggestion: "Hãy đảm bảo OSRM server đang chạy trên port 5000",
    });
  }
});

module.exports = router;

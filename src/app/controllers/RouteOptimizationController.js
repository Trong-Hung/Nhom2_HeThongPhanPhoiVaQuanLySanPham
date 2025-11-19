const VRPService = require("../../services/VRPService");
const DonHang = require("../models/DonHang");
const User = require("../models/User");
const Warehouse = require("../models/Warehouse");
const axios = require("axios");

class RouteOptimizationController {
  /**
   * Optimize routes for active orders
   * GET /api/routes/optimize
   */
  async optimizeActiveRoutes(req, res) {
    try {
      const { warehouseId, date, algorithm = "auto" } = req.query;

      console.log("🚀 Starting route optimization...");

      // Get active orders
      const orders = await this.getActiveOrders(warehouseId, date);
      if (orders.length === 0) {
        return res.json({
          success: true,
          message: "Không có đơn hàng nào cần tối ưu",
          data: { routes: [], totalDistance: 0 },
        });
      }

      // Get available shippers
      const shippers = await this.getAvailableShippers(warehouseId);
      if (shippers.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Không có shipper nào khả dụng",
        });
      }

      // Get warehouse
      const warehouse = await Warehouse.findById(warehouseId);
      if (!warehouse) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy kho",
        });
      }

      // Build distance matrix using OSRM
      const distanceMatrix = await this.buildDistanceMatrix(warehouse, orders);

      // Solve VRP
      const vrpProblem = {
        distanceMatrix,
        orders: orders.map((order) => ({
          id: order._id,
          customerLocation: {
            lat: order.customerLocation.lat || order.customerLocation.latitude,
            lng: order.customerLocation.lng || order.customerLocation.longitude,
          },
          weight: order.totalWeight || 1,
          priority: order.priority || "normal",
          timeWindow: order.deliveryTimeWindow,
          address: order.customerAddress,
        })),
        vehicles: shippers.map((shipper) => ({
          id: shipper._id,
          name: shipper.fullname,
          capacity: shipper.capacity || 20, // kg
          workingHours: shipper.workingHours || { start: 8, end: 18 },
          preference: shipper.performance || 0,
        })),
        depot: {
          id: warehouse._id,
          name: warehouse.name,
          location: warehouse.location,
        },
        options: {
          algorithm,
          optimizationIterations: 100,
          considerTraffic: true,
        },
      };

      let solution;
      if (algorithm === "multi_vehicle" || shippers.length > 1) {
        solution = VRPService.solveMultiVehicleVRP(vrpProblem);
      } else {
        solution = VRPService.optimizeDeliveryRoutes(
          vrpProblem.orders,
          vrpProblem.vehicles,
          vrpProblem.depot,
          vrpProblem.options
        );
      }

      // Add detailed routing information
      const detailedRoutes = await this.addRoutingDetails(
        solution.routes,
        warehouse
      );

      // Save optimization results
      await this.saveOptimizationResults(solution, orders);

      res.json({
        success: true,
        message: `Tối ưu thành công ${orders.length} đơn hàng cho ${shippers.length} shipper`,
        data: {
          ...solution,
          routes: detailedRoutes,
          summary: {
            totalOrders: orders.length,
            totalShippers: shippers.length,
            averageDistance:
              (solution.totalDistance / solution.routes.length / 1000).toFixed(
                1
              ) + "km",
            estimatedTime: solution.totalTime + " phút",
            algorithm: solution.stats.algorithm,
          },
        },
      });
    } catch (error) {
      console.error("❌ Route optimization error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi tối ưu tuyến đường",
        error: error.message,
      });
    }
  }

  /**
   * Get optimized route for specific shipper
   * GET /api/routes/shipper/:shipperId
   */
  async getShipperRoute(req, res) {
    try {
      const { shipperId } = req.params;
      const { date = new Date().toISOString().split("T")[0] } = req.query;

      // Get shipper's assigned orders for the date
      const orders = await DonHang.find({
        shipperId: shipperId,
        deliveryDate: new Date(date),
        status: { $in: ["confirmed", "processing", "out_for_delivery"] },
      }).populate("customerId", "fullname phone address");

      if (orders.length === 0) {
        return res.json({
          success: true,
          message: "Shipper chưa có đơn hàng nào",
          data: { route: [], totalDistance: 0 },
        });
      }

      // Get shipper info
      const shipper = await User.findById(shipperId);
      const warehouse = await Warehouse.findOne(); // Get default warehouse

      // Optimize single route
      const points = [
        warehouse.location,
        ...orders.map((o) => ({
          lat: o.customerLocation.lat || o.customerLocation.latitude,
          lng: o.customerLocation.lng || o.customerLocation.longitude,
        })),
      ];
      const distanceMatrix = await this.buildDistanceMatrixFromPoints(points);

      const solution = VRPService.solveNearestNeighborOptimized(
        distanceMatrix,
        {
          startPoint: 0,
          returnToStart: true,
          maxOptimizationIterations: 50,
        }
      );

      // Add routing details with OSRM
      const routeWithDirections = await this.getDetailedRoute(
        points,
        solution.route
      );

      res.json({
        success: true,
        data: {
          shipper: {
            id: shipper._id,
            name: shipper.fullname,
            phone: shipper.phone,
          },
          route: solution.route,
          orders: orders,
          totalDistance: solution.totalDistance,
          estimatedTime: Math.round((solution.totalDistance / 1000) * 2.5), // minutes
          routeGeometry: routeWithDirections.geometry,
          directions: routeWithDirections.directions,
          optimization: {
            algorithm: solution.algorithm,
            improvement: solution.improvement,
          },
        },
      });
    } catch (error) {
      console.error("❌ Shipper route error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi lấy tuyến đường shipper",
        error: error.message,
      });
    }
  }

  /**
   * Build distance matrix using OSRM
   */
  async buildDistanceMatrix(warehouse, orders) {
    const points = [
      warehouse.location, // depot at index 0
      ...orders.map((order) => ({
        lat: order.customerLocation.lat || order.customerLocation.latitude,
        lng: order.customerLocation.lng || order.customerLocation.longitude,
      })),
    ];

    return await this.buildDistanceMatrixFromPoints(points);
  }

  async buildDistanceMatrixFromPoints(points) {
    const n = points.length;
    const matrix = Array(n)
      .fill()
      .map(() => Array(n).fill(0));

    console.log(`🗺️  Building ${n}x${n} distance matrix using OSRM...`);

    try {
      // Prepare coordinates for OSRM (longitude,latitude format)
      const coordinates = points
        .map((point) => {
          const lng = point.lng || point.longitude;
          const lat = point.lat || point.latitude;
          return `${lng},${lat}`;
        })
        .join(";");

      // Call OSRM table service
      const osrmUrl = `http://localhost:5000/table/v1/driving/${coordinates}?annotations=distance,duration`;

      console.log("OSRM Request URL:", osrmUrl);

      const response = await axios.get(osrmUrl);

      if (response.data.code !== "Ok") {
        throw new Error(`OSRM Error: ${response.data.message}`);
      }

      const distances = response.data.distances; // meters
      const durations = response.data.durations; // seconds

      // Fill matrix
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          matrix[i][j] = Math.round(distances[i][j]); // meters
        }
      }

      console.log(`✅ Distance matrix built successfully`);
      console.log(
        `   Sample distances: 0->1: ${matrix[0][1]}m, 1->2: ${matrix[1][2]}m`
      );

      return matrix;
    } catch (error) {
      console.warn(
        "⚠️  OSRM not available, falling back to Haversine distance"
      );

      // Fallback to Haversine formula
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (i === j) {
            matrix[i][j] = 0;
          } else {
            matrix[i][j] = this.calculateHaversineDistance(
              points[i],
              points[j]
            );
          }
        }
      }

      return matrix;
    }
  }

  /**
   * Get detailed route with turn-by-turn directions
   */
  async getDetailedRoute(points, routeIndices) {
    try {
      // Reorder points according to route
      const orderedPoints = routeIndices.map((idx) => points[idx]);
      const coordinates = orderedPoints
        .map((p) => {
          const lng = p.lng || p.longitude;
          const lat = p.lat || p.latitude;
          return `${lng},${lat}`;
        })
        .join(";");

      const osrmUrl = `http://localhost:5000/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true`;

      const response = await axios.get(osrmUrl);

      if (response.data.code === "Ok" && response.data.routes.length > 0) {
        const route = response.data.routes[0];

        return {
          geometry: route.geometry,
          distance: route.distance,
          duration: route.duration,
          directions: route.legs.map((leg) => ({
            distance: leg.distance,
            duration: leg.duration,
            steps: leg.steps.map((step) => ({
              instruction: step.maneuver.instruction || "Tiếp tục",
              distance: step.distance,
              duration: step.duration,
              geometry: step.geometry,
            })),
          })),
        };
      }
    } catch (error) {
      console.warn(
        "⚠️  Could not get detailed route from OSRM:",
        error.message
      );
    }

    // Fallback - return simple geometry
    return {
      geometry: {
        type: "LineString",
        coordinates: orderedPoints.map((p) => {
          const lng = p.lng || p.longitude;
          const lat = p.lat || p.latitude;
          return [lng, lat];
        }),
      },
      distance: 0,
      duration: 0,
      directions: [],
    };
  }

  /**
   * Add routing details to solution routes
   */
  async addRoutingDetails(routes, warehouse) {
    const detailedRoutes = [];

    for (const route of routes) {
      const points = [warehouse.location];

      // Add customer locations according to route order
      route.orders.forEach((order) => {
        points.push({
          lat: order.customerLocation.lat || order.customerLocation.latitude,
          lng: order.customerLocation.lng || order.customerLocation.longitude,
        });
      });

      // Add return to warehouse
      points.push(warehouse.location);

      const routeDetails = await this.getDetailedRoute(
        points,
        Array.from({ length: points.length }, (_, i) => i)
      );

      detailedRoutes.push({
        ...route,
        geometry: routeDetails.geometry,
        directions: routeDetails.directions,
        actualDistance: routeDetails.distance,
        actualDuration: routeDetails.duration,
      });
    }

    return detailedRoutes;
  }

  /**
   * Get active orders for optimization
   */
  async getActiveOrders(warehouseId, date) {
    const queryDate = date ? new Date(date) : new Date();

    // Create date range for the entire day
    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`🔍 Searching for orders:`);
    console.log(`  - Warehouse ID: ${warehouseId}`);
    console.log(
      `  - Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`
    );

    const orders = await DonHang.find({
      warehouseId: warehouseId,
      estimatedDelivery: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: { $in: ["Chờ xác nhận", "Đang sắp xếp"] }, // Vietnamese status
      $or: [{ shipperId: null }, { shipperId: { $exists: false } }], // Unassigned orders
    }).populate("userId", "fullname phone");

    console.log(`📦 Found ${orders.length} orders matching criteria`);

    return orders.filter(
      (order) =>
        order.customerLocation &&
        (order.customerLocation.lat || order.customerLocation.latitude) &&
        (order.customerLocation.lng || order.customerLocation.longitude)
    );
  }

  /**
   * Get available shippers
   */
  async getAvailableShippers(warehouseId) {
    console.log(`🚚 Searching for available shippers...`);

    // First try to find shippers assigned to specific warehouse
    let shippers = await User.find({
      role: "shipper",
      $or: [
        { isActive: true },
        { isActive: { $exists: false } }, // Handle missing isActive field
      ],
      warehouseId: warehouseId,
    }).select("fullname phone capacity workingHours performance region");

    // If no warehouse-specific shippers, find any active shippers
    if (shippers.length === 0) {
      console.log(
        `  No warehouse-specific shippers found, searching for any active shippers...`
      );
      shippers = await User.find({
        role: "shipper",
        $or: [{ isActive: true }, { isActive: { $exists: false } }],
      }).select("fullname phone capacity workingHours performance region");
    }

    console.log(`🚚 Found ${shippers.length} available shippers`);
    shippers.forEach((shipper, i) => {
      console.log(
        `  ${i + 1}. ${shipper.fullname} (capacity: ${shipper.capacity || "N/A"})`
      );
    });

    return shippers;
  }

  /**
   * Save optimization results
   */
  async saveOptimizationResults(solution, orders) {
    try {
      // Assign orders to shippers based on solution
      for (const route of solution.routes) {
        if (route.orders.length > 0) {
          const orderIds = route.orders.map((order) => order.id);

          await DonHang.updateMany(
            { _id: { $in: orderIds } },
            {
              shipperId: route.vehicleId,
              status: "processing",
              assignedAt: new Date(),
              estimatedDeliveryTime: route.totalTime,
              optimizedRoute: route.route,
            }
          );
        }
      }

      console.log(`📋 Assigned ${orders.length} orders to shippers`);
    } catch (error) {
      console.error("❌ Error saving optimization results:", error);
    }
  }

  /**
   * Haversine distance calculation (fallback)
   */
  calculateHaversineDistance(point1, point2) {
    const R = 6371000; // Earth's radius in meters
    const lat1Rad = (point1.lat * Math.PI) / 180;
    const lat2Rad = (point2.lat * Math.PI) / 180;
    const deltaLatRad = ((point2.lat - point1.lat) * Math.PI) / 180;
    const deltaLngRad = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a =
      Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
      Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.sin(deltaLngRad / 2) *
        Math.sin(deltaLngRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c); // Distance in meters
  }
}

const controller = new RouteOptimizationController();

// Bind methods to preserve 'this' context
module.exports = {
  optimizeActiveRoutes: controller.optimizeActiveRoutes.bind(controller),
  getShipperRoute: controller.getShipperRoute.bind(controller),
  buildDistanceMatrix: controller.buildDistanceMatrix.bind(controller),
  buildDistanceMatrixFromPoints:
    controller.buildDistanceMatrixFromPoints.bind(controller),
  getDetailedRoute: controller.getDetailedRoute.bind(controller),
  addRoutingDetails: controller.addRoutingDetails.bind(controller),
  getActiveOrders: controller.getActiveOrders.bind(controller),
  getAvailableShippers: controller.getAvailableShippers.bind(controller),
  saveOptimizationResults: controller.saveOptimizationResults.bind(controller),
  calculateHaversineDistance:
    controller.calculateHaversineDistance.bind(controller),
};

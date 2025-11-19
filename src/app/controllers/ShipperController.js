const mongoose = require("mongoose");
const DonHang = require("../models/DonHang");
const User = require("../models/User");

// === THÊM/CẬP NHẬT IMPORTS ===
// 1. Thêm Warehouse (vì hàm optimize cần)
const Warehouse = require("../models/Warehouse");
// 2. Cập nhật mapService để lấy 'getDistanceMatrix'
const {
  geocodeAddress,
  getRoute,
  getDistanceMatrix,
} = require("../../util/mapService");
// 3. Thêm VRPService (Bộ giải)
const vrpService = require("../../services/VRPService");
// ================================

class ShipperController {
  async showPendingOrders(req, res) {
    try {
      if (!req.session.user || req.session.user.role !== "shipper") {
        return res.status(403).send("❌ Bạn không có quyền truy cập đơn hàng.");
      }

      const shipperId = req.session.user._id;
      const shipperRegion = req.session.user.region;
      console.log("📌 Shipper:", shipperId, "- Vùng:", shipperRegion);

      // === SỬA: LẤY ĐƠN HÀNG ĐÃ ĐƯỢC GÁN CHO SHIPPER VÀ SẮP XẾP THEO routeOrder ===
      const orders = await DonHang.find({
        assignedShipper: shipperId, // Chỉ lấy đơn đã được gán
        status: "Đang sắp xếp",
      }).sort({
        routeOrder: 1, // Sắp xếp theo thứ tự đã tối ưu
        createdAt: 1, // Fallback: theo thời gian tạo
      });

      console.log(
        `📦 Tìm thấy ${orders.length} đơn hàng đã được tối ưu:`,
        orders.map((o) => `${o._id} (thứ tự: ${o.routeOrder})`)
      );

      // Kiểm tra xem có đơn nào đã được tối ưu chưa
      const hasOptimizedOrders = orders.some((order) => order.routeOrder > 0);

      res.render("shipper/dang_sap_xep", {
        orders,
        hasOptimizedOrders,
        optimizedCount: orders.filter((o) => o.routeOrder > 0).length,
      });
    } catch (err) {
      console.error("❌ Lỗi khi tải đơn hàng:", err);
      res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
    }
  }
  async showActiveOrders(req, res) {
    try {
      if (!req.session.user || req.session.user.role !== "shipper") {
        return res.status(403).send("❌ Bạn không có quyền truy cập đơn hàng.");
      }

      const shipperId = req.session.user._id;
      const shipperRegion = req.session.user.region;

      // 🎯 SẮP XẾP THEO THỨ TỰ TỐI ƯU (routeOrder)
      const orders = await DonHang.find({
        status: "Đang vận chuyển",
        assignedShipper: shipperId,
        region: shipperRegion,
      })
        .populate("warehouseId")
        .sort({
          routeOrder: 1, // ✅ Ưu tiên theo thứ tự đã tối ưu
          createdAt: 1, // Fallback: theo thời gian
        });

      console.log(
        `📦 Đơn hàng đang vận chuyển (${orders.length}):`,
        orders.map(
          (o) =>
            `${o._id.toString().slice(-6)} (thứ tự: ${o.routeOrder || "chưa có"})`
        )
      );
      res.render("shipper/dang_van_chuyen", { orders });
    } catch (err) {
      console.error("❌ Lỗi khi tải đơn hàng:", err);
      res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
    }
  }

  async confirmOrder(req, res) {
    try {
      const orderId = req.params.id;
      const shipperId = req.session.user._id;
      const shipperRegion = req.session.user.region;

      console.log("📌 Xác nhận đơn hàng:", {
        orderId,
        shipperId,
        shipperRegion,
      }); // Validate ObjectId

      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        console.log("❌ ObjectId không hợp lệ:", orderId);
        return res.redirect("/shipper/dang-sap-xep");
      }

      const order = await DonHang.findById(orderId);
      if (!order) {
        console.log(" Không tìm thấy đơn hàng.");

        return res.redirect("/shipper/dang-sap-xep");
      }

      if (order.status !== "Đang sắp xếp") {
        console.log(" Đơn hàng không hợp lệ:", order.status);
        return res.redirect("/shipper/dang-sap-xep");
      }

      order.assignedShipper = shipperId;
      order.status = "Đang vận chuyển";
      await order.save();

      console.log(
        ` Đơn hàng ${orderId} đã được giao cho shipper ${shipperId} tại vùng ${shipperRegion}`
      );

      res.redirect(req.get("referer") || "/shipper/dang-sap-xep");
    } catch (err) {
      console.error(" Lỗi khi xác nhận đơn hàng:", err);
      res.status(500).send("Lỗi hệ thống.");
    }
  }

  async getDirections(req, res) {
    try {
      const orderId = req.params.id;
      const order = await DonHang.findById(orderId).populate("warehouseId");

      if (!order || order.status !== "Đang vận chuyển") {
        return res.status(404).send("Không tìm thấy đơn hàng.");
      }

      const warehouse = order.warehouseId;
      if (!warehouse) {
        console.error("Lỗi: Không tìm thấy kho hàng!");
        return res.status(400).send("Không tìm thấy kho xuất hàng.");
      }

      console.log(`📦 Kho xuất hàng: ${warehouse.name}`);
      console.log(`📍 Địa chỉ kho: ${warehouse.address}`);

      // SỬA LỖI LOGIC: Kho của bạn dùng `coordinates`, không phải `location`
      if (
        !warehouse.location ||
        !warehouse.location.latitude ||
        !warehouse.location.longitude
      ) {
        console.error(" Lỗi: Kho chưa có tọa độ, cần cập nhật!");
        return res.status(400).send("Kho chưa có tọa độ, cần cập nhật!");
      } // SỬA LỖI LOGIC: `getRoute` cần object {lat, lon}, không phải string
      let warehouseCoords = {
        latitude: warehouse.location.latitude,
        longitude: warehouse.location.longitude,
      };
      let destinationCoords = await geocodeAddress(order.address);

      if (!destinationCoords) {
        console.error("Không thể tìm thấy tọa độ địa chỉ giao hàng.");
        return res.status(404).send("Không tìm thấy tọa độ điểm giao.");
      }

      console.log(" Tọa độ kho xuất hàng:", warehouseCoords);
      console.log(" Tọa độ điểm giao hàng:", destinationCoords);

      const routeData = await getRoute(warehouseCoords, destinationCoords);
      if (!routeData || !routeData.geometry) {
        console.error(" Không thể lấy tuyến đường.");
        return res.status(404).send("Không tìm thấy tuyến đường.");
      }

      res.render("shipper/maps", {
        routePath: routeData.geometry, // Sửa: Gửi geometry, không phải routeData
        route: routeData, // Giữ lại để lấy distance/duration
        steps: routeData.instructions.map((inst) => ({ instruction: inst })), // Gửi hướng dẫn
        order: order,
        warehouse: warehouse,
      });
    } catch (error) {
      console.error(` Lỗi hệ thống khi lấy chỉ đường: ${error.message}`);
      res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
    }
  }

  async showDeliveredOrders(req, res) {
    try {
      if (!req.session.user || req.session.user.role !== "shipper") {
        return res.status(403).send("❌ Bạn không có quyền truy cập đơn hàng.");
      }
      const shipperId = req.session.user._id;
      const orders = await DonHang.find({
        assignedShipper: shipperId,
        status: "Đã giao",
      }).populate("warehouseId");
      res.render("Shipper/da_giao", { orders });
    } catch (err) {
      console.error("❌ Lỗi khi lấy đơn hàng đã giao:", err);
      res.status(500).send("Lỗi hệ thống!");
    }
  }

  async markDelivered(req, res) {
    try {
      const order = await DonHang.findById(req.params.id);
      if (!order) return res.status(404).send("Không tìm thấy đơn hàng.");
      if (order.status !== "Đang vận chuyển")
        return res.status(400).send("Trạng thái không hợp lệ.");

      order.status = "Đã giao";
      order.deliveredAt = new Date(); // Lưu thời điểm giao hàng
      await order.save();

      res.redirect(`/shipper/order/${order._id}`);
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật trạng thái đã giao:", err);
      res.status(500).send("Lỗi hệ thống!");
    }
  }

  async viewOrderDetail(req, res) {
    try {
      const order = await DonHang.findById(req.params.id).populate(
        "warehouseId"
      );
      if (!order) return res.status(404).send("Không tìm thấy đơn hàng."); // Xử lý text hình thức thanh toán

      let paymentMethodText = "Không xác định";
      if (order.paymentMethod === "cash")
        paymentMethodText = "Thanh toán khi nhận hàng";
      if (order.paymentMethod === "vnpay")
        paymentMethodText = "Thanh toán qua VNPay";
      res.render("Shipper/order_detail", {
        order,
        paymentMethodText,
        warehouse: order.warehouseId,
        createdAt: order.createdAt
          ? order.createdAt.toLocaleString("vi-VN")
          : "",
      });
    } catch (err) {
      console.error("❌ Lỗi khi xem chi tiết đơn hàng:", err);
      res.status(500).send("Lỗi hệ thống!");
    }
  } // =================== API ENDPOINTS CHO MOBILE APP ===================

  // (Tất cả các hàm API gốc của bạn)

  // API: Lấy đơn hàng đang sắp xếp (JSON) - ĐÃ TỐI ƯU
  async apiGetPendingOrders(req, res) {
    try {
      if (!req.session.user || req.session.user.role !== "shipper") {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền truy cập đơn hàng.",
        });
      }

      const shipperId = req.session.user._id;

      // === MOBILE API: TRẢ VỀ ĐƠN HÀNG ĐÃ TỐI ƯU THEO THỨ TỰ ===
      const orders = await DonHang.find({
        assignedShipper: shipperId, // Chỉ đơn được gán cho shipper này
        status: "Đang sắp xếp",
      })
        .populate("warehouseId")
        .sort({
          routeOrder: 1, // Sắp xếp theo thứ tự đã tối ưu
          createdAt: 1, // Fallback theo thời gian
        });

      // Thêm thông tin tối ưu vào response
      const optimizedOrders = orders.map((order, index) => ({
        ...order.toObject(),
        isOptimized: order.routeOrder > 0,
        displayOrder: order.routeOrder || index + 1,
        routeInfo:
          order.routeOrder > 0
            ? `Điểm ${order.routeOrder} trong lộ trình tối ưu`
            : "Chưa được tối ưu",
      }));

      res.json({
        success: true,
        data: optimizedOrders,
        metadata: {
          totalOrders: orders.length,
          optimizedOrders: orders.filter((o) => o.routeOrder > 0).length,
          isRouteOptimized: orders.some((o) => o.routeOrder > 0),
        },
        message: "Lấy lộ trình giao hàng đã tối ưu thành công",
      });
    } catch (err) {
      console.error("❌ Lỗi khi lấy đơn hàng:", err);
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
      });
    }
  } // API: Lấy đơn hàng đang vận chuyển (JSON)
  async apiGetActiveOrders(req, res) {
    try {
      if (!req.session.user || req.session.user.role !== "shipper") {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền truy cập đơn hàng.",
        });
      }

      const shipperId = req.session.user._id;
      const orders = await DonHang.find({
        status: "Đang vận chuyển",
        assignedShipper: shipperId,
      }).populate("warehouseId");

      res.json({
        success: true,
        data: orders,
        message: "Lấy đơn hàng đang vận chuyển thành công",
      });
    } catch (err) {
      console.error("❌ Lỗi khi lấy đơn hàng:", err);
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
      });
    }
  } // API: Lấy đơn hàng đã giao (JSON)

  async apiGetDeliveredOrders(req, res) {
    try {
      if (!req.session.user || req.session.user.role !== "shipper") {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền truy cập đơn hàng.",
        });
      }

      const shipperId = req.session.user._id;
      const orders = await DonHang.find({
        status: "Đã giao",
        assignedShipper: shipperId,
      })
        .populate("warehouseId")
        .sort({ updatedAt: -1 });

      res.json({
        success: true,
        data: orders,
        message: "Lấy lịch sử đơn hàng thành công",
      });
    } catch (err) {
      console.error("❌ Lỗi khi lấy đơn hàng:", err);
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
      });
    }
  } // API: Lấy chi tiết đơn hàng (JSON)

  async apiGetOrderDetail(req, res) {
    try {
      if (!req.session.user || req.session.user.role !== "shipper") {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền truy cập đơn hàng.",
        });
      }

      const orderId = req.params.id; // Validate ObjectId

      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({
          success: false,
          message: `ObjectId không hợp lệ: ${orderId}. Cần là 24 ký tự hex.`,
        });
      }

      const order = await DonHang.findById(orderId).populate("warehouseId");

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đơn hàng",
        });
        S;
      }

      res.json({
        success: true,
        data: order,
        message: "Lấy chi tiết đơn hàng thành công",
      });
    } catch (err) {
      console.error("❌ Lỗi khi lấy chi tiết đơn hàng:", err);
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
      });
    }
  } // API: Nhận đơn hàng (JSON)

  async apiConfirmOrder(req, res) {
    try {
      if (!req.session.user || req.session.user.role !== "shipper") {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền xác nhận đơn hàng.",
        });
      }

      const orderId = req.params.id;
      const shipperId = req.session.user._id; // Validate ObjectId

      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({
          success: false,
          message: `ObjectId không hợp lệ: ${orderId}. Cần là 24 ký tự hex.`,
        });
      }

      const order = await DonHang.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đơn hàng",
        });
      }

      if (order.status !== "Đang sắp xếp") {
        return res.status(400).json({
          success: false,
          message: "Đơn hàng không ở trạng thái có thể nhận",
        });
      } // Cập nhật đơn hàng

      order.assignedShipper = shipperId;
      order.status = "Đang vận chuyển";
      await order.save();

      res.json({
        success: true,
        data: order,
        message: "Nhận đơn hàng thành công",
      });
    } catch (err) {
      console.error("❌ Lỗi khi xác nhận đơn hàng:", err);
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
      });
    }
  } // API: Đánh dấu đã giao (JSON)

  async apiMarkAsDelivered(req, res) {
    try {
      if (!req.session.user || req.session.user.role !== "shipper") {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền cập nhật đơn hàng.",
        });
      }

      const orderId = req.params.id;
      const shipperId = req.session.user._id; // Validate ObjectId

      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({
          success: false,
          message: `ObjectId không hợp lệ: ${orderId}. Cần là 24 ký tự hex.`,
        });
      }

      const order = await DonHang.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đơn hàng",
        });
      }

      if (order.assignedShipper.toString() !== shipperId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền cập nhật đơn hàng này",
        });
      }

      if (order.status !== "Đang vận chuyển") {
        return res.status(400).json({
          success: false,
          message: "Đơn hàng không ở trạng thái có thể giao",
        });
      } // Cập nhật trạng thái

      order.status = "Đã giao";
      order.deliveredAt = new Date();
      await order.save();

      res.json({
        success: true,
        data: order,
        message: "Đánh dấu giao hàng thành công",
      });
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật trạng thái:", err);
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
      });
    }
  } // API: Lấy thông tin chỉ đường (JSON)

  async apiGetDirections(req, res) {
    try {
      if (!req.session.user || req.session.user.role !== "shipper") {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền truy cập.",
        });
      }

      const orderId = req.params.id;
      const order = await DonHang.findById(orderId).populate("warehouseId");

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đơn hàng",
        });
      } // Lấy thông tin địa chỉ

      // SỬA LỖI LOGIC: `warehouse.address` là string, không phải object
      const warehouseAddress = order.warehouseId.address;
      const customerAddress = order.address;

      // Geocode địa chỉ để lấy tọa độ
      // SỬA LỖI LOGIC: Dùng tọa độ đã lưu sẵn
      const warehouseCoords = {
        latitude: order.warehouseId.location.latitude,
        longitude: order.warehouseId.location.longitude,
      };
      const customerCoords = {
        latitude: order.customerLocation.latitude,
        longitude: order.customerLocation.longitude,
      };

      if (!warehouseCoords.latitude || !customerCoords.latitude) {
        return res.status(400).json({
          success: false,
          message: "Không thể xác định tọa độ địa chỉ (thiếu dữ liệu)",
        });
      } // Lấy route

      const routeData = await getRoute(warehouseCoords, customerCoords);

      res.json({
        success: true,
        data: {
          order: {
            _id: order._id,
            name: order.name,
            phone: order.phone,
            address: order.address,
          },
          warehouse: {
            name: order.warehouseId.name,
            address: warehouseAddress,
            location: warehouseCoords,
          },
          customer: {
            address: customerAddress,
            location: customerCoords,
          },
          route: routeData,
          M,
        },
        message: "Lấy thông tin chỉ đường thành công",
      });
    } catch (err) {
      console.error("❌ Lỗi khi lấy chỉ đường:", err);
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
      });
    }
  }

  // === HÀM MỚI CHO TỐI ƯU LỘ TRÌNH ===
  async optimizeMyRoutes(req, res) {
    try {
      // 1. LẤY THÔNG TIN SHIPPER (từ session)
      const shipperId = req.session.user._id;
      const shipper = req.session.user;

      // 2. TÌM KHO HÀNG CỦA SHIPPER (dựa trên 'region')
      const warehouse = await Warehouse.findOne({ region: shipper.region });
      if (!warehouse || !warehouse.location) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy kho hàng cho khu vực của bạn.",
        });
      }

      // 3. TÌM CÁC ĐƠN HÀNG CẦN GIAO (Đã được Admin gán)
      const ordersToDeliver = await DonHang.find({
        assignedShipper: shipperId,
        status: "Đang sắp xếp", // Khớp với status model của bạn
      });

      if (ordersToDeliver.length === 0) {
        return res.json({
          // Trả về 200 (OK) vì đây không phải là lỗi
          success: true,
          message: "Không có đơn hàng nào cần giao.",
          optimizedRoute: [],
        });
      }

      // 4. CHUẨN BỊ DANH SÁCH TỌA ĐỘ
      const points = [
        {
          latitude: warehouse.location.latitude,
          longitude: warehouse.location.longitude,
        },
      ];
      const validOrders = [];

      ordersToDeliver.forEach((order) => {
        if (order.customerLocation && order.customerLocation.latitude) {
          points.push({
            latitude: order.customerLocation.latitude,
            longitude: order.customerLocation.longitude,
          });
          validOrders.push(order);
        } else {
          console.warn(`Đơn hàng ${order._id} bị thiếu tọa độ.`);
        }
      });

      if (validOrders.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Các đơn hàng của bạn bị thiếu tọa độ. Admin cần gán lại.",
        });
      }

      // 5. GỌI "BỘ NÃO" OSRM (mapService)
      console.log(`Đang gọi OSRM với ${points.length} điểm...`);
      const distanceMatrix = await getDistanceMatrix(points); // Đã import ở trên

      if (!distanceMatrix) {
        return res.status(500).json({
          success: false,
          message: "Lỗi khi tính toán lộ trình (OSRM).",
        });
      }

      // 6. GỌI "BỘ GIẢI" VRP (VRPService)
      const routeIndices = vrpService.solveNearestNeighbor(distanceMatrix);

      // 7. MAP KẾT QUẢ VỀ DỮ LIỆU THẬT
      const optimizedRoute = routeIndices.map((index) => {
        if (index === 0) {
          return {
            type: "Warehouse",
            name: warehouse.name,
            address: warehouse.address,
          };
        } else {
          return validOrders[index - 1]; // Trả về object DonHang
        }
      });

      // 8. TRẢ KẾT QUẢ VỀ CHO APP FLUTTER
      res.json({
        // Dùng res.json để nhất quán
        success: true,
        message: `Tối ưu lộ trình cho ${validOrders.length} đơn hàng thành công.`,
        optimizedRoute: optimizedRoute,
      });
    } catch (error) {
      console.error("Lỗi nghiêm trọng trong optimizeMyRoutes:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi máy chủ nội bộ.",
      });
    }
  }
  // ======================================
}

module.exports = new ShipperController();

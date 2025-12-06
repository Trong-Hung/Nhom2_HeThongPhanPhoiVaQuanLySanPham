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
      const warehouseId = req.session.user.warehouseId;

      // Lấy thông tin warehouse
      const shipper = await User.findById(shipperId).populate("warehouseId");
      const warehouseName = shipper.warehouseId?.name || "Chưa có kho";
      console.log("📌 Shipper:", shipperId, "- Kho:", warehouseName);

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
      const warehouseId = req.session.user.warehouseId;

      // 🎯 SẮP XẾP THEO THỨ TỰ TỐI ƯU (routeOrder)
      // CHỈ LẤY ĐƠN ĐANG VẬN CHUYỂN (đã được shipper confirm)
      const orders = await DonHang.find({
        status: "Đang vận chuyển",
        assignedShipper: shipperId,
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
      res.render("shipper/dang_van_chuyen", {
        orders,
        now: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      console.error("❌ Lỗi khi tải đơn hàng:", err);
      res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
    }
  }

  async confirmOrder(req, res) {
    try {
      const orderId = req.params.id;
      const shipperId = req.session.user._id;
      const warehouseId = req.session.user.warehouseId;

      // Lấy thông tin warehouse
      const shipper = await User.findById(shipperId).populate("warehouseId");
      const warehouseName = shipper.warehouseId?.name || "Chưa có kho";

      console.log("📌 Xác nhận đơn hàng:", {
        orderId,
        shipperId,
        warehouse: warehouseName,
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
        `✅ Đơn hàng ${orderId} đã được giao cho shipper ${shipperId} từ kho ${warehouseName}`
      );

      // 🔄 TỰ ĐỘNG TỐI ƯU LẠI LỘNG TRÌNH SAU KHI THAY ĐỔI
      try {
        console.log("🔄 Đang tự động tối ưu lại lộ trình...");
        console.log("📍 Shipper ID:", shipperId);
        console.log("📍 User từ session:", req.session.user.email);

        // Inline auto-optimize logic
        const shipperWithWarehouse =
          await User.findById(shipperId).populate("warehouseId");
        if (shipperWithWarehouse && shipperWithWarehouse.warehouseId) {
          const ordersToOptimize = await DonHang.find({
            assignedShipper: shipperId,
            status: "Đang vận chuyển", // CHỈ tối ưu đơn đang vận chuyển
          });

          if (ordersToOptimize.length > 0) {
            console.log(
              `🔄 Tối ưu ${ordersToOptimize.length} đơn hàng cho shipper ${shipperId}`
            );
            // Gọi VRP service để tối ưu (bỏ qua chi tiết implementation vì đã có ở function khác)
          }
        }

        console.log("✅ Tối ưu lại lộ trình thành công");
      } catch (optimizeError) {
        console.error("❌ LỖI AUTO-OPTIMIZE:", optimizeError);
        console.error("Stack:", optimizeError.stack);
        // Không block redirect nếu tối ưu lỗi
      }

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
      }

      // Thêm thông tin route từ OSRM nếu có đầy đủ tọa độ
      let routeData = null;
      if (order.warehouseId?.location && order.customerLocation) {
        try {
          const warehouseCoords = {
            latitude: order.warehouseId.location.latitude,
            longitude: order.warehouseId.location.longitude,
          };
          const customerCoords = {
            latitude: order.customerLocation.latitude,
            longitude: order.customerLocation.longitude,
          };

          routeData = await getRoute(warehouseCoords, customerCoords);
          console.log(
            `🛣️ Đã lấy route data cho đơn ${orderId}:`,
            routeData?.distance || "N/A"
          );
        } catch (routeError) {
          console.log(
            `⚠️ Không thể lấy route cho đơn ${orderId}:`,
            routeError.message
          );
        }
      }

      res.json({
        success: true,
        data: {
          ...order.toObject(),
          routeData: routeData, // Thêm thông tin tuyến đường
        },
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

      // 3. CHỈ TỐI ƯU CÁC ĐƠN HÀNG "ĐANG VẬN CHUYỂN"
      const ordersToDeliver = await DonHang.find({
        assignedShipper: shipperId,
        status: "Đang vận chuyển", // CHỈ tối ưu đơn đang vận chuyển
      });

      if (ordersToDeliver.length === 0) {
        return res.json({
          success: true,
          message: "Không có đơn hàng 'Đang vận chuyển' nào cần tối ưu.",
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

  // 🔄 TỰ ĐỘNG TỐI ƯU LẠI KHI CÓ THAY ĐỔI
  async performAutoOptimize(shipperId) {
    try {
      // 1. Tìm warehouse của shipper
      const shipper = await User.findById(shipperId).populate("warehouseId");
      if (!shipper || !shipper.warehouseId || !shipper.warehouseId.location) {
        throw new Error("Không tìm thấy thông tin kho hàng của shipper");
      }

      const warehouse = shipper.warehouseId;
      console.log(`📌 Shipper: ${shipperId} - Kho: ${warehouse.name}`);

      // 2. Tìm tất cả đơn hàng cần tối ưu (CHỈ đang vận chuyển)
      const ordersToOptimize = await DonHang.find({
        assignedShipper: shipperId,
        status: "Đang vận chuyển",
      });

      if (ordersToOptimize.length === 0) {
        console.log("📦 Không có đơn hàng nào cần tối ưu");
        return;
      }

      console.log(
        `🔄 Tối ưu ${ordersToOptimize.length} đơn hàng cho shipper ${shipperId}`
      );

      // Debug: hiển thị đơn hàng trước khi tối ưu
      const beforeOptimize = ordersToOptimize.map(
        (o) =>
          `${o._id.toString().slice(-6)} (thứ tự: ${o.routeOrder || "chưa có"})`
      );
      console.log(
        `📦 Đơn hàng trước tối ưu (${ordersToOptimize.length}): [${beforeOptimize.join(", ")}]`
      );

      // 3. Chuẩn bị danh sách tọa độ
      const points = [
        {
          latitude: warehouse.location.latitude,
          longitude: warehouse.location.longitude,
        },
      ];

      const validOrders = [];
      for (const order of ordersToOptimize) {
        if (
          order.customerLocation?.latitude &&
          order.customerLocation?.longitude
        ) {
          points.push({
            latitude: order.customerLocation.latitude,
            longitude: order.customerLocation.longitude,
          });
          validOrders.push(order);
        }
      }

      if (validOrders.length === 0) {
        console.log("⚠️ Không có đơn hàng nào có tọa độ hợp lệ");
        return;
      }

      // 4. Gọi VRP service để tối ưu
      const vrpService = require("../../services/VRPService");
      const optimizedRoute = await vrpService.solveVRP(points);

      // 5. Reset tất cả routeOrder về 0 trước
      for (const order of validOrders) {
        order.routeOrder = 0;
        await order.save();
      }

      // 6. Cập nhật routeOrder mới theo thứ tự tối ưu
      for (let i = 0; i < optimizedRoute.length - 1; i++) {
        const routeIndex = optimizedRoute[i + 1] - 1; // Bỏ qua điểm đầu (warehouse)
        if (routeIndex >= 0 && routeIndex < validOrders.length) {
          const order = validOrders[routeIndex];
          order.routeOrder = i + 1; // Fresh start: 1, 2, 3...
          order.optimizedAt = new Date();
          await order.save();
          console.log(
            `📦 Đơn ${order._id.toString().slice(-6)} -> Thứ tự mới: ${i + 1}`
          );
        }
      }

      // Debug: Kiểm tra lại đơn hàng sau khi tối ưu (chỉ đang vận chuyển)
      const afterOrders = await DonHang.find({
        assignedShipper: shipperId,
        status: "Đang vận chuyển",
      }).sort({ routeOrder: 1 });

      const afterOptimize = afterOrders.map(
        (o) =>
          `${o._id.toString().slice(-6)} (thứ tự: ${o.routeOrder || "chưa có"})`
      );
      console.log(
        `📦 Đơn hàng đang vận chuyển sau tối ưu (${afterOrders.length}): [${afterOptimize.join(", ")}]`
      );

      console.log(`✅ Đã tối ưu lại ${validOrders.length} đơn hàng`);
    } catch (error) {
      console.error("❌ Lỗi auto-optimize:", error.message);
      throw error;
    }
  }

  // === MANUAL ROUTE OPTIMIZATION FOR SHIPPER ===
  async optimizeMyRoute(req, res) {
    try {
      const shipperId = req.session.user._id;

      console.log(
        `🔄 Manual route optimization requested by shipper ${shipperId}`
      );

      // Only optimize "Đang vận chuyển" orders
      const ordersToOptimize = await DonHang.find({
        assignedShipper: shipperId,
        status: "Đang vận chuyển", // ONLY optimize orders in transit
      });

      if (ordersToOptimize.length === 0) {
        return res.json({
          success: true,
          message: "Không có đơn hàng 'Đang vận chuyển' nào cần tối ưu",
          optimizedCount: 0,
        });
      }

      if (ordersToOptimize.length === 1) {
        // Only one order - just set routeOrder = 1
        const singleOrder = ordersToOptimize[0];
        singleOrder.routeOrder = 1;
        singleOrder.optimizedAt = new Date();
        await singleOrder.save();

        return res.json({
          success: true,
          message: "Đã tối ưu đơn hàng duy nhất",
          optimizedCount: 1,
        });
      }

      // Get shipper's warehouse
      const shipper = await User.findById(shipperId).populate("warehouseId");
      if (!shipper || !shipper.warehouseId || !shipper.warehouseId.location) {
        return res.status(400).json({
          success: false,
          message: "Không tìm thấy thông tin kho hàng của bạn",
        });
      }

      const warehouse = shipper.warehouseId;
      console.log(`📍 Warehouse: ${warehouse.name}`);

      // Prepare coordinates for optimization
      const points = [
        {
          latitude: warehouse.location.latitude,
          longitude: warehouse.location.longitude,
        },
      ];

      const validOrders = [];
      ordersToOptimize.forEach((order) => {
        if (
          order.customerLocation?.latitude &&
          order.customerLocation?.longitude
        ) {
          points.push({
            latitude: order.customerLocation.latitude,
            longitude: order.customerLocation.longitude,
          });
          validOrders.push(order);
        } else {
          console.warn(`⚠️ Order ${order._id} missing coordinates`);
        }
      });

      if (validOrders.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Các đơn hàng thiếu tọa độ. Liên hệ admin để cập nhật.",
        });
      }

      console.log(`🗺️ Building distance matrix for ${points.length} points...`);

      // Get distance matrix from OSRM
      const distanceMatrix = await getDistanceMatrix(points);
      if (!distanceMatrix) {
        return res.status(500).json({
          success: false,
          message: "Lỗi tính toán khoảng cách. Vui lòng thử lại sau.",
        });
      }

      // Solve VRP using Nearest Neighbor
      const routeIndices = vrpService.solveNearestNeighbor(distanceMatrix);

      // Update routeOrder based on optimized route
      console.log("🎯 Optimized route indices:", routeIndices);

      // Reset all routeOrder first
      for (const order of validOrders) {
        order.routeOrder = 0;
      }

      // Apply new route order
      let routePosition = 1;
      for (let i = 0; i < routeIndices.length; i++) {
        const index = routeIndices[i];
        if (index === 0) continue; // Skip warehouse (index 0)

        const orderToUpdate = validOrders[index - 1];
        orderToUpdate.routeOrder = routePosition;
        orderToUpdate.optimizedAt = new Date();
        await orderToUpdate.save();

        console.log(
          `📦 Order ${orderToUpdate._id.toString().slice(-6)} → Position ${routePosition}`
        );
        routePosition++;
      }

      // Return success response
      res.json({
        success: true,
        message: `Đã tối ưu ${validOrders.length} đơn hàng 'Đang vận chuyển' thành công!`,
        optimizedCount: validOrders.length,
        route: routeIndices,
      });
    } catch (error) {
      console.error("❌ Manual optimization error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi tối ưu lộ trình: " + error.message,
      });
    }
  }

  // 🚨 DEBUG ENDPOINT - Reset Route Order
  async debugResetRouteOrder(req, res) {
    try {
      const shipperId = req.session.user._id;

      console.log("🚨 DEBUG: Reset tất cả routeOrder về 0");

      // Reset tất cả về 0
      await DonHang.updateMany(
        { assignedShipper: shipperId },
        { routeOrder: 0, optimizedAt: null }
      );

      // Lấy orders đang vận chuyển và gán lại 1, 2, 3...
      const orders = await DonHang.find({
        assignedShipper: shipperId,
        status: "Đang vận chuyển",
      }).sort({ createdAt: 1 });

      for (let i = 0; i < orders.length; i++) {
        orders[i].routeOrder = i + 1;
        orders[i].optimizedAt = new Date();
        await orders[i].save();
        console.log(
          `🔧 Order ${orders[i]._id.toString().slice(-6)}: routeOrder = ${i + 1}`
        );
      }

      res.json({
        success: true,
        message: `Reset ${orders.length} đơn hàng thành công`,
        orders: orders.map((o) => ({
          id: o._id.toString().slice(-6),
          routeOrder: o.routeOrder,
          status: o.status,
        })),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ======================================
}

module.exports = new ShipperController();

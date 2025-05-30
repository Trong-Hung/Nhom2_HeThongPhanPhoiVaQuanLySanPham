const DonHang = require("../models/DonHang");
const User = require("../models/User");
const axios = require("axios");
const Warehouse = require("../models/Warehouse");
const { geocodeAddress, geocode, getRoute } = require("../../util/mapService");

class ShipperController {
  async showPendingOrders(req, res) {
    try {
      if (!req.session.user || req.session.user.role !== "shipper") {
        return res.status(403).send("❌ Bạn không có quyền truy cập đơn hàng.");
      }

      const shipperRegion = req.session.user.region;
      console.log("📌 Kiểm tra vùng miền shipper:", shipperRegion);

      const orders = await DonHang.find({
        status: "Đang sắp xếp",
        region: shipperRegion,
      });
      console.log("📦 Đơn hàng đang sắp xếp:", orders);
      console.log("📦 Kết quả truy vấn đơn hàng:", orders);

      res.render("shipper/dang_sap_xep", { orders });
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

      const orders = await DonHang.find({
        status: "Đang vận chuyển",
        assignedShipper: shipperId,
        region: shipperRegion,
      }).populate("warehouseId");

      console.log("📦 Đơn hàng đang vận chuyển:", orders);

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
      });

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

      if (
        !warehouse.location ||
        !warehouse.location.latitude ||
        !warehouse.location.longitude
      ) {
        console.error(" Lỗi: Kho chưa có tọa độ, cần cập nhật!");
        return res.status(400).send("Kho chưa có tọa độ, cần cập nhật!");
      }

      let warehouseLocation = `${warehouse.location.latitude},${warehouse.location.longitude}`;
      let destinationCoords = await geocodeAddress(order.address);

      if (!destinationCoords) {
        console.error("Không thể tìm thấy tọa độ địa chỉ giao hàng.");
        return res.status(404).send("Không tìm thấy tọa độ điểm giao.");
      }

      let destinationLocation = `${destinationCoords.latitude},${destinationCoords.longitude}`;
      console.log(" Tọa độ kho xuất hàng:", warehouseLocation);
      console.log(" Tọa độ điểm giao hàng:", destinationLocation);

      const routeData = await getRoute(warehouseLocation, destinationLocation);
      if (!routeData || !routeData.geometry) {
        console.error(" Không thể lấy tuyến đường.");
        return res.status(404).send("Không tìm thấy tuyến đường.");
      }

      res.render("shipper/maps", {
        routePath: routeData.geometry,
        route: routeData,
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
      status: "Đã giao"
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
    if (order.status !== "Đang vận chuyển") return res.status(400).send("Trạng thái không hợp lệ.");

    order.status = "Đã giao";
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
      if (!order) return res.status(404).send("Không tìm thấy đơn hàng.");

      // Xử lý text hình thức thanh toán
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
  }

  async showActiveOrders(req, res) {
    try {
      const orders = await DonHang.find({
        assignedShipper: req.session.user._id,
        status: "Đang vận chuyển",
      }).populate("warehouseId");
      res.render("Shipper/dang_van_chuyen", { orders });
    } catch (err) {
      console.error("❌ Lỗi khi lấy đơn hàng đang vận chuyển:", err);
      res.status(500).send("Lỗi hệ thống!");
    }
  }
}

module.exports = new ShipperController();

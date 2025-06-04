const DonHang = require("../models/DonHang");
const Warehouse = require("../models/Warehouse");
const User = require("../models/User");
const Product = require("../models/Sanpham");
const axios = require("axios");

class DonHangController {
  // Lấy danh sách đơn hàng (admin)
  async index(req, res) {
    try {
      const orders = await DonHang.find()
        .sort({ createdAt: -1 })
        .populate("warehouseId");
      res.render("admin/qldonhang", { orders });
    } catch (err) {
      console.error("Lỗi khi lấy danh sách đơn hàng:", err);
      res.status(500).send("Lỗi hệ thống!");
    }
  }

  // Xem chi tiết đơn hàng (admin)
  async viewOrderDetail(req, res) {
    try {
      const order = await DonHang.findById(req.params.id)
        .populate("warehouseId")
        .populate("assignedShipper");
      const shippers = await User.find({
        role: "shipper",
        region: order.region,
      });
      let paymentMethodText = "Không xác định";
      if (order.paymentMethod === "cash")
        paymentMethodText = "Thanh toán khi nhận hàng";
      if (order.paymentMethod === "vnpay")
        paymentMethodText = "Thanh toán qua VNPay";
      const estimatedDeliveryText = order.estimatedDelivery
        ? order.estimatedDelivery.toLocaleString("vi-VN")
        : "Chưa có";
      res.render("admin/order_detail", {
        order,
        shippers,
        paymentMethodText,
        estimatedDeliveryText,
      });
    } catch (err) {
      console.error("Lỗi khi xem chi tiết đơn hàng:", err);
      res.status(500).send("Lỗi hệ thống!");
    }
  }

  // Gán shipper cho đơn hàng (admin)
  async assignShipper(req, res) {
    try {
      const { shipperId } = req.body;
      const orderId = req.params.id;
      await DonHang.updateOne(
        { _id: orderId },
        { shipper: shipperId, status: "Đang vận chuyển" }
      );
      res.redirect("/admin/qldonhang");
    } catch (err) {
      res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
    }
  }

  // Cập nhật trạng thái đơn hàng (admin)
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const order = await DonHang.findById(id).populate("warehouseId");
      if (!order) return res.status(404).send("Không tìm thấy đơn hàng!");

      const prevStatus = order.status;

      // Nếu chuyển sang "Đang vận chuyển" hoặc "Đã giao" thì trừ kho
      if (
        (status === "Đang vận chuyển" || status === "Đã giao") &&
        order.warehouseId &&
        prevStatus !== "Đang vận chuyển" &&
        prevStatus !== "Đã giao"
      ) {
        const warehouse = order.warehouseId;
        order.items.forEach((item) => {
          const productInWarehouse = warehouse.products.find(
            (p) => p.productId.toString() === item._id.toString()
          );
          if (productInWarehouse) {
            productInWarehouse.quantity -= item.quantity;
            if (productInWarehouse.quantity < 0)
              productInWarehouse.quantity = 0;
          }
        });
        await warehouse.save();
      }

      // Nếu chuyển từ "Đã giao" hoặc "Hoàn thành" về trạng thái khác thì cộng lại kho
      if (
        (prevStatus === "Đã giao" || prevStatus === "Hoàn thành") &&
        status !== "Đã giao" &&
        status !== "Hoàn thành" &&
        order.warehouseId
      ) {
        const warehouse = order.warehouseId;
        order.items.forEach((item) => {
          const productInWarehouse = warehouse.products.find(
            (p) => p.productId.toString() === item._id.toString()
          );
          if (productInWarehouse) {
            productInWarehouse.quantity += item.quantity;
          }
        });
        await warehouse.save();
      }

      order.status = status;
      await order.save();
      res.redirect("/admin/donhang");
    } catch (err) {
      res.status(500).send("Lỗi hệ thống!");
    }
  }

  // Xác nhận đã nhận hàng (user)
  async confirmReceived(req, res) {
    try {
      const { id } = req.params;
      const order = await DonHang.findById(id).populate("warehouseId");
      if (!order || order.status !== "Đã giao") {
        return res
          .status(400)
          .send("Đơn hàng không hợp lệ hoặc đã được xác nhận.");
      }
      const warehouse = order.warehouseId;
      if (warehouse) {
        order.items.forEach((item) => {
          const productInWarehouse = warehouse.products.find(
            (p) => p.productId.toString() === item._id.toString()
          );
          if (productInWarehouse) {
            productInWarehouse.quantity -= item.quantity;
            if (productInWarehouse.quantity < 0)
              productInWarehouse.quantity = 0;
          }
        });
        await warehouse.save();
      }
      order.status = "Hoàn thành";
      await order.save();
      res.redirect(`/donhang/${id}`);
    } catch (err) {
      res.status(500).send("Lỗi hệ thống!");
    }
  }

  // Hủy đơn hàng (user)
  async cancel(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const order = await DonHang.findById(id);
      if (!order) return res.status(404).send("Không tìm thấy đơn hàng.");
      if (order.status !== "Chờ xác nhận") {
        return res.status(400).send("Không thể hủy đơn hàng ở trạng thái này.");
      }
      order.status = "Đã hủy";
      order.cancelReason = reason;
      await order.save();
      return res.redirect(`/donhang/${id}`);
    } catch (err) {
      return res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
    }
  }

  // Xem chi tiết đơn hàng (user)
  async viewOrder(req, res) {
    try {
      const { id } = req.params;
      const order = await DonHang.findById(id)
        .populate("warehouseId")
        .populate("assignedShipper");
      if (!order) return res.status(404).send("Không tìm thấy đơn hàng.");
      let paymentMethodText = "Không xác định";
      if (order.paymentMethod === "cash")
        paymentMethodText = "Thanh toán khi nhận hàng";
      if (order.paymentMethod === "vnpay")
        paymentMethodText = "Thanh toán qua VNPay";
      const estimatedDeliveryText = order.estimatedDelivery
        ? order.estimatedDelivery.toLocaleString("vi-VN")
        : "Chưa có";
      res.render("user/chitietdonhang", {
        estimatedDeliveryText,
        paymentMethodText,
        order,
      });
    } catch (err) {
      res.status(500).send("Lỗi hệ thống!");
    }
  }

  // Lấy danh sách đơn hàng của user
  async userOrders(req, res) {
    if (!req.session.user) {
      return res.redirect("/auth/login");
    }
    const userId = req.session.user._id;
    const allOrders = await DonHang.find({ userId }).sort({ createdAt: -1 });
    const ordersPending = allOrders.filter(
      (o) => o.status === "Chờ xác nhận" || o.status === "Đang sắp xếp"
    );
    const ordersShipping = allOrders.filter(
      (o) => o.status === "Đang vận chuyển"
    );
    const ordersDelivered = allOrders.filter(
      (o) => o.status === "Đã giao" || o.status === "Hoàn thành"
    );
    const ordersCanceled = allOrders.filter((o) => o.status === "Đã hủy");
    res.render("user/donhangme", {
      ordersPending,
      ordersShipping,
      ordersDelivered,
      ordersCanceled,
    });
  }

  // Tìm kho gần nhất có hàng (dùng cho đặt hàng)
  async findNearestWarehouse(customerLocation, productId, quantity) {
    const warehouses = await Warehouse.find();
    let closestWarehouse = null;
    let minDistance = Infinity;
    for (const warehouse of warehouses) {
      if (
        !warehouse.location ||
        !warehouse.location.latitude ||
        !warehouse.location.longitude
      )
        continue;
      const productEntry = warehouse.products.find(
        (p) => p.productId.toString() === productId
      );
      if (productEntry && productEntry.quantity >= quantity) {
        const distance = await this.getDistance(
          {
            latitude: warehouse.location.latitude,
            longitude: warehouse.location.longitude,
          },
          customerLocation
        );
        if (distance !== null && distance < minDistance) {
          minDistance = distance;
          closestWarehouse = warehouse;
        }
      }
    }
    return closestWarehouse;
  }

  // Hàm phụ trợ tính khoảng cách (cần cài đặt hoặc dùng API ngoài)
  async getDistance(from, to) {
    // Ví dụ: sử dụng API ngoài hoặc tự tính toán
    // Trả về số (đơn vị mét)
    return null; // Cần cài đặt thực tế
  }

  // Tổng kết doanh thu và số lượng bán
  async summary(req, res) {
    try {
      const { from, to } = req.query;
      const filter = { status: "Hoàn thành" };

      if (from || to) {
        filter.updatedAt = {};
        if (from) filter.updatedAt.$gte = new Date(from);
        if (to) {
          const toDate = new Date(to);
          toDate.setHours(23, 59, 59, 999);
          filter.updatedAt.$lte = toDate;
        }
      }

      const orders = await DonHang.find(filter);

      let totalRevenue = 0,
        totalSold = 0;
      let cashRevenue = 0,
        momoRevenue = 0;
      let cashSold = 0,
        momoSold = 0;

      orders.forEach((order) => {
        totalRevenue += order.totalPrice || 0;
        totalSold += order.totalQuantity || 0;
        if (order.paymentMethod === "cash") {
          cashRevenue += order.totalPrice || 0;
          cashSold += order.totalQuantity || 0;
        }
        if (order.paymentMethod === "momo") {
          momoRevenue += order.totalPrice || 0;
          momoSold += order.totalQuantity || 0;
        }
      });

      res.render("admin/summary", {
        totalRevenue,
        totalSold,
        cashRevenue,
        momoRevenue,
        cashSold,
        momoSold,
        orders,
        query: req.query,
      });
    } catch (err) {
      res.status(500).send("Lỗi hệ thống khi tổng kết doanh thu!");
    }
  }
}

module.exports = new DonHangController();

const DonHang = require("../models/DonHang");

class AdminController {
  // Dashboard chính với thống kê đơn hàng
  async dashboard(req, res) {
    try {
      // Lấy thống kê đơn hàng trực tiếp
      const choXacNhan = await DonHang.countDocuments({
        status: "Chờ xác nhận",
      });
      const dangVanChuyen = await DonHang.countDocuments({
        status: "Đang vận chuyển",
      });
      const daGiao = await DonHang.countDocuments({ status: "Đã giao" });

      const orderStats = {
        choXacNhan,
        dangVanChuyen,
        daGiao,
      };

      res.render("admin/dashboard", {
        title: "Trang Quản Trị Admin",
        user: req.session.user,
        orderStats: orderStats,
      });
    } catch (error) {
      console.error("Lỗi dashboard:", error);
      res.status(500).send("Lỗi hệ thống");
    }
  }

  // Lấy thống kê đơn hàng cơ bản
  async getOrderStats() {
    try {
      const choXacNhan = await DonHang.countDocuments({
        status: "Chờ xác nhận",
      });
      const dangVanChuyen = await DonHang.countDocuments({
        status: "Đang vận chuyển",
      });
      const daGiao = await DonHang.countDocuments({ status: "Đã giao" });

      return {
        choXacNhan,
        dangVanChuyen,
        daGiao,
      };
    } catch (error) {
      console.error("Lỗi lấy thống kê đơn hàng:", error);
      return {
        choXacNhan: 0,
        dangVanChuyen: 0,
        daGiao: 0,
      };
    }
  }

  // API lấy số đơn hàng chờ xác nhận (dùng cho notification)
  async getNewOrdersCount(req, res) {
    try {
      // Đếm TẤT CẢ đơn hàng "Chờ xác nhận" - không giới hạn thời gian
      const pendingOrdersCount = await DonHang.countDocuments({
        status: "Chờ xác nhận",
      });

      console.log(`🔔 Số đơn hàng chờ xác nhận: ${pendingOrdersCount}`);

      res.json({
        success: true,
        data: { newOrdersCount: pendingOrdersCount },
      });
    } catch (error) {
      console.error("Lỗi lấy số đơn hàng chờ xác nhận:", error);
      res.json({
        success: false,
        data: { newOrdersCount: 0 },
      });
    }
  }

  // API lấy danh sách đơn hàng chờ xác nhận chi tiết
  async getNewOrdersDetails(req, res) {
    try {
      const User = require("../models/User");

      // Lấy TẤT CẢ đơn hàng "Chờ xác nhận" - không giới hạn thời gian
      const pendingOrders = await DonHang.find({
        status: "Chờ xác nhận",
      })
        .populate("userId", "name email phone")
        .sort({ createdAt: -1 })
        .limit(20); // Giới hạn 20 đơn mới nhất

      const orderDetails = pendingOrders.map((order) => ({
        _id: order._id,
        customerName: order.userId?.name || order.name,
        customerPhone: order.userId?.phone || order.phone,
        customerEmail: order.userId?.email || order.email,
        totalPrice: order.totalPrice,
        totalQuantity: order.totalQuantity,
        address: order.address,
        createdAt: order.createdAt,
        items: order.items.slice(0, 3), // Chỉ hiển thị 3 sản phẩm đầu
        itemCount: order.items.length,
      }));

      res.json({
        success: true,
        data: {
          orders: orderDetails,
          count: orderDetails.length,
          totalPending: pendingOrders.length,
        },
      });
    } catch (error) {
      console.error("Lỗi lấy chi tiết đơn hàng mới:", error);
      res.json({
        success: false,
        message: "Lỗi hệ thống",
        data: { orders: [], count: 0, totalPending: 0 },
      });
    }
  }

  // API đánh dấu đã xem thông báo
  async markNotificationSeen(req, res) {
    try {
      const { type } = req.body; // 'chat' hoặc 'order'

      // Có thể lưu vào database hoặc chỉ trả về success
      // Hiện tại chỉ trả về success để frontend xử lý với localStorage

      res.json({
        success: true,
        message: `Đã đánh dấu thông báo ${type} đã xem`,
      });
    } catch (error) {
      console.error("Lỗi đánh dấu thông báo:", error);
      res.json({
        success: false,
        message: "Lỗi hệ thống",
      });
    }
  }
}

module.exports = new AdminController();

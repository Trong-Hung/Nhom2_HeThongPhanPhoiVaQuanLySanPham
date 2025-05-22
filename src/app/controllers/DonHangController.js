const DonHang = require("../models/DonHang");

class DonHangController {
  // ADMIN: Danh sách đơn hàng
  async index(req, res) {
    const orders = await DonHang.find().sort({ createdAt: -1 });
    const statuses = ["Chờ xác nhận", "Đang giao", "Đã giao"];
    res.render("admin/qldonhang", {
      orders,
      statuses,
      currentStatus: "Chờ xác nhận",
    });
  }
  // ADMIN: Cập nhật trạng thái đơn hàng
  async updateStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;

    await DonHang.findByIdAndUpdate(id, { status });
    res.redirect("/admin/donhang"); // Chuyển hướng đến danh sách đơn hàng
  }

  async confirmReceived(req, res) {
  const { id } = req.params;
  const order = await DonHang.findById(id);

  if (!order || order.status !== "Đã giao") {
    return res.status(400).send("Đơn hàng không hợp lệ hoặc đã được xác nhận.");
  }

  order.status = "Hoàn thành"; // 🚀 Cập nhật trạng thái
  await order.save();

  return res.redirect(`/donhang/${id}`); // 🔥 Chuyển hướng về chi tiết đơn hàng
}



  // USER: Hủy đơn
  async cancel(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const order = await DonHang.findById(id);

      if (!order) {
        return res.status(404).send("Không tìm thấy đơn hàng.");
      }

      // Kiểm tra trạng thái trước khi hủy
      if (order.status !== "Chờ xác nhận") {
        return res.status(400).send("Không thể hủy đơn hàng ở trạng thái này.");
      }

      // Cập nhật trạng thái và lý do hủy
      order.status = "Đã hủy";
      order.cancelReason = reason;
      await order.save();

      // Chuyển hướng về trang chi tiết đơn hàng
      return res.redirect(`/donhang/${id}`);
    } catch (err) {
      console.error("Lỗi khi hủy đơn hàng:", err);
      return res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
    }
  }

  async viewOrder(req, res) {
  try {
    const { id } = req.params;
    const order = await DonHang.findById(id);

    if (!order) {
      return res.status(404).send("Không tìm thấy đơn hàng.");
    }

    res.render("user/chitietdonhang", { order });
  } catch (err) {
    console.error("Lỗi khi lấy đơn hàng:", err);
    res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
  }
}



  // USER: Danh sách đơn hàng
  async userOrders(req, res) {
    if (!req.session.user) {
      return res.redirect("/auth/login");
    }

    const userId = req.session.user._id;
    const orders = await DonHang.find({ userId }).sort({ createdAt: -1 });

    res.render("user/donhangme", { orders }); // Đảm bảo đường dẫn đúng
  }
}

module.exports = new DonHangController();

const Warehouse = require("../models/Warehouse");
const DonHang = require("../models/DonHang");

class ManagerController {
  async dashboard(req, res) {
    try {
      const warehouseId = req.session.user.warehouseId;
      const warehouse = await Warehouse.findById(warehouseId);
      const orders = await DonHang.find({ warehouseId });

      res.render("manager/dashboard", { warehouse, orders });
    } catch {
      res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
    }
  }

  async viewOrders(req, res) {
    try {
      const warehouseId = req.session.user.warehouseId;
      const orders = await DonHang.find({ warehouseId });

      res.render("manager/orders", { orders });
    } catch {
      res.status(500).send("Lỗi hệ thống, vui lòng thử lại sau.");
    }
  }
}

module.exports = new ManagerController();
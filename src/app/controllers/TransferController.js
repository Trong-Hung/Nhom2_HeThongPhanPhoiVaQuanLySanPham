const Transfer = require("../models/Transfer");
const Warehouse = require("../models/Warehouse");
const mongoose = require("mongoose");

class TransferController {
  // Hiển thị form tạo phiếu điều chuyển
  async createTransferView(req, res) {
    try {
      // Lấy danh sách kho
      const warehouses = await Warehouse.find().populate("products.productId");

      // Logging để kiểm tra danh sách kho
      console.log("Danh sách kho:", warehouses);

      res.render("transfers/createTransfer", { warehouses });
    } catch (err) {
      console.error("Lỗi khi hiển thị form tạo phiếu điều chuyển:", err);
      res.status(500).send("Lỗi hệ thống!");
    }
  }

  // Xử lý tạo phiếu điều chuyển
  async createTransferRequest(req, res) {
    try {
      const { sourceWarehouse, destinationWarehouse, items } = req.body;

      // Kiểm tra dữ liệu đầu vào
      if (!sourceWarehouse || !destinationWarehouse || !items) {
        return res.status(400).send("Dữ liệu không hợp lệ!");
      }

      // Tạo phiếu điều chuyển
      const newTransfer = new Transfer({
        sourceWarehouse,
        destinationWarehouse,
        items: Object.entries(items).map(([productId, quantity]) => ({
          productId,
          quantity: parseInt(quantity, 10),
        })),
        status: "Pending",
      });

      await newTransfer.save();
      res.redirect("/admin/transfers");
    } catch (err) {
      console.error("Lỗi khi tạo phiếu điều chuyển:", err);
      res.status(500).send("Lỗi hệ thống!");
    }
  }

  // Xác nhận yêu cầu điều chuyển
  async approveTransfer(req, res) {
    try {
      const transfer = await Transfer.findById(req.params.id).populate("items.productId");
      if (!transfer) return res.status(404).send("Không tìm thấy yêu cầu điều chuyển!");

      const sourceWarehouse = await Warehouse.findById(transfer.sourceWarehouse).populate("products.productId");
      const destinationWarehouse = await Warehouse.findById(transfer.destinationWarehouse).populate("products.productId");

      for (const item of transfer.items) {
        const productEntry = sourceWarehouse.products.find(
          (p) => p.productId._id.toString() === item.productId._id.toString()
        );

        if (!productEntry || productEntry.quantity < item.quantity) {
          return res.status(400).send(`Không đủ hàng tồn kho cho sản phẩm: ${item.productId.name}`);
        }

        // Giảm số lượng ở kho nguồn
        productEntry.quantity -= item.quantity;

        // Tăng số lượng ở kho đích
        const destProductEntry = destinationWarehouse.products.find(
          (p) => p.productId._id.toString() === item.productId._id.toString()
        );
        if (destProductEntry) {
          destProductEntry.quantity += item.quantity;
        } else {
          destinationWarehouse.products.push({
            productId: item.productId._id,
            quantity: item.quantity,
          });
        }
      }

      // Lưu thay đổi
      await sourceWarehouse.save();
      await destinationWarehouse.save();

      // Cập nhật trạng thái yêu cầu
      transfer.status = "Approved";
      await transfer.save();

      res.redirect("/admin/transfers");
    } catch (err) {
      console.error("Lỗi khi xác nhận yêu cầu điều chuyển:", err);
      res.status(500).send("Lỗi hệ thống!");
    }
  }
  async listTransfers(req, res) {
    try {
      const transfers = await Transfer.find()
        .populate("sourceWarehouse", "name")
        .populate("destinationWarehouse", "name")
        .populate("items.productId", "name sku category");

      res.render("transfers/listTransfers", { transfers });
    } catch (err) {
      console.error("Lỗi khi lấy danh sách phiếu điều chuyển:", err);
      res.status(500).send("Lỗi hệ thống!");
    }
  }
}

module.exports = new TransferController();
const Transfer = require("../models/Transfer");
const Warehouse = require("../models/Warehouse");
const User = require("../models/User");
const { v4: uuidv4 } = require("uuid"); // Sử dụng UUID để tạo giá trị unique


exports.renderCreateTransferForm = async (req, res) => {
  try {
    const warehouses = await Warehouse.find().populate("products.productId"); // Lấy danh sách kho và sản phẩm
    res.render("transfers/createTransfer", { warehouses }); // Truyền danh sách kho và sản phẩm vào view
  } catch (error) {
    console.error("Lỗi khi lấy danh sách kho:", error.message);
    res.status(500).send("Có lỗi xảy ra.");
  }
};

exports.createTransfer = async (req, res) => {
  try {
    const { sourceWarehouse, destinationWarehouse, items } = req.body;

    // Lọc các sản phẩm có số lượng > 0
    const filteredItems = Object.entries(items)
      .filter(([productId, quantity]) => parseInt(quantity) > 0)
      .map(([productId, quantity]) => ({
        productId,
        quantity: parseInt(quantity),
      }));

    if (filteredItems.length === 0) {
      return res.status(400).send("Vui lòng chọn ít nhất một sản phẩm để điều chuyển.");
    }

    // Đề xuất shipper từ kho nguồn
    const suggestedShipper = await User.findOne({ role: "shipper", warehouseId: sourceWarehouse });
    if (!suggestedShipper) {
      return res.status(400).send("Không tìm thấy shipper phù hợp.");
    }

    // Tạo phiếu điều chuyển với transferId unique
    const transfer = new Transfer({
      transferId: uuidv4(), // Tạo giá trị transferId unique
      sourceWarehouse,
      destinationWarehouse,
      items: filteredItems,
      assignedShipper: suggestedShipper._id,
      status: "Đang sắp xếp",
    });

    await transfer.save();
    res.status(201).send(`Tạo phiếu điều chuyển thành công: ${transfer.transferId}`);
  } catch (error) {
    console.error("Lỗi khi tạo phiếu điều chuyển:", error.message);
    res.status(500).send("Có lỗi xảy ra.");
  }
};

exports.listTransfers = async (req, res) => {
  try {
    const transfers = await Transfer.find()
      .populate("sourceWarehouse")
      .populate("destinationWarehouse")
      .populate("assignedShipper");

    res.render("transfers/listTransfers", { transfers }); // Render view và truyền dữ liệu
  } catch (error) {
    console.error("Lỗi khi lấy danh sách phiếu điều chuyển:", error.message);
    res.status(500).send("Có lỗi xảy ra.");
  }
};

exports.updateTransferStatus = async (req, res) => {
  try {
    const { transferId, status } = req.body;

    const transfer = await Transfer.findById(transferId);
    if (!transfer) {
      return res.status(404).send("Không tìm thấy phiếu điều chuyển.");
    }

    transfer.status = status;
    await transfer.save();

    res.status(200).send(`Cập nhật trạng thái thành công: ${transfer.status}`);
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái phiếu điều chuyển:", error.message);
    res.status(500).send("Có lỗi xảy ra.");
  }
};
exports.getTransferDetail = async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id)
      .populate("sourceWarehouse")
      .populate("destinationWarehouse")
      .populate("assignedShipper")
      .populate("items.productId"); // Populate từ model Sanpham

    if (!transfer) {
      return res.status(404).send("Không tìm thấy phiếu điều chuyển.");
    }

    // Lấy danh sách shipper từ database
    const shippers = await User.find({ role: "shipper" });

    res.render("transfers/transferDetail", { transfer, shippers }); // Truyền danh sách shipper vào view
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết phiếu điều chuyển:", error.message);
    res.status(500).send("Có lỗi xảy ra.");
  }
};

exports.assignShipper = async (req, res) => {
  try {
    const { id } = req.params; // ID của phiếu điều chuyển
    const { shipperId } = req.body; // ID của shipper được gán

    const transfer = await Transfer.findById(id);
    if (!transfer) {
      return res.status(404).send("Không tìm thấy phiếu điều chuyển.");
    }

    const shipper = await User.findById(shipperId);
    if (!shipper || shipper.role !== "shipper") {
      return res.status(400).send("Shipper không hợp lệ.");
    }

    // Gán shipper và cập nhật trạng thái
    transfer.assignedShipper = shipperId;
    transfer.status = "Đang vận chuyển";
    await transfer.save();

    res.redirect(`/admin/transfers/${id}`); // Quay lại trang chi tiết phiếu điều chuyển
  } catch (error) {
    console.error("Lỗi khi gán shipper:", error.message);
    res.status(500).send("Có lỗi xảy ra.");
  }
};


exports.listTransfersByShipper = async (req, res) => {
  try {
    const { shipperId } = req.params; // ID của shipper

    const transfers = await Transfer.find({ assignedShipper: shipperId })
      .populate("sourceWarehouse")
      .populate("destinationWarehouse")
      .populate("assignedShipper");

    res.render("transfers/listTransfersByShipper", { transfers });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách phiếu điều chuyển:", error.message);
    res.status(500).send("Có lỗi xảy ra.");
  }
};

exports.assignShipper = async (req, res) => {
  try {
    const { id } = req.params; // ID của phiếu điều chuyển
    const { shipperId } = req.body; // ID của shipper được gán

    const transfer = await Transfer.findById(id);
    if (!transfer) {
      return res.status(404).send("Không tìm thấy phiếu điều chuyển.");
    }

    const shipper = await User.findById(shipperId);
    if (!shipper || shipper.role !== "shipper") {
      return res.status(400).send("Shipper không hợp lệ.");
    }

    // Gán shipper và cập nhật trạng thái
    transfer.assignedShipper = shipperId;
    transfer.status = "Đang vận chuyển";
    await transfer.save();

    res.redirect(`/admin/transfers/${id}`); // Quay lại trang chi tiết phiếu điều chuyển
  } catch (error) {
    console.error("Lỗi khi gán shipper:", error.message);
    res.status(500).send("Có lỗi xảy ra.");
  }
};
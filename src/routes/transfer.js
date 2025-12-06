const express = require("express");
const router = express.Router();
const TransferController = require("../app/controllers/TransferController");
const { isAdmin } = require("../middlewares/role");

router.post("/create", isAdmin, TransferController.createTransfer); // Tạo phiếu điều chuyển
router.get("/list", isAdmin, TransferController.listTransfers); // Lấy danh sách phiếu điều chuyển
router.post("/update-status", isAdmin, TransferController.updateTransferStatus); // Cập nhật trạng thái phiếu điều chuyển

module.exports = router;
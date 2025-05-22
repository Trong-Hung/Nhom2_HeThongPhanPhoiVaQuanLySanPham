// routes/donhang.js
const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middlewares/role");
const DonHangController = require("../app/controllers/DonHangController");

// ADMIN
router.get("/admin/donhang", DonHangController.index);
router.post("/admin/donhang/update/:id", DonHangController.updateStatus);

// USER
router.get("/", isAuthenticated, DonHangController.userOrders);
router.post("/cancel/:id", isAuthenticated, DonHangController.cancel);
router.get("/:id", isAuthenticated, DonHangController.viewOrder);
router.post("/confirm-received/:id", isAuthenticated, DonHangController.confirmReceived);




module.exports = router;

// routes/donhang.js
const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middlewares/role");
const DonHangController = require("../app/controllers/DonHangController");

// ADMIN
router.post("/admin/donhang/:id/assign-truck", DonHangController.assignTruck);
router.get("/admin/donhang", DonHangController.index);
router.post("/admin/donhang/update/:id", DonHangController.updateStatus);
// USER
router.get("/donhangme", isAuthenticated, DonHangController.userOrders);
router.get("/", isAuthenticated, DonHangController.userOrders);
router.post("/cancel/:id", isAuthenticated, DonHangController.cancel);
router.post(
  "/confirm-received/:id",
  isAuthenticated,
  DonHangController.confirmReceived
);
router.get("/:id", isAuthenticated, DonHangController.viewOrder);

module.exports = router;

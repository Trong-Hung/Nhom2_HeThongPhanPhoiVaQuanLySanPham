const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middlewares/role");
const DonHangController = require("../app/controllers/DonHangController");

router.get('/donhangme', isAuthenticated, DonHangController.userOrders);

module.exports = router;
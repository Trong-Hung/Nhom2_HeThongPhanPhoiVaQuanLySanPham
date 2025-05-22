const express = require("express");
const router = express.Router();
const { isShipper } = require("../middlewares/role"); // ✅ Import đúng cách

const ShipperController = require("../app/controllers/ShipperController");




router.get("/dang_sap_xep", ShipperController.showPendingOrders); // 🔥 Hiển thị đơn hàng chờ nhận
router.get("/dang_van_chuyen", ShipperController.showActiveOrders); // 🔥 Hiển thị đơn đã nhận
router.post("/confirm/:id", ShipperController.confirmOrder); // 🔥 Xác nhận đơn hàng
router.get("/directions/:id", ShipperController.getDirections); // 🔥 Chỉ đường
router.get("/maps/:id", ShipperController.getDirections); 





module.exports = router;

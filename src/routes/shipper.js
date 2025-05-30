const express = require("express");
const router = express.Router();
const { isShipper } = require("../middlewares/role"); 
const ShipperController = require("../app/controllers/ShipperController");




router.get("/dang_sap_xep", ShipperController.showPendingOrders); 
router.get("/dang_van_chuyen", ShipperController.showActiveOrders); 
router.post("/confirm/:id", ShipperController.confirmOrder); 
router.get("/directions/:id", ShipperController.getDirections); 
router.get("/maps/:id", ShipperController.getDirections); 
router.get('/order/:id', ShipperController.viewOrderDetail);
router.get('/dang-van-chuyen', ShipperController.showActiveOrders);
router.post('/donhang/mark-delivered/:id', ShipperController.markDelivered);
router.get('/da-giao', ShipperController.showDeliveredOrders);






module.exports = router;

const express = require("express");
const router = express.Router();
const warehouseController = require("../controllers/warehouseController");

router.get("/warehouses", warehouseController.getWarehouses);
router.get("/sanphams", warehouseController.getSanphams);
router.post("/import", warehouseController.importSanpham);

module.exports = router;

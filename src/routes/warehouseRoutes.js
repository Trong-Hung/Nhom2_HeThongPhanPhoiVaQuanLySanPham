const express = require("express");
const router = express.Router();
const warehouseController = require("../controllers/warehouseController");

router.get("/warehouses", warehouseController.listWarehouses);
router.get("/sanphams", warehouseController.listSanphams);
router.post("/import", warehouseController.importSanpham);

module.exports = router;

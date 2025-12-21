const express = require("express");
const router = express.Router();
const TruckController = require("../app/controllers/TruckController");
const { isAdmin } = require('../middlewares/role');

// Danh sách xe
router.get("/",isAdmin, TruckController.index);
// Form thêm xe
router.get("/create", isAdmin, TruckController.create);
// Lưu xe mới
router.post("/store", isAdmin, TruckController.store);
// Form sửa xe
router.get("/:id/edit", isAdmin, TruckController.edit);
// Cập nhật xe
router.post("/:id/update", isAdmin, TruckController.update);
// Xóa xe
router.post("/:id/delete", isAdmin, TruckController.delete);
module.exports = router;
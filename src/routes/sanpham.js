const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const sanphamController = require("../app/controllers/SanphamController");
const { isAdmin } = require('../middlewares/role');

// Các route chỉ cho admin
router.post("/store", isAdmin, upload.single("image"), sanphamController.store);
router.get("/create", isAdmin, sanphamController.create);
router.get("/:id/edit", isAdmin, sanphamController.edit);
router.delete("/:id", isAdmin, sanphamController.delete);
router.put("/:id", isAdmin, upload.single("image"), sanphamController.update);

// Route công khai: ai cũng xem được chi tiết sản phẩm
router.get('/:slug', sanphamController.show);

module.exports = router;
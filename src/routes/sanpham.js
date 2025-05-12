const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const sanphamController = require("../app/controllers/SanphamController");


router.post("/store", upload.single("image"), sanphamController.store);
router.get("/create", sanphamController.create); // GET /news
// router.post("/store", courseController.store); // GET /news

router.get("/:id/edit", sanphamController.edit); // GET /news
router.delete("/:id", sanphamController.delete); // GET /news
router.put("/:id", upload.single("image"), sanphamController.update);

router.get("/:slug", sanphamController.show); // GET /news

module.exports = router;

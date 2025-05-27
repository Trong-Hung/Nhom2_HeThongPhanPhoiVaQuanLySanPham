const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const sanphamController = require("../app/controllers/SanphamController");


router.post("/store", upload.single("image"), sanphamController.store);
router.get("/create", sanphamController.create); 
// router.post("/store", courseController.store); 

router.get("/:id/edit", sanphamController.edit); 
router.delete("/:id", sanphamController.delete); 
router.put("/:id", upload.single("image"), sanphamController.update);

router.get("/:slug", sanphamController.show); 

module.exports = router;

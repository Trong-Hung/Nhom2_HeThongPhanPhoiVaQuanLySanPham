const express = require("express");
const router = express.Router();
const categoryController = require("../app/controllers/CategoryController");
const { isAdmin } = require("../middlewares/role");

router.get("/create", isAdmin, categoryController.create);
router.post("/store", isAdmin, categoryController.store);
router.get("/list", isAdmin, categoryController.list);
router.get("/:id/edit", isAdmin, categoryController.edit);
router.post("/:id/update", isAdmin, categoryController.update);
router.delete("/:id", isAdmin, categoryController.delete);

module.exports = router;

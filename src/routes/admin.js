const express = require("express");
const router = express.Router();
const { isAdmin } = require("../middlewares/role");
const adminController = require("../app/controllers/DonHangController");
const AuthController = require("../app/controllers/AuthController");
const warehouseController = require("../app/controllers/warehouseController");




// Route quản lý đơn hàng
router.get("/qldonhang", isAdmin, adminController.index);
router.post("/donhang/update/:id", isAdmin, adminController.updateStatus);
router.get("/donhang", isAdmin, adminController.index);
router.get("/qldonhang", isAdmin, AuthController.showOrders);
router.post("/assign-shipper/:id", isAdmin, AuthController.assignShipper);


router.get("/quanlytaikhoan", isAdmin, AuthController.manageAccounts);
router.get("/taotaikhoan", isAdmin, AuthController.showCreateAccount);
router.post("/taotaikhoan", isAdmin, AuthController.createAccount);

router.post("/update", isAdmin, AuthController.updateUser);
router.get("/edit/:id", isAdmin, AuthController.viewEditUser);

router.get("/nhaphang", isAdmin, warehouseController.importView); // ✅ Hiển thị giao diện nhập hàng
router.post("/nhaphang", isAdmin, warehouseController.importSanpham); // ✅ Xử lý nhập hàng vào kho

router.get("/kho/add", isAdmin, warehouseController.addWarehouseView);
router.post("/kho/add", isAdmin, warehouseController.addWarehouse); 

router.get("/kho/create", isAdmin, warehouseController.createWarehouseView);
router.post("/kho/create", isAdmin, warehouseController.createWarehouse);
router.get("/kho/list", isAdmin, warehouseController.listWarehouses);
router.get("/kho/:id", isAdmin, warehouseController.manageWarehouse);


router.post("/kho/:id/nhaphang", isAdmin, warehouseController.importToWarehouse);





// Route trang quản trị
router.get("/", isAdmin, (req, res) => {
  res.render("admin/dashboard", {
    title: "Trang Quản Trị",
    user: req.session.user,
  });
});

module.exports = router;

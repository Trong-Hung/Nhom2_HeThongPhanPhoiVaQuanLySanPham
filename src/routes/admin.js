const express = require("express");
const router = express.Router();
const { isAdmin } = require("../middlewares/role");
const adminController = require("../app/controllers/DonHangController");
const AuthController = require("../app/controllers/AuthController");

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



// Route trang quản trị
router.get("/", isAdmin, (req, res) => {
  res.render("admin/dashboard", {
    title: "Trang Quản Trị",
    user: req.session.user,
  });
});

module.exports = router;

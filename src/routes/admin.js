const express = require("express");
const router = express.Router();
const { isAdmin } = require("../middlewares/role");
const DonHangController = require("../app/controllers/DonHangController");
const UserController = require("../app/controllers/UserController");
const warehouseController = require("../app/controllers/WarehouseController");
const TransferController = require("../app/controllers/TransferController");

// Quản lý đơn hàng
router.get("/qldonhang", isAdmin, DonHangController.index);
router.post("/donhang/update/:id", isAdmin, DonHangController.updateStatus);
router.get("/donhang", isAdmin, DonHangController.index);
router.post(
  "/donhang/assign-shipper/:id",
  isAdmin,
  DonHangController.assignShipper
);
router.post(
  "/donhang/auto-assign-shipper/:id",
  isAdmin,
  DonHangController.autoAssignShipper
);
router.post(
  "/donhang/unassign-shipper/:id",
  isAdmin,
  DonHangController.unassignShipper
);
router.post(
  "/force-optimize-all",
  isAdmin,
  DonHangController.forceOptimizeAllShippers
);
router.get("/debug/force-optimize", DonHangController.debugForceOptimize);
router.get(
  "/debug/force-optimize/:shipperId",
  DonHangController.debugForceOptimize
);
router.get("/donhang/:id", isAdmin, DonHangController.viewOrderDetail);
router.get(
  "/summary",
  isAdmin,
  (req, res, next) => {
    console.log("Đã vào route /admin/summary");
    next();
  },
  DonHangController.summary
);
router.get("/shipper-dashboard", isAdmin, DonHangController.shipperDashboard);


// Route tạo phiếu điều chuyển
router.get("/transfers", isAdmin, TransferController.listTransfers); // Hiển thị danh sách phiếu điều chuyển
router.get("/transfers/create", isAdmin, TransferController.createTransferView); // Hiển thị form tạo phiếu điều chuyển
router.post("/transfers/create", isAdmin, TransferController.createTransferRequest); // Xử lý tạo phiếu điều chuyển

// Route duyệt phiếu điều chuyển
router.post("/transfers/:id/approve", isAdmin, TransferController.approveTransfer); // Xác nhận yêu cầu điều chuyển

// Quản lý tài khoản
router.get("/quanlytaikhoan", isAdmin, UserController.manageAccounts);
router.get("/taotaikhoan", isAdmin, UserController.showCreateAccount);
router.post("/taotaikhoan", isAdmin, UserController.createAccount);
router.post("/delete-user/:id", isAdmin, UserController.deleteUser);
router.post("/update", isAdmin, UserController.updateUser);
router.get("/edit/:id", isAdmin, UserController.viewEditUser);

// Quản lý kho
router.get("/kho/create", isAdmin, warehouseController.createWarehouseView); // Chỉ giữ route này
router.post("/kho/create", isAdmin, warehouseController.createWarehouse);

router.get("/kho", isAdmin, warehouseController.listWarehouses); // Chỉ giữ route này
router.get("/kho/:id", isAdmin, warehouseController.manageWarehouse);
router.get("/kho/list", isAdmin, warehouseController.listWarehouses);
router.post("/kho/:id/nhaphang", isAdmin, warehouseController.importSanpham);
router.get("/kho/:id/edit", isAdmin, warehouseController.editWarehouseView);
router.put("/kho/:id", isAdmin, warehouseController.updateWarehouse);
router.delete("/kho/:id", isAdmin, warehouseController.deleteWarehouse);

// API để lấy danh sách warehouses cho frontend
router.get("/api/warehouses", isAdmin, warehouseController.getWarehousesAPI);

// Route Optimization
router.get("/route-optimization", isAdmin, (req, res) => {
  res.render("admin/route_optimization", {
    title: "Tối ưu tuyến đường giao hàng",
    user: req.session.user,
  });
});

// API để lấy danh sách warehouses cho frontend
router.get("/api/warehouses", isAdmin, warehouseController.getWarehousesAPI);

// Trang dashboard quản trị
router.get("/", isAdmin, (req, res) => {
  res.render("admin/dashboard", {
    title: "Trang Quản Trị",
    user: req.session.user,
  });
});

module.exports = router;

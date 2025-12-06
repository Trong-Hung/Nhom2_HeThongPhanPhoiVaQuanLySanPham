const express = require("express");
const router = express.Router();
const { isShipper } = require("../middlewares/role"); // Chỉ dùng file này
const ShipperController = require("../app/controllers/ShipperController");

// =================== WEB ROUTES CHO ADMIN/WEB ===================
router.get("/dang_sap_xep", isShipper, ShipperController.showPendingOrders);
router.get("/dang_van_chuyen", isShipper, ShipperController.showActiveOrders);
router.post("/confirm/:id", isShipper, ShipperController.confirmOrder);
router.get("/directions/:id", isShipper, ShipperController.getDirections);
router.get("/maps/:id", isShipper, ShipperController.getDirections);
router.get("/order/:id", isShipper, ShipperController.viewOrderDetail);
router.get("/dang-van-chuyen", isShipper, ShipperController.showActiveOrders);
router.post(
  "/donhang/mark-delivered/:id",
  isShipper,
  ShipperController.markDelivered
);
router.get("/da-giao", isShipper, ShipperController.showDeliveredOrders);

// =================== API ROUTES CHO MOBILE APP ===================
// Các routes trả về JSON cho Flutter app

// API: Lấy đơn hàng đang sắp xếp (JSON)
// (SỬA LẠI DÒNG BỊ LỖI COPY-PASTE CỦA BẠN Ở ĐÂY)
router.get(
  "/api/pending-orders",
  isShipper,
  ShipperController.apiGetPendingOrders
);

// API: Lấy đơn hàng đang vận chuyển (JSON)
router.get(
  "/api/active-orders",
  isShipper,
  ShipperController.apiGetActiveOrders
);

// API: Lấy đơn hàng đã giao (JSON)
router.get(
  "/api/delivered-orders",
  isShipper,
  ShipperController.apiGetDeliveredOrders
);

// API: Lấy chi tiết đơn hàng (JSON)
router.get("/api/order/:id", isShipper, ShipperController.apiGetOrderDetail);

// API: Nhận đơn hàng (JSON)
router.post("/api/confirm/:id", isShipper, ShipperController.apiConfirmOrder);

// API: Đánh dấu đã giao (JSON)
// (SỬA LỖI GÕ NHẦM "isShispper" CỦA BẠN Ở ĐÂY)
router.post(
  "/api/mark-delivered/:id",
  isShipper,
  ShipperController.apiMarkAsDelivered
);

// API: Lấy thông tin chỉ đường (JSON)
router.get(
  "/api/directions/:id",
  isShipper,
  ShipperController.apiGetDirections
);

// === API TỐI ƯU LỘ TRÌNH MỚI ===
router.post(
  "/api/my-routes/optimize", // API mới của chúng ta
  isShipper, // Chỉ cần isShipper
  ShipperController.optimizeMyRoutes // Gọi hàm trong Controller
);

// === MANUAL ROUTE OPTIMIZATION ===
router.post("/optimize-routes", isShipper, ShipperController.optimizeMyRoute);

// === TRANSFER MANAGEMENT ROUTES ===
const ShipperTransferController = require("../app/controllers/ShipperTransferController");

// Specific routes first (to avoid conflicts with :id parameter)
router.get(
  "/transfers/dang-sap-xep",
  isShipper,
  ShipperTransferController.shipperShowPendingTransfers
);

router.get(
  "/transfers/dang-van-chuyen",
  isShipper,
  ShipperTransferController.shipperShowActiveTransfers
);

router.get(
  "/transfers/da-giao",
  isShipper,
  ShipperTransferController.shipperShowCompletedTransfers
);

// DEBUG route before parameterized routes
router.get(
  "/debug/transfers",
  isShipper,
  ShipperTransferController.debugAllTransfers
);

// Parameterized routes last
router.get(
  "/transfers/:id",
  isShipper,
  ShipperTransferController.shipperViewTransferDetail
);

router.post(
  "/transfers/confirm/:id",
  isShipper,
  ShipperTransferController.shipperConfirmTransfer
);

router.post(
  "/transfer/mark-delivered/:id",
  isShipper,
  ShipperTransferController.shipperMarkTransferDelivered
);

// === TRANSFER ROUTE OPTIMIZATION ===
router.post(
  "/optimize-transfer-routes",
  isShipper,
  ShipperTransferController.optimizeMyTransferRoute
);

// === DEBUG ROUTE ĐỂ RESET ROUTE ORDER ===
router.get(
  "/debug/reset-route-order",
  isShipper,
  ShipperController.debugResetRouteOrder
);
// ===========================================

module.exports = router;

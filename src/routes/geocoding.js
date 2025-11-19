const express = require("express");
const router = express.Router();
const GeocodingController = require("../app/controllers/GeocodingController");

// Middleware kiểm tra quyền admin
const requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ error: "Chỉ admin mới có quyền truy cập" });
  }
  next();
};

// === GEOCODING MANAGEMENT ROUTES ===

// Phân tích chất lượng geocoding
router.get(
  "/analyze",
  requireAdmin,
  GeocodingController.analyzeGeocodingQuality
);

// Batch fix geocoding issues
router.post("/batch-fix", requireAdmin, GeocodingController.batchFixGeocode);

// Test geocoding cho địa chỉ cụ thể
router.post("/test", requireAdmin, GeocodingController.testGeocode);

module.exports = router;

const express = require("express");
const router = express.Router();
const RecommendationController = require("../app/controllers/RecommendationController");

// API Routes - Dành cho mobile app và AJAX calls
router.get("/api/recommendations", RecommendationController.getRecommendations);
router.get(
  "/api/similar/:productId",
  RecommendationController.getSimilarProducts
);
router.get("/api/popular", RecommendationController.getPopularProducts);
router.get(
  "/api/category/:categoryId",
  RecommendationController.getRecommendationsByCategory
);

// Web Routes - Dành cho website
router.get(
  "/recommendations",
  RecommendationController.showRecommendationsPage
);

module.exports = router;

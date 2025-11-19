const ProductRecommendationService = require("../../services/ProductRecommendationService");
const Sanpham = require("../models/Sanpham");

class RecommendationController {
  // API lấy đề xuất sản phẩm cho user
  async getRecommendations(req, res) {
    try {
      const userId = req.session.user?._id;
      const limit = parseInt(req.query.limit) || 8;

      let recommendations;

      if (userId) {
        // User đã đăng nhập - đề xuất dựa trên lịch sử
        recommendations =
          await ProductRecommendationService.getRecommendationsForUser(
            userId,
            limit
          );
      } else {
        // Khách vãng lai - đề xuất sản phẩm phổ biến
        recommendations =
          await ProductRecommendationService.getGuestRecommendations(limit);
      }

      res.json({
        success: true,
        data: recommendations,
        message: "Lấy đề xuất sản phẩm thành công",
      });
    } catch (error) {
      console.error("Lỗi API đề xuất sản phẩm:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
      });
    }
  }

  // API lấy sản phẩm tương tự
  async getSimilarProducts(req, res) {
    try {
      const { productId } = req.params;
      const limit = parseInt(req.query.limit) || 4;

      const similarProducts =
        await ProductRecommendationService.getSimilarProducts(productId, limit);

      res.json({
        success: true,
        data: similarProducts,
        message: "Lấy sản phẩm tương tự thành công",
      });
    } catch (error) {
      console.error("Lỗi API sản phẩm tương tự:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
      });
    }
  }

  // API lấy sản phẩm phổ biến
  async getPopularProducts(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 8;
      const excludeIds = req.query.exclude ? req.query.exclude.split(",") : [];

      const popularProducts =
        await ProductRecommendationService.getPopularProducts(
          limit,
          excludeIds
        );

      res.json({
        success: true,
        data: popularProducts,
        message: "Lấy sản phẩm phổ biến thành công",
      });
    } catch (error) {
      console.error("Lỗi API sản phẩm phổ biến:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
      });
    }
  }

  // API lấy đề xuất theo danh mục
  async getRecommendationsByCategory(req, res) {
    try {
      const { categoryId } = req.params;
      const limit = parseInt(req.query.limit) || 6;
      const excludeIds = req.query.exclude ? req.query.exclude.split(",") : [];

      const recommendations =
        await ProductRecommendationService.getRecommendationsByCategory(
          categoryId,
          limit,
          excludeIds
        );

      res.json({
        success: true,
        data: recommendations,
        message: "Lấy đề xuất theo danh mục thành công",
      });
    } catch (error) {
      console.error("Lỗi API đề xuất theo danh mục:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
      });
    }
  }

  // Hiển thị trang đề xuất sản phẩm (Web)
  async showRecommendationsPage(req, res) {
    try {
      const userId = req.session.user?._id;

      let recommendations, popularProducts;

      if (userId) {
        [recommendations, popularProducts] = await Promise.all([
          ProductRecommendationService.getRecommendationsForUser(userId, 8),
          ProductRecommendationService.getPopularProducts(8),
        ]);
      } else {
        recommendations =
          await ProductRecommendationService.getGuestRecommendations(12);
        popularProducts = recommendations.slice(0, 8);
      }

      res.render("sanpham/recommendations", {
        recommendations,
        popularProducts,
        currentUser: req.session.user,
        pageTitle: "Sản phẩm đề xuất",
      });
    } catch (error) {
      console.error("Lỗi hiển thị trang đề xuất:", error);
      res.status(500).send("Lỗi hệ thống");
    }
  }
}

module.exports = new RecommendationController();

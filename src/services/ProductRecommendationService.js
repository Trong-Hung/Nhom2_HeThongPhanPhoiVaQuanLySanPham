const Sanpham = require("../app/models/Sanpham");
const Category = require("../app/models/Category");
const DonHang = require("../app/models/DonHang");
const User = require("../app/models/User");

class ProductRecommendationService {
  // Helper function để format sản phẩm với ảnh (giống như HomeController)
  formatProduct(product) {
    return {
      _id: product._id,
      name: product.name,
      description: product.description,
      slug: product.slug,
      price: product.price,
      image: product.image
        ? `/uploads/${product.image}`
        : "/uploads/1748778137374.jpg",
      category: product.category,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  // Helper function để format nhiều sản phẩm
  formatProducts(products) {
    return products.map((product) => this.formatProduct(product));
  }

  // Đề xuất sản phẩm dựa trên lịch sử mua hàng
  async getRecommendationsForUser(userId, limit = 8) {
    try {
      // 1. Lấy lịch sử đơn hàng của user
      const userOrders = await DonHang.find({
        userId: userId,
        status: { $in: ["Đã giao", "Hoàn thành"] },
      }).populate("items.productId");

      // 2. Lấy danh mục đã mua
      const purchasedCategories = new Set();
      const purchasedProducts = new Set();

      userOrders.forEach((order) => {
        order.items.forEach((item) => {
          if (item.productId) {
            purchasedProducts.add(item.productId._id.toString());
            if (item.productId.category) {
              purchasedCategories.add(item.productId.category.toString());
            }
          }
        });
      });

      // 3. Tìm sản phẩm cùng danh mục (nhưng chưa mua)
      let recommendations = [];

      if (purchasedCategories.size > 0) {
        const categoryRecommendations = await Sanpham.find({
          category: { $in: Array.from(purchasedCategories) },
          _id: { $nin: Array.from(purchasedProducts) },
          deleted: { $ne: true },
        })
          .populate("category", "name")
          .sort({ createdAt: -1 })
          .limit(limit / 2);

        // Format ảnh cho sản phẩm theo danh mục
        const formattedCategoryRecs = this.formatProducts(
          categoryRecommendations
        );
        recommendations.push(...formattedCategoryRecs);
      }

      // 4. Thêm sản phẩm phổ biến (best sellers)
      const popularProducts = await this.getPopularProducts(
        limit - recommendations.length,
        Array.from(purchasedProducts)
      );
      recommendations.push(...popularProducts);

      // 5. Nếu vẫn chưa đủ, thêm sản phẩm mới nhất
      if (recommendations.length < limit) {
        const latestProducts = await Sanpham.find({
          _id: {
            $nin: [
              ...Array.from(purchasedProducts),
              ...recommendations.map((p) => p._id),
            ],
          },
          deleted: { $ne: true },
        })
          .populate("category", "name")
          .sort({ createdAt: -1 })
          .limit(limit - recommendations.length);

        // Format ảnh cho sản phẩm mới nhất
        const formattedLatestProducts = this.formatProducts(latestProducts);
        recommendations.push(...formattedLatestProducts);
      }

      return recommendations.slice(0, limit);
    } catch (error) {
      console.error("Lỗi khi tạo đề xuất sản phẩm:", error);
      return await this.getFallbackRecommendations(limit);
    }
  }

  // Lấy sản phẩm phổ biến dựa trên số lượng bán
  async getPopularProducts(limit = 5, excludeIds = []) {
    try {
      // Aggregate để tính số lượng bán của mỗi sản phẩm
      const popularProducts = await DonHang.aggregate([
        {
          $match: {
            status: { $in: ["Đã giao", "Hoàn thành"] },
          },
        },
        {
          $unwind: "$items",
        },
        {
          $group: {
            _id: "$items.productId",
            totalSold: { $sum: "$items.quantity" },
            totalOrders: { $sum: 1 },
          },
        },
        {
          $sort: { totalSold: -1 },
        },
        {
          $limit: limit * 2, // Lấy nhiều hơn để filter
        },
      ]);

      const productIds = popularProducts
        .map((p) => p._id)
        .filter(
          (id) => id && excludeIds && !excludeIds.includes(id.toString())
        );

      const products = await Sanpham.find({
        _id: { $in: productIds.slice(0, limit) },
        deleted: { $ne: true },
      }).populate("category", "name");

      return this.formatProducts(products);
    } catch (error) {
      console.error("Lỗi khi lấy sản phẩm phổ biến:", error);
      return [];
    }
  }

  // Đề xuất sản phẩm cho khách vãng lai (chưa đăng nhập)
  async getGuestRecommendations(limit = 8) {
    try {
      // Lấy sản phẩm phổ biến và mới nhất
      const [popularProducts, latestProducts] = await Promise.all([
        this.getPopularProducts(limit / 2),
        Sanpham.find({ deleted: { $ne: true } })
          .populate("category", "name")
          .sort({ createdAt: -1 })
          .limit(limit / 2),
      ]);

      const recommendations = [...popularProducts, ...latestProducts];

      // Loại bỏ trùng lặp
      const uniqueRecommendations = recommendations.filter(
        (product, index, self) =>
          index ===
          self.findIndex((p) => p._id.toString() === product._id.toString())
      );

      return uniqueRecommendations.slice(0, limit);
    } catch (error) {
      console.error("Lỗi khi tạo đề xuất cho khách vãng lai:", error);
      return await this.getFallbackRecommendations(limit);
    }
  }

  // Đề xuất sản phẩm theo danh mục
  async getRecommendationsByCategory(categoryId, limit = 6, excludeIds = []) {
    try {
      const products = await Sanpham.find({
        category: categoryId,
        _id: { $nin: excludeIds },
        deleted: { $ne: true },
      })
        .populate("category", "name")
        .sort({ createdAt: -1 })
        .limit(limit);

      return this.formatProducts(products);
    } catch (error) {
      console.error("Lỗi khi tạo đề xuất theo danh mục:", error);
      return [];
    }
  }

  // Fallback: trả về sản phẩm ngẫu nhiên nếu không có đề xuất phù hợp
  async getFallbackRecommendations(limit = 8) {
    try {
      const products = await Sanpham.find({ deleted: { $ne: true } })
        .populate("category", "name")
        .sort({ createdAt: -1 })
        .limit(limit);

      return this.formatProducts(products);
    } catch (error) {
      console.error("Lỗi fallback recommendations:", error);
      return [];
    }
  }

  // Đề xuất sản phẩm tương tự
  async getSimilarProducts(productId, limit = 4) {
    try {
      const product = await Sanpham.findById(productId).populate("category");
      if (!product) return [];

      // Tìm sản phẩm cùng danh mục, khác ID
      const similarProducts = await Sanpham.find({
        category: product.category._id,
        _id: { $ne: productId },
        deleted: { $ne: true },
      })
        .populate("category", "name")
        .sort({ createdAt: -1 })
        .limit(limit);

      return this.formatProducts(similarProducts);
    } catch (error) {
      console.error("Lỗi khi tìm sản phẩm tương tự:", error);
      return [];
    }
  }
}

module.exports = new ProductRecommendationService();
